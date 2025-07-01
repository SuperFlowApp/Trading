import { useEffect, useRef } from 'react';

const TradingViewChart = ({ selectedPair = 'BTCUSDT' }) => {
  const containerRef = useRef();
  const widgetRef = useRef(null);

  useEffect(() => {
    // Generate unique ID for each widget instance
    const widgetId = `tradingview_${Math.random().toString(36).substr(2, 9)}`;
    
    // Clear any existing content and widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    // Clean up previous widget
    if (widgetRef.current && typeof widgetRef.current.remove === 'function') {
      widgetRef.current.remove();
    }

    // Ensure TradingView script is loaded
    if (!window.TradingView) {
      const tvScript = document.createElement('script');
      tvScript.src = 'https://s3.tradingview.com/tv.js';
      tvScript.async = true;
      tvScript.onload = () => createWidget(widgetId);
      document.head.appendChild(tvScript);
    } else {
      createWidget(widgetId);
    }

    function createWidget(id) {
      if (!containerRef.current) return;

      // Set the container id
      containerRef.current.id = id;

      // Convert pair format
      const symbol = `BINANCE:${selectedPair}`;

      try {
        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          withdateranges: true,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          details: true,
          hotlist: true,
          calendar: false,
          studies: ["Volume@tv-basicstudies"],
          container_id: id,
          // Remove problematic options that cause errors
          show_popup_button: false,
          // Simplified configuration to reduce errors
          height: 500,
          width: "100%"
        });
      } catch (error) {
        console.warn('TradingView widget creation failed:', error);
        // Fallback: show a simple message
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full text-white">
              <div class="text-center">
                <h3 class="text-lg font-semibold mb-2">${selectedPair}</h3>
                <p class="text-gray-400">Chart loading...</p>
              </div>
            </div>
          `;
        }
      }
    }

    // Cleanup function
    return () => {
      if (widgetRef.current && typeof widgetRef.current.remove === 'function') {
        try {
          widgetRef.current.remove();
        } catch (error) {
          console.warn('Widget cleanup failed:', error);
        }
      }
      widgetRef.current = null;
    };
  }, [selectedPair]);

  return (
    <div className="w-full h-full min-h-[500px] bg-gray-900 rounded-md overflow-hidden">
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
};

export default TradingViewChart;