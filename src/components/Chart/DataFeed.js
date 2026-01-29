import { API_BASE_URL } from "../../config/api";

/**
 * DataFeed class for TradingView chart
 * Handles all data fetching and processing logic
 */
export class DataFeed {
  constructor(options = {}) {
    this.symbol = options.symbol || "BTCUSDT";
    this.lastBarsCache = new Map();
    this.lastPrice = null;
    this.wsConnection = null;
    this.wsStatus = "disconnected";
    this.lastFetchTime = 0;
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onLastPriceChange = options.onLastPriceChange || (() => {});
    this.dataUpdateInterval = null;
    this.reconnectTimeout = null;
    this.chartReady = false;
    window.lastBarUpdateCallback = null;
    
    // Added for real-time bar management
    this.rtTimer = null;
    this.workingBar = null;     // {slotSec, open, high, low, close, volume}
    this.lastEmittedSlot = null;
    this.currentResolution = null;
  }

  /**
   * Initialize the DataFeed for TradingView
   */
  getDatafeedObject() {
    return {
      onReady: this._onReady.bind(this),
      searchSymbols: this._searchSymbols.bind(this),
      resolveSymbol: this._resolveSymbol.bind(this),
      getBars: this._getBars.bind(this),
      subscribeBars: this._subscribeBars.bind(this),
      unsubscribeBars: this._unsubscribeBars.bind(this),
      getServerTime: this._getServerTime.bind(this),
    };
  }

  /**
   * Convert TradingView timeframe format to API format
   */
  _tvTimeframeToApiFormat(resolution) {
    if (resolution === "1") return "1m";
    if (resolution === "5") return "5m";
    if (resolution === "15") return "15m";
    if (resolution === "30") return "30m";
    if (resolution === "60") return "1h";
    if (resolution === "240") return "4h";
    if (resolution === "1D") return "1d";
    if (resolution === "1W") return "1w";
    if (resolution === "1M") return "1M";
    return "1m"; // Default
  }

  /**
   * Calculate time multiplier in seconds for different resolutions
   */
  _getTimeMultiplier(resolution) {
    if (resolution === "1D") return 86400;
    if (resolution === "1W") return 604800;
    if (resolution === "1M") return 2592000;
    return parseInt(resolution) * 60; // Convert minutes to seconds
  }

  /**
   * Calculate how many bars we should fetch for a given timeframe
   */
  _getDefaultBarsCount(resolution) {
    if (resolution === "1") return 500;  // 1m - 500 minutes
    if (resolution === "5") return 500;  // 5m - ~42 hours
    if (resolution === "15") return 300; // 15m - ~3 days
    if (resolution === "30") return 300; // 30m - ~6 days
    if (resolution === "60") return 300; // 1h - ~12 days
    if (resolution === "240") return 200; // 4h - ~33 days
    if (resolution === "1D") return 180;  // 1D - 6 months
    if (resolution === "1W") return 52;   // 1W - 1 year
    if (resolution === "1M") return 24;   // 1M - 2 years
    return 300; // Default
  }

  /**
   * Snap a unix-sec timestamp down to the bar's open slot
   */
  _snapToSlot(tsSec, timeMultiplier) {
    return Math.floor(tsSec / timeMultiplier) * timeMultiplier;
  }

  /**
   * Fill gaps between fromSlot..toSlot inclusive, step=timeMultiplier
   * barsIn: [{ time(ms), open, high, low, close, volume }]
   * returns a strictly continuous, deduped, sorted array
   */
  _fillGaps(barsIn, fromSlot, toSlot, timeMultiplier) {
    const bySlot = new Map();
    for (const b of barsIn) {
      const slot = Math.floor(b.time / 1000); // input already ms
      // dedupe: keep the latest bar per slot if needed
      const prev = bySlot.get(slot);
      if (!prev || b.time >= prev.time) bySlot.set(slot, b);
    }

    // Find last known close before fromSlot if possible
    let lastClose = null;
    if (barsIn.length) {
      // barsIn may start inside the range; infer seed from earliest
      const sorted = [...bySlot.values()].sort((a,b)=>a.time-b.time);
      const firstSlot = Math.floor(sorted[0].time/1000);
      if (firstSlot > fromSlot) {
        // Seed with the first bar's open as lastClose (fallback)
        lastClose = sorted[0].open ?? sorted[0].close;
      }
    }

    const out = [];
    for (let slot = fromSlot; slot <= toSlot; slot += timeMultiplier) {
      const have = bySlot.get(slot);
      if (have) {
        lastClose = have.close;
        out.push(have);
      } else {
        // synth bar from lastClose if we have it; else leave empty until we do
        if (lastClose != null) {
          out.push({
            time: slot * 1000,
            open: lastClose,
            high: lastClose,
            low: lastClose,
            close: lastClose,
            volume: 0,
          });
        } else {
          // No prior price yet → skip until first real bar
          // TradingView tolerates leading gaps
        }
      }
    }
    return out;
  }

