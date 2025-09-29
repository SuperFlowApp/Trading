import { useEffect, useRef } from "react";
import { selectedPairStore } from "../../Zustandstore/userOrderStore"; // Import the store

/**
 * TVChart mounts TradingView's Advanced Charting Library.
 *
 * Props:
 * - symbol: string like "BTCUSDT" (optional, will use selectedPairStore if not provided)
 * - interval: string like "5S", "1", "5", "15", "60", "240", "1D", "1W", "1M"
 * - theme: "light" | "dark"
 * - containerId: optional DOM id
 */
export default function TVChart({
  symbol: propSymbol, // Rename to propSymbol to avoid confusion
  interval = "60",
  theme = "dark",
  containerId = "tv-chart-container",
}) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  
  // Get the selected pair from the store
  const selectedPair = selectedPairStore(state => state.selectedPair);
  
  // Derive the actual symbol to use (either from props or from store)
  const symbol = propSymbol || `${selectedPair}USDT`;

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
          // Update supported resolutions to include 5S
          supported_resolutions: ["5S", "1", "5", "15", "30", "60", "240", "1D", "1W", "1M"],
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
              // Update supported intraday multipliers to match your timeframes
              intraday_multipliers: ['5S', '1', '5', '15', '60', '240'],
              // Update supported resolutions to match your timeframes
              supported_resolutions: ["5S", "1", "5", "15", "60", "240", "1D", "1W", "1M"],
              volume_precision: 8,
              data_status: 'streaming',
            };
            
            setTimeout(() => onSymbolResolved(symbolInfo), 0);
          },
          
          getBars: (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
            const { from, to, firstDataRequest } = periodParams;
            
            const bars = [];
            
            // Handle the custom 5S (5 second) resolution
            const step = resolution === "1D" ? 86400 : 
                         resolution === "1W" ? 604800 :
                         resolution === "1M" ? 2592000 :
                         resolution === "5S" ? 5 : // 5 seconds
                         parseInt(resolution) * 60; // minutes
                         
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
            // Here you would set up a connection to receive realtime updates
            
            // Update interval based on resolution
            const updateInterval = resolution === "5S" ? 1000 : 5000; // faster updates for 5S
            
            const intervalId = setInterval(() => {
              const key = `${symbolInfo.name}:${resolution}`;
              const lastBar = lastBarsCache.get(key);
              
              if (lastBar) {
                // Calculate new time based on resolution
                const timeIncrement = resolution === "1D" ? 86400 : 
                                     resolution === "1W" ? 604800 :
                                     resolution === "1M" ? 2592000 :
                                     resolution === "5S" ? 5 : // 5 seconds
                                     parseInt(resolution) * 60; // minutes
                                     
                // Use current time for more realistic updates
                // and ensure it's greater than the last bar's time
                const newTime = Math.max(
                  lastBar.time + timeIncrement * 1000,
                  Date.now()
                );
                
                const basePrice = lastBar.close;
                // Adjust volatility based on timeframe
                const volatilityFactor = resolution === "5S" ? 0.0005 : 
                                        resolution === "1" ? 0.001 :
                                        resolution === "5" ? 0.002 :
                                        resolution === "15" ? 0.003 :
                                        resolution === "60" ? 0.005 :
                                        resolution === "240" ? 0.008 :
                                        resolution === "1D" ? 0.01 :
                                        resolution === "1W" ? 0.02 : 0.03; // 1M
                
                const volatility = basePrice * volatilityFactor;
                
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
            }, updateInterval);
            
            return intervalId; // Return something that can be used to unsubscribe
          },
          
          unsubscribeBars: (subscriberUID) => {
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
          symbol, // This now uses either the prop or the store value
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
            "volume_force_overlay",       // Prevent volume pane from being an overlay
            "header_symbol_search",       // Remove the symbol search box
            "header_compare",             // Remove the "Compare" button
            "symbol_search_hot_key",      // Disable the symbol search hotkey
          ],
          enabled_features: [
            "move_logo_to_main_pane",
            "create_volume_indicator_by_default"
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
            
            // Volume SMA line - Settings to hide SMA
            "volume.show ma": false,              // Hide SMA on Volume indicator
            "volume.ma length": 0,                // Set MA length to 0
            "volume.volume ma.color": "rgba(0,0,0,0)",  // Transparent MA color
            "volume.volume ma.linewidth": 0,      // 0 width makes the line invisible
            "volume.volume ma.transparency": 100, // Full transparency
            
            // Moving Average colors
            "MA.plot.color": "#f48ff4",     // MA line color (pink)
            "MA.plot.linewidth": 2,         // MA line width
            
            // MACD colors
            "MACD.histogram.color": "#1cd1ed",     // MACD histogram color (blue)
            "MACD.macd.color": "#f48ff4",          // MACD line color (pink)
            "MACD.signal.color": "#ffffff",        // MACD signal line color (white)
          },
          loading_screen: {
            backgroundColor: "#181923",
            foregroundColor: "#1cd1ed",
            backgroundType: "solid" // Ensure loading screen also has solid background
          },
          client_id: "tradingview.com",
          user_id: "public_user",
          charts_storage_api_version: "1.1"
        });

        widgetRef.current.onChartReady(() => {
          // Add this: Try to modify the volume indicator directly once chart is ready
          if (widgetRef.current) {
            const chart = widgetRef.current.activeChart();
            
            // Remove volume indicator if present
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
          }
          
          // Add custom time intervals to the interval selector if needed
          if (widgetRef.current) {
            const chart = widgetRef.current.activeChart();
            
            // Set your custom timeframes in the interface
            chart.setResolution(interval, () => {
              console.log("Resolution set to:", interval);
            });
          }
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
  }, [symbol, interval, theme, containerId]); // Make sure symbol is in the dependency array

  return (
    <div
      id={containerId}
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
}