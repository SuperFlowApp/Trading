import { useState, useEffect, useRef } from 'react';
import useZustandStore from '../../Zustandstore/panelStore.js';
import PairSelector from './PairSelector';

function Infobar() {
  const [ticker, setTicker] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Zustand global state
  const selectedPair = useZustandStore((s) => s.selectedPair);
  const setSelectedPair = useZustandStore((s) => s.setSelectedPair);

  // On mount: set selectedPair from localStorage if available
  useEffect(() => {
    const stored = localStorage.getItem('selectedPairDetails');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelectedPair(parsed.base);
      } catch { }
    }
  }, [setSelectedPair]);

  // Fetch ticker for selected pair (from Zustand) using WebSocket
  useEffect(() => {
    if (!selectedPair) return;

    let ws;
    let reconnectTimeout;

    function connect() {
      setLoading(true);
      setTicker({});
      const symbol = `${selectedPair}usdt`.toLowerCase();
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@ticker`);
      wsRef.current = ws;

      ws.onopen = () => {
        setLoading(true);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setTicker({
          last: data.c,
          change: data.p,
          percentage: data.P,
          baseVolume: data.v,
          open: data.o,
          bid: data.b,
          ask: data.a,
          previousClose: data.x,
        });
        setLoading(false);
      };

      ws.onerror = () => {
        setLoading(true);
        setTicker({});
        // Only close if already OPEN, not CONNECTING
        if (ws.readyState === 1) ws.close();
      };

      ws.onclose = () => {
        setLoading(true);
        setTicker({});
        reconnectTimeout = setTimeout(() => {
          connect();
        }, 2000);
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent triggering reconnect on manual close
        if (wsRef.current.readyState === 1) {
          wsRef.current.close();
        }
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [selectedPair]);

  function formatPrice(value) {
    if (value == null || isNaN(value)) return '--';
    const num = Number(value);
    let formatted;
    if (num < 1) formatted = num.toFixed(4);
    else if (num < 10) formatted = num.toFixed(3);
    else if (num < 100) formatted = num.toFixed(2);
    else if (num < 1000) formatted = num.toFixed(1);
    else formatted = num.toFixed(0);
    // Add thousands separator
    return Number(formatted).toLocaleString();
  }

  // Helper to show "--" if loading or value is invalid
  function displayValue(val) {
    if (loading || val == null || isNaN(val)) return '--';
    return formatPrice(val);
  }

  return (
    <div className="bg-backgroundmid rounded-md overflow-visible">
      <div className="flex gap-8 items-start items-center px-4 py-2">
        {/* Pair Selector */}
        <PairSelector
          selectedPair={selectedPair}
          setSelectedPair={setSelectedPair}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
        />
        {/* Ticker Details */}
        <div className="flex  text-[14px] items-center gap-8 text-liquidwhite">
          <div className="flex flex-col">
            <span>Price:</span>
            <span className="text-white ">{displayValue(ticker.last)}</span>
          </div>

          <div className="w-[1.5px] h-5 bg-white/10 self-center" />

          <div className="flex flex-col ">
            <span>24h Change:</span>
            <span className="text-white "
              style={{
                color: ticker.change > 0
                  ? 'var(--color-primary2)'
                  : ticker.change < 0
                    ? 'var(--color-primary1)'
                    : undefined
              }}
            >
              {loading ? '--' : `$${formatPrice(ticker.change)} (${ticker.percentage && !loading ? Number(ticker.percentage).toFixed(0) : '--'}%)`}
            </span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>24h Volume:</span>
            <span className="text-white ">{displayValue(ticker.baseVolume)}</span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Open:</span>
            <span className="text-white ">{displayValue(ticker.open)}</span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Bid / Ask:</span>
            <span className="text-white">
              {displayValue(ticker.bid)} / {displayValue(ticker.ask)}
            </span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Previous Close:</span>
            <span className="text-white">{displayValue(ticker.previousClose)}</span>
          </div>
        </div>
      </div>
    </div>
  );

}

export default Infobar;
