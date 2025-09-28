import { useEffect, useRef } from "react";

/**
 * TVChart mounts TradingView's Advanced Charting Library.
 *
 * Props:
 * - symbol: string like "BTCUSDT"
 * - interval: string like "1", "5", "60", "240", "1D"
 * - theme: "light" | "dark"
 * - containerId: optional DOM id
 */
export default function TVChart({
  symbol = "BTCUSDT",
  interval = "60",
  theme = "dark",
  containerId = "tv-chart-container",
}) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

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
            console.log('[Datafeed] onReady called');
            setTimeout(() => callback(configurationData), 0);
          },
          
          searchSymbols: (userInput, exchange, symbolType, onResult) => {
            console.log('[Datafeed] searchSymbols called');
            // Return predefined symbol for demo
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
            console.log('[Datafeed] resolveSymbol called for:', symbolName);
            
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
          
          getBars: (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
            const { from, to, firstDataRequest } = periodParams;
            console.log(`[Datafeed] getBars called with: ${symbolInfo.name}, ${resolution}, from: ${from}, to: ${to}`);
            
            const bars = [];
            const step = resolution === "1D" ? 86400 : parseInt(resolution) * 60;
            let time = from;
            
            // Generate sample data
            while (time <= to) {
              const basePrice = 20000 + Math.random() * 5000;
              const volatility = basePrice * 0.02;
              
              const open = basePrice;
              const close = basePrice + (Math.random() - 0.5) * volatility * 2;
              const high = Math.max(open, close) + Math.random() * volatility;
              const low = Math.min(open, close) - Math.random() * volatility;
              
              bars.push({
                time: time * 1000,
                open,
                high,
                low,
                close,
                volume: Math.round(Math.random() * 1000)
              });
              
              time += step;
            }
            
            if (bars.length === 0) {
              onHistoryCallback([], { noData: true });
              return;
            }
            
            // Cache the last bar for this resolution
            if (bars.length > 0) {
              const lastBar = bars[bars.length - 1];
              const key = `${symbolInfo.name}:${resolution}`;
              lastBarsCache.set(key, lastBar);
            }
            
            onHistoryCallback(bars, { noData: false });
          },
          
          subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
            console.log('[Datafeed] subscribeBars called with:', symbolInfo.name);
            // Here you would set up a connection to receive realtime updates
            // For demo purposes, we'll just simulate updates every 5 seconds
            const intervalId = setInterval(() => {
              const key = `${symbolInfo.name}:${resolution}`;
              const lastBar = lastBarsCache.get(key);
              
              if (lastBar) {
                const newTime = lastBar.time + (resolution === "1D" ? 86400 : parseInt(resolution) * 60) * 1000;
                const basePrice = lastBar.close;
                const volatility = basePrice * 0.01;
                
                const open = basePrice;
                const close = basePrice + (Math.random() - 0.5) * volatility * 2;
                const high = Math.max(open, close) + Math.random() * volatility/2;
                const low = Math.min(open, close) - Math.random() * volatility/2;
                
                const bar = {
                  time: newTime,
                  open,
                  high, 
                  low,
                  close,
                  volume: Math.round(Math.random() * 1000)
                };
                
                lastBarsCache.set(key, bar);
                onRealtimeCallback(bar);
              }
            }, 5000);
            
            return intervalId; // Return something that can be used to unsubscribe
          },
          
          unsubscribeBars: (subscriberUID) => {
            console.log('[Datafeed] unsubscribeBars called');
            // Clear the interval when unsubscribing
            clearInterval(subscriberUID);
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
          container_id: containerId,
          theme,
          datafeed: customDatafeed,
          locale: "en",
          timezone: "Etc/UTC",
          debug: false,
          disabled_features: [
            "use_localstorage_for_settings",
            "popup_hints"
          ],
          enabled_features: [
            "move_logo_to_main_pane"
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
            
            // Background
            "paneProperties.background": "#181923", // Chart background
            "paneProperties.vertGridProperties.color": "#1e2230", // Vertical grid lines
            "paneProperties.horzGridProperties.color": "#1e2230", // Horizontal grid lines
            
            // Scales and axis
            "scalesProperties.backgroundColor": "#181923", // Scale background
            "scalesProperties.lineColor": "#363c4e", // Scale lines
            "scalesProperties.textColor": "#d1d4dc", // Scale text
            
            // Crosshair
            "paneProperties.crossHairProperties.color": "#758696", // Crosshair color
            "paneProperties.crossHairProperties.style": 2, // Crosshair style (0-solid, 1-dotted, 2-dashed)
            
            // Volume
            "volumePaneSize": "medium", // Volume pane size
          },
          // Studies (indicators) colors
          studies_overrides: {
            // Volume colors
            "volume.volume.color.0": "rgba(244, 143, 244, 0.6)",  // Decreasing volume color (pink)
            "volume.volume.color.1": "rgba(28, 209, 237, 0.6)",   // Increasing volume color (blue)
            "volume.volume.transparency": 40,  // Volume transparency
            
            // Volume SMA line
            "volume.volume ma.color": "#ffffff",   // Volume SMA line color (white)
            "volume.volume ma.linewidth": 2,       // Volume SMA line width
            "volume.volume ma.transparency": 30,   // Volume SMA transparency
            
            // Moving Average colors
            "Moving Average.color": "#f48ff4",     // MA line color (pink)
            "Moving Average.linewidth": 2,         // MA line width
            
            // MACD colors
            "MACD.histogram.color": "#1cd1ed",     // MACD histogram color (blue)
            "MACD.macd.color": "#f48ff4",          // MACD line color (pink)
            "MACD.signal.color": "#ffffff",        // MACD signal line color (white)
            
            // RSI colors
            "RSI.color": "#1cd1ed",                // RSI line color (blue)
            "RSI.upper_band.color": "#f48ff4",     // RSI upper band (pink)
            "RSI.lower_band.color": "#f48ff4"      // RSI lower band (pink)
          },
          loading_screen: {
            backgroundColor: "#181923",
            foregroundColor: "#2962FF"
          },
          client_id: "tradingview.com",
          user_id: "public_user",
          charts_storage_api_version: "1.1"
        });

        widgetRef.current.onChartReady(() => {
          console.log("TV widget ready");
        });
      } catch (e) {
        console.error("Failed to init TradingView widget:", e);
      }
    }

    init();

    return () => {
      disposed = true;
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