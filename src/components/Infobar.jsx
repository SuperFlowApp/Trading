import { useState, useEffect, useRef } from 'react';
import usePanelStore from '../store/panelStore.js';

function Infobar() {
  const [ticker, setTicker] = useState({});
  const [markets, setMarkets] = useState([]);
  const [tickers, setTickers] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const selectedMarket = markets.find(m => m.symbol === `${selectedPair}USDT`);

  return (
    <div className="bg-backgrounddark rounded-md overflow-visible mb-2">
      <div className="flex gap-8 items-start items-center px-4 py-2">
        {/* Custom Dropdown */}
        <div
          className="relative flex items-center gap-3 py-1 cursor-pointer"
          onClick={() => setDropdownOpen(v => !v)}
          ref={dropdownRef}
        >
          <div className="flex flex-col text-white">
            <div className="font-normal text-base text-[22px]">
              {selectedMarket ? `${selectedMarket.base} - ${selectedMarket.quote}` : `${selectedPair}USDT`}
            </div>
          </div>
          <div className="flex items-center justify-center w-6 h-6 rounded">
            <img src="/assets/arrow.svg" alt="icon" className="w-3.5 h-[10px]" />
          </div>
          {dropdownOpen && (
            <div className="absolute z-50 left-0 top-full mt-2 bg-backgrounddark border border-secondary2 rounded-lg shadow-lg w-[600px] max-h-[350px] overflow-auto">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="bg-backgroundlight text-white">
                    <th className="px-2 py-1">Pair</th>
                    <th className="px-2 py-1">Last Price</th>
                    <th className="px-2 py-1">24h Change</th>
                    <th className="px-2 py-1">24h Volume</th>
                    <th className="px-2 py-1">Min/Max Size</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.map(mkt => {
                    const t = tickers[mkt.symbol] || {};
                    return (
                      <tr
                        key={mkt.id}
                        className={`cursor-pointer border border-transparent hover:border-primary2 ${`${selectedPair}USDT` === mkt.symbol ? 'bg-primary2/30' : ''}`}
                        onClick={e => {
                          e.stopPropagation();
                          setDropdownOpen(false);
                          setSelectedPair(mkt.base);
                          localStorage.setItem('selectedPairDetails', JSON.stringify(mkt));
                        }}
                      >
                        <td className="px-2 py-1 font-bold text-white">{mkt.base} / {mkt.quote}</td>
                        <td className="px-2 py-1">{t.last ?? "-"}</td>
                        <td className={`px-2 py-1 ${t.change > 0 ? " text-primary2" : t.change < 0 ? "text-primary1" : "text-warningcolor"}`}>
                          {t.change !== undefined ? `${t.change} (${t.percentage}%)` : "-"}
                        </td>
                        <td className="px-2 py-1">{t.baseVolume ?? "-"}</td>
                        <td className="px-2 py-1">
                          {mkt.limits?.quantity
                            ? (
                              <span>
                                <span className="">{mkt.limits.quantity.min}</span>
                                <span className="mx-1 ">-</span>
                                <span className="">{mkt.limits.quantity.max}</span>
                              </span>
                            )
                            : <span className="">-</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
