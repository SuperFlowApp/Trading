import { useEffect, useRef, useState } from "react";
import { selectedPairStore } from "../../Zustandstore/userOrderStore";
import { API_BASE_URL } from "../../config/api"; // Import the API_BASE_URL

/**
 * TVChart mounts TradingView's Advanced Charting Library with real data.
 *
 * Props:
 * - symbol: string like "BTCUSDT" (optional, will use selectedPairStore if not provided)
 * - interval: string like "5S", "1", "5", "15", "60", "240", "1D", "1W", "1M"
 * - theme: "light" | "dark"
 * - containerId: optional DOM id
 */
export default function TVChart({
  symbol: propSymbol,
  interval = "60",
  theme = "dark",
  containerId = "tv-chart-container",
}) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const wsRef = useRef(null);
  const lastPriceRef = useRef(null);
  
  // Get the selected pair from the store
  const selectedPair = selectedPairStore(state => state.selectedPair);
  
  // Derive the actual symbol to use (either from props or from store)
  const symbol = propSymbol || `${selectedPair}USDT`;
  
  // State to store the last price for the indicator
  const [lastPrice, setLastPrice] = useState(null);

  useEffect(() => {
    let disposed = false;

    function loadScript(src) {
      return new Promise((resolve, reject) => {
        const el = document.createElement("script");
        el.src = src;
        el.async = true;
        el.type = "text/javascript";
        el.onload = resolve;
        el.onerror = reject;
        document.body.appendChild(el);
      });
    }

    // Function to convert API timeframe format to TradingView format
    function apiTimeframeToTVFormat(timeframe) {
      if (timeframe === "1m") return "1";
      if (timeframe === "5m") return "5";
      if (timeframe === "15m") return "15";
      if (timeframe === "30m") return "30";
      if (timeframe === "1h") return "60";
      if (timeframe === "4h") return "240";
      if (timeframe === "1d") return "1D";
      if (timeframe === "1w") return "1W";
      if (timeframe === "1M") return "1M";
      return timeframe;
    }

    // Function to convert TradingView timeframe format to API format
    function tvTimeframeToApiFormat(resolution) {
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

    // Setup WebSocket for real-time price updates
    function setupPriceWebSocket(symbolName) {
      const apiTimeframe = tvTimeframeToApiFormat(interval);
      const wsUrl = `wss://dev.superflow.exchange/ws/klines/${symbolName}/${apiTimeframe}`;
      
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log(`WebSocket connected: ${wsUrl}`);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.close) {
            // Update the last price from websocket data
            const price = parseFloat(data.close);
            setLastPrice(price);
            lastPriceRef.current = price;
            
            // Update the last bar if widget is ready
            if (widgetRef.current && lastPriceRef.current) {
              // This will update the last price indicator
              const currentBar = {
                time: data.openTime || Date.now(),
                open: parseFloat(data.open),
                high: parseFloat(data.high),
                low: parseFloat(data.low),
                close: price,
                volume: parseFloat(data.volume || "0")
              };
              
              // If datafeed is initialized, update it
              if (window.lastBarUpdateCallback) {
                window.lastBarUpdateCallback(currentBar);
              }
            }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      wsRef.current.onclose = () => {
        console.log("WebSocket connection closed");
      };
      
      return wsRef.current;
    }

    async function init() {
      try {
        // Load charting library first
        if (!window.TradingView) {
          await loadScript("/static/charting_library/charting_library.js");
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (disposed) return;

        // Create a proper custom datafeed
        const lastBarsCache = new Map();
        
        const configurationData = {
          supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D", "1W", "1M"],
          exchanges: [
            { value: "Crypto", name: "Crypto", desc: "Crypto Exchange" }
          ],
          symbols_types: [
            { value: "crypto", name: "Cryptocurrency" }
          ]
        };

        const customDatafeed = {
          onReady: (callback) => {
            setTimeout(() => callback(configurationData), 0);
          },
          
          searchSymbols: (userInput, exchange, symbolType, onResult) => {
            onResult([{
              symbol: symbol,
              full_name: symbol,
              description: symbol,
              exchange: "Crypto",
              ticker: symbol,
              type: "crypto"
            }]);
          },
          
          resolveSymbol: (symbolName, onSymbolResolved, onResolveErrorCallback) => {
            const symbolInfo = {
              name: symbolName,
              full_name: symbolName,
              description: symbolName,
              type: 'crypto',
              session: '24x7',
              exchange: 'Crypto',
              listed_exchange: 'Crypto',
              timezone: 'Etc/UTC',
              ticker: symbolName,
              minmov: 1,
              pricescale: 100,
              has_intraday: true,
              intraday_multipliers: ['1', '5', '15', '30', '60', '240'],
              supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D", "1W", "1M"],
              volume_precision: 8,
              data_status: 'streaming',
            };
            
            setTimeout(() => onSymbolResolved(symbolInfo), 0);
          },
          
          getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
            const { from, to, firstDataRequest } = periodParams;
            
            try {
              // Convert TradingView resolution to API timeframe format
              const apiTimeframe = tvTimeframeToApiFormat(resolution);
              
              // Calculate the limit based on the period
              const timeMultiplier = resolution === "1D" ? 86400 : 
                                    resolution === "1W" ? 604800 :
                                    resolution === "1M" ? 2592000 :
                                    parseInt(resolution) * 60;
              
              const periodDuration = to - from;
              const estimatedBars = Math.ceil(periodDuration / timeMultiplier);
              const limit = Math.min(Math.max(estimatedBars, 50), 1000); // Between 50 and 1000
              
              // Use API_BASE_URL from config instead of hardcoding
              const response = await fetch(
                `${API_BASE_URL}/api/klines?symbol=${symbolInfo.name}&timeframe=${apiTimeframe}&limit=${limit}&start_time=${from * 1000}&end_time=${to * 1000}`
              );
              
              if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
              }
              
              const data = await response.json();
              
              if (!Array.isArray(data) || data.length === 0) {
                onHistoryCallback([], { noData: true });
                return;
              }
              
              // Transform the data to the format expected by TradingView
              const bars = data.map(item => ({
                time: item.openTime,
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
                volume: parseFloat(item.volume)
              }));
              
              // Cache the last bar for updates
              if (bars.length > 0) {
                const lastBar = bars[bars.length - 1];
                const key = `${symbolInfo.name}:${resolution}`;
                lastBarsCache.set(key, lastBar);
                
                // Store the last close price
                lastPriceRef.current = lastBar.close;
                setLastPrice(lastBar.close);
              }
              
              onHistoryCallback(bars, { noData: bars.length === 0 });
            } catch (error) {
              console.error("Error fetching klines:", error);
              onErrorCallback(`Error fetching klines: ${error.message}`);
            }
          },
          
          subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
            console.log("Subscribing to bars", symbolInfo.name, resolution);
            
            // Store the callback so we can call it from the WebSocket handler
            window.lastBarUpdateCallback = onRealtimeCallback;
            
            // Connect to WebSocket for real-time updates
            setupPriceWebSocket(symbolInfo.name);
            
            // Return the subscriberUID for unsubscribing
            return subscriberUID;
          },
          
          unsubscribeBars: (subscriberUID) => {
            console.log("Unsubscribing from bars", subscriberUID);
            
            // Clean up the stored callback
            window.lastBarUpdateCallback = null;
            
            // Close the WebSocket if it's open
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.close();
              wsRef.current = null;
            }
          },
          
          getServerTime: (callback) => {
            callback(Math.floor(Date.now() / 1000));
          }
        };

        widgetRef.current = new window.TradingView.widget({
          library_path: "/static/charting_library/",
          fullscreen: false,
          autosize: true,
          symbol,
          interval,
          container: containerId,
          theme,
          datafeed: customDatafeed,
          locale: "en",
          timezone: "Etc/UTC",
          debug: false,
          disabled_features: [
            "use_localstorage_for_settings",
            "popup_hints",
            "volume_force_overlay",
            "header_symbol_search",
            "header_compare",
            "symbol_search_hot_key",
          ],
          enabled_features: [
            "move_logo_to_main_pane",
            "create_volume_indicator_by_default"
          ],
          // Add custom time frames configuration
          time_frames: [
            // These will appear directly in the toolbar
            { text: "5m", resolution: "5", description: "5 Minutes" },
            { text: "30m", resolution: "30", description: "30 Minutes" },
            { text: "1h", resolution: "60", description: "1 Hour" },
            { text: "1d", resolution: "1D", description: "1 Day" },
            // These will be in the dropdown
            { text: "1m", resolution: "1", description: "1 Minute" },
            { text: "15m", resolution: "15", description: "15 Minutes" },
            { text: "4h", resolution: "240", description: "4 Hours" },
            { text: "1w", resolution: "1W", description: "1 Week" },
            { text: "1M", resolution: "1M", description: "1 Month" },
          ],
          // Custom colors
          overrides: {
            // Main Series (Candles) Colors
            "mainSeriesProperties.candleStyle.upColor": "#1cd1ed", // Blue candle color
            "mainSeriesProperties.candleStyle.downColor": "#f48ff4", // Pink candle color
            "mainSeriesProperties.candleStyle.wickUpColor": "#1cd1ed", // Blue wick color
            "mainSeriesProperties.candleStyle.wickDownColor": "#f48ff4", // Pink wick color
            "mainSeriesProperties.candleStyle.borderUpColor": "#1cd1ed", // Blue candle border
            "mainSeriesProperties.candleStyle.borderDownColor": "#f48ff4", // Pink candle border
            
            // Background - Solid color settings
            "paneProperties.background": "#181923", // Chart background
            "paneProperties.backgroundType": "solid", // Force solid background
            "paneProperties.backgroundGradientStartColor": "#181923", // Remove gradient start
            "paneProperties.backgroundGradientEndColor": "#181923", // Remove gradient end
            
            // Vertical and horizontal grid lines
            "paneProperties.vertGridProperties.color": "#1e2230", // Vertical grid lines
            "paneProperties.horzGridProperties.color": "#1e2230", // Horizontal grid lines
            
            // Scales and axis
            "scalesProperties.backgroundColor": "#181923", // Scale background
            "scalesProperties.lineColor": "#363c4e", // Scale lines
            "scalesProperties.textColor": "#d1d4dc", // Scale text
            
            // Crosshair
            "paneProperties.crossHairProperties.color": "#758696", // Crosshair color
            "paneProperties.crossHairProperties.style": 2, // Crosshair style
            
            // Volume
            "volumePaneSize": "medium", // Volume pane size
          },
          // Studies (indicators) colors
          studies_overrides: {
            // Volume colors
            "volume.volume.color.0": "rgba(244, 143, 244, 0.6)",
            "volume.volume.color.1": "rgba(28, 209, 237, 0.6)",
            "volume.volume.transparency": 40,
            
            // Volume SMA line - Settings to hide SMA
            "volume.show ma": false,
            "volume.ma length": 0,
            "volume.volume ma.color": "rgba(0,0,0,0)",
            "volume.volume ma.linewidth": 0,
            "volume.volume ma.transparency": 100,
            
            // Moving Average colors
            "MA.plot.color": "#f48ff4",
            "MA.plot.linewidth": 2,
            
            // MACD colors
            "MACD.histogram.color": "#1cd1ed",
            "MACD.macd.color": "#f48ff4",
            "MACD.signal.color": "#ffffff",
          },
          loading_screen: {
            backgroundColor: "#181923",
            foregroundColor: "#1cd1ed",
            backgroundType: "solid"
          },
        });

        widgetRef.current.onChartReady(() => {
          console.log("Chart is ready");
          
          if (widgetRef.current) {
            const chart = widgetRef.current.activeChart();
            
            // Configure volume indicator
            chart.getAllStudies().forEach(study => {
              if (study.name === "Volume") {
                chart.removeEntity(study.id);
              }
            });
            
            // Create volume indicator without MA
            chart.createStudy("Volume", false, false, {
              "showMA": false,
              "maLength": 0,
              "maColor": "rgba(0,0,0,0)",
              "transparency": 40,
              "color1": "rgba(244, 143, 244, 0.6)",
              "color2": "rgba(28, 209, 237, 0.6)"
            });
            
            // Set initial resolution
            chart.setResolution(interval, () => {
              console.log("Resolution set to:", interval);
            });
            
            // Add last price indicator
            chart.createStudy("Current Price Label", false, false);
          }
        });
      } catch (e) {
        console.error("Failed to init TradingView widget:", e);
      }
    }

    init();

    // Clean up
    return () => {
      disposed = true;
      
      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      // Clean up callback reference
      window.lastBarUpdateCallback = null;
      
      // Remove TradingView widget
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.error("Error removing widget:", e);
        }
        widgetRef.current = null;
      }
    };
  }, [symbol, interval, theme, containerId]);

  return (
    <div
      id={containerId}
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
}