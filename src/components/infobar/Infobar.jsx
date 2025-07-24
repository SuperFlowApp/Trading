import { useState, useEffect } from 'react';
import useZustandStore from '../../Zustandstore/panelStore.js';
import PairSelector from './PairSelector';

function Infobar() {
  const [ticker, setTicker] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

    const symbol = `${selectedPair}usdt`.toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@ticker`);

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
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      ws.close();
    };
  }, [selectedPair]);

  function formatPrice(value) {
    if (value == null || isNaN(value)) return '';
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
            <span className="text-white ">{formatPrice(ticker.last)}</span>
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
              ${formatPrice(ticker.change)} ({ticker.percentage && Number(ticker.percentage).toFixed(0)}%)
            </span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>24h Volume:</span>
            <span className="text-white ">{formatPrice(ticker.baseVolume)}</span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Open:</span>
            <span className="text-white ">{formatPrice(ticker.open)}</span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Bid / Ask:</span>
            <span className="text-white">
              {formatPrice(ticker.bid)} / {formatPrice(ticker.ask)}
            </span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Previous Close:</span>
            <span className="text-white">{formatPrice(ticker.previousClose)}</span>
          </div>
        </div>
      </div>
    </div>
  );

}

export default Infobar;
