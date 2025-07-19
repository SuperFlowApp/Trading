import { useState, useEffect } from 'react';
import usePanelStore from '../../Zustandstore/panelStore.js';
import PairSelector from './PairSelector';

function Infobar() {
  const [ticker, setTicker] = useState({});
  const [markets, setMarkets] = useState([]);
  const [tickers, setTickers] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const MARKET_TYPE = 'spot';

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

  // Fetch available trading pairs
  useEffect(() => {
    async function fetchPairs() {
      try {
        const res = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/markets');
        const data = await res.json();
        const filtered = data.filter(m => m.active && m.type === MARKET_TYPE);
        setMarkets(filtered);

        // Fetch tickers for all pairs
        const tickersObj = {};
        await Promise.all(
          filtered.map(async (mkt) => {
            try {
              const tRes = await fetch(`https://fastify-serverless-function-rimj.onrender.com/api/ticker?symbol=${mkt.symbol}`);
              if (!tRes.ok) return;
              const tData = await tRes.json();
              tickersObj[mkt.symbol] = tData;
            } catch { }
          })
        );
        setTickers(tickersObj);
      } catch (err) {
        console.error('Failed to fetch trading pairs:', err);
      }
    }
    fetchPairs();
  }, []);

  // Fetch ticker for selected pair (from Zustand)
  useEffect(() => {
    const symbol = selectedPair ? `${selectedPair}USDT` : null;
    if (!symbol) return;
    async function fetchTicker() {
      try {
        const res = await fetch(`https://fastify-serverless-function-rimj.onrender.com/api/ticker?symbol=${symbol}`);
        const data = await res.json();
        setTicker(data);

        // Persist selected pair details
        const selectedMarket = markets.find(m => m.symbol === symbol);
        if (selectedMarket) {
          localStorage.setItem('selectedPairDetails', JSON.stringify(selectedMarket));
        }
      } catch (err) {
        console.error('Failed to fetch ticker:', err);
      }
    }

    fetchTicker();
    const interval = setInterval(fetchTicker, 5000);
    return () => clearInterval(interval);
  }, [selectedPair, markets]);

  return (
    <div className="bg-backgrounddark rounded-md overflow-visible mb-2">
      <div className="flex gap-8 items-start items-center px-4 py-2">
        {/* Pair Selector */}
        <PairSelector
          markets={markets}
          tickers={tickers}
          selectedPair={selectedPair}
          setSelectedPair={setSelectedPair}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
        />
        {/* Ticker Details */}
        <div className="flex  text-[14px] items-center gap-8 text-secondary1">
          <div className="flex flex-col">
            <span>Price:</span>
            <span className="text-white ">{ticker.last}</span>
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
              ${ticker.change} ({ticker.percentage}%)
            </span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>24h Volume:</span>
            <span className="text-white ">{ticker.baseVolume}</span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Open:</span>
            <span className="text-white ">{ticker.open}</span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Bid / Ask:</span>
            <span className="text-white">
              {ticker.bid} / {ticker.ask}
            </span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Previous Close:</span>
            <span className="text-white">{ticker.previousClose}</span>
          </div>
        </div>
      </div>
    </div>
  );

}

export default Infobar;