  /**
   * Keep only the latest N bars (sliding window)
   */
  _trimWindow(bars, maxBars) {
    if (bars.length <= maxBars) return bars;
    return bars.slice(bars.length - maxBars);
  }

  /**
   * Call on subscribe start; clear on unsubscribe
   */
  _startRealtimeClock(resolution) {
    const stepMs = 1000; // tick every second regardless of resolution
    const timeMultiplier = this._getTimeMultiplier(resolution);

    if (this.rtTimer) clearInterval(this.rtTimer);
    this.rtTimer = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      const slot = this._snapToSlot(nowSec, timeMultiplier);

      // Initialize working bar if absent
      if (!this.workingBar || this.workingBar.slotSec !== slot) {
        // finalize previous slot if we missed emitting it
        if (this.workingBar && window.lastBarUpdateCallback) {
          const b = this.workingBar;
          window.lastBarUpdateCallback({
            time: b.slotSec * 1000,
            open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume,
          });
        }
        // seed new working bar from lastPrice (flat if no trade yet)
        const seed = this.lastPrice ?? this.lastBarsCache.get(`${this.symbol}:${resolution}`)?.close;
        if (seed != null) {
          this.workingBar = { slotSec: slot, open: seed, high: seed, low: seed, close: seed, volume: 0 };
          // Immediately emit a flat bar so cursor/time advances smoothly
          if (window.lastBarUpdateCallback) {
            window.lastBarUpdateCallback({
              time: slot * 1000, open: seed, high: seed, low: seed, close: seed, volume: 0
            });
          }
        }
      }
    }, stepMs);
  }

  /**
   * Update working bar from an incoming kline/tick-ish payload
   */
  _updateWorkingBarFromWs(processedData, resolution) {
    const timeMultiplier = this._getTimeMultiplier(resolution);
    const slot = this._snapToSlot((processedData.openTime || processedData.t), timeMultiplier);
    const price = parseFloat(processedData.close); // WebSocket close price
    const vol = parseFloat(processedData.volume || "0");

    // Update `this.lastPrice` with the WebSocket's last price
    this.lastPrice = price;
    this.onLastPriceChange(price);

    // Ensure working bar is on this slot
    if (!this.workingBar || this.workingBar.slotSec !== slot) {
      const seed = (this.lastPrice != null) ? this.lastPrice : price;
      this.workingBar = { slotSec: slot, open: seed, high: seed, low: seed, close: seed, volume: 0 };
    }

    const b = this.workingBar;
    b.close = price;
    b.high = Math.max(b.high, price);
    b.low = Math.min(b.low, price);
    b.volume += isFinite(vol) ? vol : 0;

    // Emit the updated working bar to the chart
    if (window.lastBarUpdateCallback) {
      window.lastBarUpdateCallback({
        time: b.slotSec * 1000,
        open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume
      });
    }
  }

  /**
   * Fetch latest data for a timeframe based on current time
   */
  async _fetchLatestData(symbolInfo, resolution, apiTimeframe, callback) {
    try {
      // Get current time in seconds
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Calculate how many bars we need based on resolution
      const barsCount = this._getDefaultBarsCount(resolution);
      
      // Calculate the timespan in seconds
      const timeMultiplier = this._getTimeMultiplier(resolution);
      
      // Calculate start time by going back the desired number of bars
      const startTime = currentTime - (barsCount * timeMultiplier);
      // Update the last fetch time
      this.lastFetchTime = Date.now();
      
      const response = await fetch(
        `https://fastify-serverless-function-ymut.onrender.com/api/klines?symbol=${symbolInfo.name}&timeframe=${apiTimeframe}&limit=${barsCount}&start_time=${startTime}&end_time=${currentTime}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        if (callback) callback([]);
        return [];
      }
      
      // Get slot ranges for continuous data
      const nowSec = Math.floor(Date.now() / 1000);
      const currentSlot = this._snapToSlot(nowSec, timeMultiplier);
      const startSlot = currentSlot - (barsCount - 1) * timeMultiplier;
      
      // Transform the data to the format expected by TradingView
      const mapped = data.map(item => ({
        time: parseInt(item.openTime) * 1000, // Multiply by 1000 for TradingView's millisecond timestamps
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume || "0")
      }));
      
      // Make it continuous
      const bars = this._fillGaps(mapped, startSlot, currentSlot, timeMultiplier);
      
      // Trim to max window size
      const MAX_BARS = this._getDefaultBarsCount(resolution);
      const trimmed = this._trimWindow(bars, MAX_BARS);
      
      
      // If we have bars, update the last price
      if (trimmed.length > 0) {
        const lastBar = trimmed[trimmed.length - 1];
        this.lastPrice = lastBar.close;
        this.onLastPriceChange(lastBar.close);
        
        // Cache the last bar for future reference
        const key = `${symbolInfo.name}:${resolution}`;
        this.lastBarsCache.set(key, lastBar);
      }
      
      if (callback) callback(trimmed);
      return trimmed;
    } catch (error) {
      console.error("Error fetching latest data:", error);
      if (callback) callback([]);
      return [];
    }
  }

  /**
   * Setup WebSocket connection for real-time data
   */
  _setupWebSocket(symbolName, apiTimeframe, resolution) {
    // Store resolution for use in WebSocket handlers
    this.currentResolution = resolution;
    
    // Close any existing connection
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    
    // Clear any pending reconnection attempts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    try {
      // Create WebSocket URL with the domain directly embedded
      const wsUrl = `wss://dev.superflow.exchange/ws/klines/${symbolName}/${apiTimeframe}`;
      
      const ws = new WebSocket(wsUrl);
      this.wsConnection = ws;
      
      // Keep track of connection state
      ws.isAlive = true;
      ws.retries = 0;
      
      // Add a heartbeat ping to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          // Some WebSocket servers expect a ping/pong mechanism
          try {
            ws.send(JSON.stringify({ type: "ping" }));
          } catch (err) {
            console.warn("Error sending heartbeat:", err);
          }
        }
      }, 30000); // Send heartbeat every 30 seconds
      
      ws.onopen = () => {
        this._setWsStatus("connected");
        ws.isAlive = true;
        ws.retries = 0; // Reset retry counter on successful connection
      };
      
      ws.onmessage = (event) => {
        try {
          // Reset the "isAlive" flag when a message is received
          ws.isAlive = true;
          
          const rawData = event.data;
          const data = JSON.parse(rawData);
          
          // Format data based on response structure
          let processedData;
          
          if (data.e === "KLINE") {
            // Extract data from Binance-style format
            processedData = {
              openTime: data.t,      // Kline open time
              updateTime: data.T,    // Kline close time
              open: data.o,          // Open price
              high: data.h,          // High price
              low: data.l,           // Low price
              close: data.c,         // Close price
              volume: data.v,        // Volume
              quoteAssetVolume: data.q, // Quote asset volume
              numberOfTrades: data.n  // Number of trades
            };
          } else {
            // Assume it's already in the right format
            processedData = data;
          }
          
          if (processedData && processedData.close) {
            // Update working bar with new data using current resolution
            this._updateWorkingBarFromWs(processedData, this.currentResolution);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this._setWsStatus("error");
        ws.isAlive = false;
      };
      
      ws.onclose = (event) => {
        this._setWsStatus("disconnected");
        ws.isAlive = false;
        
        // Clean up heartbeat interval
        clearInterval(heartbeatInterval);
        
        // Implement exponential backoff for reconnection
        if (document.visibilityState !== "hidden") {
          // Don't reconnect for certain close codes that indicate permanent issues
          const permanentCloseCodes = [1008, 1011];
          if (!permanentCloseCodes.includes(event.code)) {
            const backoffDelay = Math.min(30000, 1000 * Math.pow(1.5, ws.retries || 0));
            
            this.reconnectTimeout = setTimeout(() => {
              if (this.wsConnection === ws) { // Only reconnect if this is still the current socket
                ws.retries = (ws.retries || 0) + 1;
                this._setupWebSocket(symbolName, apiTimeframe, this.currentResolution);
              }
            }, backoffDelay);
          } else {
            console.log(`Not reconnecting due to permanent close code: ${event.code}`);
          }
        }
      };
      
      return ws;
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      this._setWsStatus("error");
      
      // Try to reconnect after a delay
      if (document.visibilityState !== "hidden") {
        this.reconnectTimeout = setTimeout(() => {
          this._setupWebSocket(symbolName, apiTimeframe, this.currentResolution);
        }, 5000);
      }
      return null;
    }
  }

  /**
   * Update WebSocket status with callback
   */
  _setWsStatus(status) {
    this.wsStatus = status;
    this.onStatusChange(status);
  }

  /**
   * TradingView Datafeed method: onReady
   */
  _onReady(callback) {
    const configurationData = {
      supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D", "1W", "1M"],
      exchanges: [
        { value: "Crypto", name: "Crypto", desc: "Crypto Exchange" }
      ],
      symbols_types: [
        { value: "crypto", name: "Cryptocurrency" }
      ]
    };
    
    setTimeout(() => callback(configurationData), 0);
  }

  /**
   * TradingView Datafeed method: searchSymbols
   */
  _searchSymbols(userInput, exchange, symbolType, onResult) {
    onResult([{
      symbol: this.symbol,
      full_name: this.symbol,
      description: this.symbol,
      exchange: "Crypto",
      ticker: this.symbol,
      type: "crypto"
    }]);
  }

  /**
   * TradingView Datafeed method: resolveSymbol
   */
  _resolveSymbol(symbolName, onSymbolResolved, onResolveErrorCallback) {
    // For Bitcoin, we need a larger pricescale due to high price values
    const isBTC = symbolName.includes("BTC");
    
    const symbolInfo = {
      name: symbolName,
      full_name: symbolName,
      description: symbolName,
      type: 'crypto',
      session: '24x7',
      exchange: 'SuperFlow',
      listed_exchange: 'Crypto',
      timezone: 'Etc/UTC',
      ticker: symbolName,
      minmov: 1,
      pricescale: isBTC ? 100000 : 100, // Much larger scale for BTC
      has_intraday: true,
      intraday_multipliers: ['1', '5', '15', '30', '60', '240'],
      supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D", "1W", "1M"],
      volume_precision: 8,
      data_status: 'streaming',
    };
    
    setTimeout(() => onSymbolResolved(symbolInfo), 0);
  }

  /**
   * TradingView Datafeed method: getBars
   */
  async _getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
    const { from, to, firstDataRequest } = periodParams;
    
    try {
      // Convert TradingView resolution to API timeframe format
      const apiTimeframe = this._tvTimeframeToApiFormat(resolution);
      
      // If this is the first request, use our specialized function that fetches
      // the latest data based on the current time
      if (firstDataRequest) {
        const bars = await this._fetchLatestData(symbolInfo, resolution, apiTimeframe);
        const MAX_BARS = this._getDefaultBarsCount(resolution);
        const trimmed = this._trimWindow(bars, MAX_BARS);
        
        onHistoryCallback(trimmed, { noData: trimmed.length === 0 });
        return;
      }
      
      // For subsequent (historical) requests, use the from/to parameters
      
      // Calculate the limit based on the period
      const timeMultiplier = this._getTimeMultiplier(resolution);
      const periodDuration = to - from;
      const estimatedBars = Math.ceil(periodDuration / timeMultiplier);
      const limit = Math.min(Math.max(estimatedBars, 50), 1000); // Between 50 and 1000
      
      // Ensure timestamps meet API minimum requirements (1400000000)
      let startTime = from;
      let endTime = to;
      
      // Convert timestamps if they're too small (below May 2014)
      if (startTime < 1400000000) {
        startTime = 1400000000; // Use minimum allowed time
      }
      
      if (endTime < 1400000000) {
        endTime = Math.floor(Date.now() / 1000);
      }
      console.log("Fetching klines with URL:", `https://fastify-serverless-function-ymut.onrender.com/api/klines?symbol=${symbolInfo.name}&timeframe=${apiTimeframe}&limit=${limit}&start_time=${startTime}&end_time=${endTime}`);

      const response = await fetch(
        `https://fastify-serverless-function-ymut.onrender.com/api/klines?symbol=${symbolInfo.name}&timeframe=${apiTimeframe}&limit=${limit}&start_time=${startTime}&end_time=${endTime}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        onHistoryCallback([], { noData: true });
        return;
      }
      
      // Transform the data to the format expected by TradingView
      const mapped = data.map(item => ({
        time: parseInt(item.openTime) * 1000, // Multiply by 1000 for milliseconds
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume || "0")
      }));
      
      // Get slot ranges for continuous data
      const fromSlot = this._snapToSlot(startTime, timeMultiplier);
      const toSlot = this._snapToSlot(endTime, timeMultiplier);
      
      // Make it continuous
      const bars = this._fillGaps(mapped, fromSlot, toSlot, timeMultiplier);
      
      // Trim to reasonable size to avoid excessive memory usage
      const MAX_BARS = this._getDefaultBarsCount(resolution);
      const trimmed = this._trimWindow(bars, MAX_BARS);
      
      // Cache the last bar for updates
      if (trimmed.length > 0) {
        const lastBar = trimmed[trimmed.length - 1];
        const key = `${symbolInfo.name}:${resolution}`;
        this.lastBarsCache.set(key, lastBar);
        
        // Store the last close price
        this.lastPrice = lastBar.close;
        this.onLastPriceChange(lastBar.close);
      }
      
      onHistoryCallback(trimmed, { noData: trimmed.length === 0 });
    } catch (error) {
      console.error("Error fetching klines:", error);
      onErrorCallback(`Error fetching klines: ${error.message}`);
    }
  }

  /**
   * TradingView Datafeed method: subscribeBars
   */
  _subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
    // Store the callback so we can call it from the WebSocket handler
    window.lastBarUpdateCallback = onRealtimeCallback;

    // Connect to WebSocket for real-time updates
    const apiTimeframe = this._tvTimeframeToApiFormat(resolution);
    this._setupWebSocket(symbolInfo.name, apiTimeframe, resolution);

    // Set up periodic data refresh (every 1 minute)
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
    }

    const refreshInterval = 5000; // 5 seconds
    this.dataUpdateInterval = setInterval(() => {
      // Fetch historical data every 1 minute
      this._fetchLatestData(symbolInfo, resolution, apiTimeframe, (bars) => {
        if (bars.length > 0) {
          const lastBar = bars[bars.length - 1];
          this.lastPrice = lastBar.close; // Update last price from GET data
          this.onLastPriceChange(lastBar.close);

          // Emit the latest bar to the chart
          if (window.lastBarUpdateCallback) {
            window.lastBarUpdateCallback(lastBar);
          }
        }
      });
    }, refreshInterval);

    return subscriberUID;
  }

  /**
   * TradingView Datafeed method: unsubscribeBars
   */
  _unsubscribeBars(subscriberUID) {
    
    // Clean up the stored callback
    window.lastBarUpdateCallback = null;
    
    // Stop real-time clock
    if (this.rtTimer) {
      clearInterval(this.rtTimer); 
      this.rtTimer = null;
    }
    
    // Reset working bar
    this.workingBar = null;
    
    // Close the WebSocket if it's open
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    
    // Clear any pending reconnection attempts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Clear data update interval
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
      this.dataUpdateInterval = null;
    }
    
    this._setWsStatus("disconnected");
  }

  /**
   * TradingView Datafeed method: getServerTime
   */
  _getServerTime(callback) {
    callback(Math.floor(Date.now() / 1000));
  }

  /**
   * Cleanup method to handle component unmounting
   */
  cleanup() {
    // Clean up all resources
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
      this.dataUpdateInterval = null;
    }
    
    if (this.rtTimer) {
      clearInterval(this.rtTimer);
      this.rtTimer = null;
    }
    
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    
    this.workingBar = null;
    window.lastBarUpdateCallback = null;
  }
}