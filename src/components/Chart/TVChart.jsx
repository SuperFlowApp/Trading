import { useEffect, useRef, useState } from "react";
import { selectedPairStore } from "../../Zustandstore/userOrderStore";
import { DataFeed } from "./DataFeed";

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
  const dataFeedRef = useRef(null);
  
  // Get the selected pair from the store
  const selectedPair = selectedPairStore(state => state.selectedPair);
  
  // Derive the actual symbol to use (either from props or from store)
  const symbol = propSymbol || `${selectedPair}USDT`;
  
  // State to store the last price for the indicator
  const [lastPrice, setLastPrice] = useState(null);
  const [wsStatus, setWsStatus] = useState("disconnected");

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

        // Create a new DataFeed instance
        dataFeedRef.current = new DataFeed({
          symbol,
          onStatusChange: setWsStatus,
          onLastPriceChange: setLastPrice,
        });

        // Get the datafeed object interface for TradingView
        const datafeed = dataFeedRef.current.getDatafeedObject();

        widgetRef.current = new window.TradingView.widget({
          library_path: "/static/charting_library/",
          fullscreen: false,
          autosize: true,
          symbol,
          interval,
          container: containerId,
          theme,
          datafeed,
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
            // chart.createStudy("Current Price Label", false, false);
            
            // Reset the view to show the latest data properly
            setTimeout(() => {
              try {
                chart.executeActionById("timeScaleReset");
                console.log("Chart timeScale reset applied");
              } catch (e) {
                console.error("Error resetting chart:", e);
              }
            }, 500);
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
      
      // Clean up DataFeed resources
      if (dataFeedRef.current) {
        dataFeedRef.current.cleanup();
        dataFeedRef.current = null;
      }
      
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
      className={wsStatus === "error" ? "ws-error" : wsStatus === "connected" ? "ws-connected" : ""}
    />
  );
}