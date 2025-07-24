import { useState, useEffect } from 'react';
import usePanelStore from '../../Zustandstore/panelStore.js';
import PairSelector from './PairSelector';

function Infobar() {
  const [ticker, setTicker] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Zustand global state
  const selectedPair = usePanelStore((s) => s.selectedPair);
  const setSelectedPair = usePanelStore((s) => s.setSelectedPair);

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
            <span className="text-white ">{ticker.last && Number(ticker.last).toFixed(0)}</span>
          </div>

          <div className="w-[1.5px] h-5 bg-white/10 self-center" />

          <div className="flex flex-col ">
            <span>24h Change:</span>
            <span className="text-white "
              style={{
                color: ticker.change > 0
                  ? '#00B7C9'
                  : ticker.change < 0
                    ? '#F5CB9D'
                    : undefined
              }}
            >
              ${ticker.change && Number(ticker.change).toFixed(0)} ({ticker.percentage && Number(ticker.percentage).toFixed(0)}%)
            </span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>24h Volume:</span>
            <span className="text-white ">{ticker.baseVolume && Number(ticker.baseVolume).toFixed(0)}</span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Open:</span>
            <span className="text-white ">{ticker.open && Number(ticker.open).toFixed(0)}</span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Bid / Ask:</span>
            <span className="text-white">
              {(ticker.bid && Number(ticker.bid).toFixed(0))} / {(ticker.ask && Number(ticker.ask).toFixed(0))}
            </span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Previous Close:</span>
            <span className="text-white">{ticker.previousClose && Number(ticker.previousClose).toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );

}

export default Infobar;
