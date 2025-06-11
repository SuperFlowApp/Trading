import { useState, useEffect, useRef } from 'react';

function Infobar({ selectedPair, setSelectedPair }) {
  const [ticker, setTicker] = useState({});
  const [markets, setMarkets] = useState([]);
  const [tickers, setTickers] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const MARKET_TYPE = 'spot';

  // Fetch available trading pairs from /api/markets
  useEffect(() => {
    async function fetchPairs() {
      try {
        const res = await fetch('https://trading-eta-ten.vercel.app/api/markets'); // Updated URL
        const data = await res.json();
        const filtered = data.filter(m => m.active && m.type === MARKET_TYPE);
        setMarkets(filtered);

        // Fetch tickers for all pairs
        const tickersObj = {};
        await Promise.all(
          filtered.map(async (mkt) => {
            try {
              const tRes = await fetch(`http://localhost:3001/api/ticker?symbol=${mkt.symbol}`); // Updated URL
              if (!tRes.ok) return;
              const tData = await tRes.json();
              tickersObj[mkt.symbol] = tData;
            } catch {}
          })
        );
        setTickers(tickersObj);

        // Auto-set first pair if none selected
        if (!selectedPair && filtered.length > 0) {
          setSelectedPair(filtered[0].symbol);
        }
      } catch (err) {
        console.error('Failed to fetch trading pairs:', err);
      }
    }
    fetchPairs();
    // eslint-disable-next-line
  }, [selectedPair, setSelectedPair]);

  // Fetch ticker for selected pair (for Infobar details)
  useEffect(() => {
    if (!selectedPair) return;
    async function fetchTicker() {
      try {
        const res = await fetch(`http://localhost:3001/api/ticker?symbol=${selectedPair}`);
        const data = await res.json();
        setTicker(data);
      } catch (err) {
        console.error('Failed to fetch ticker:', err);
      }
    }

    fetchTicker();
    const interval = setInterval(fetchTicker, 5000);
    return () => clearInterval(interval);
  }, [selectedPair]);

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

  const selectedMarket = markets.find(m => m.symbol === selectedPair);

  return (
    <div className="w-full flex justify-between items-center px-4 py-2 rounded-md text-[#7DADB1] text-sm font-medium flex-wrap gap-4 whitespace-nowrap overflow-visible bg-[#002122]">
      <div className="flex gap-10 items-start">
        {/* Custom Dropdown */}
        <div className="relative border border-[#1E4D4E] flex items-center gap-3 px-3 py-2 rounded-[10px]" ref={dropdownRef}>
          <div className="flex flex-col text-white">
            <div className="font-bold text-base">
              {selectedMarket ? `${selectedMarket.base} / ${selectedMarket.quote}` : selectedPair}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#7DADB1]">
              <span>{selectedMarket?.symbol || '...'}</span>
            </div>
          </div>
          <div className="flex items-center justify-center w-6 h-6 rounded cursor-pointer" onClick={() => setDropdownOpen(v => !v)}>
            <img src="/assets/arrow.svg" alt="icon" className="w-2.5 h-[5px]" />
          </div>
          {dropdownOpen && (
            <div className="absolute z-50 left-0 top-full mt-2 bg-[#00191A] border border-[#1E4D4E] rounded-lg shadow-lg w-[600px] max-h-[350px] overflow-auto">
              <table className="min-w-full text-xs text-left text-[#7DADB1]">
                <thead>
                  <tr className="bg-[#003133] text-white">
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
                        className={`cursor-pointer hover:bg-[#01484B] ${selectedPair === mkt.symbol ? 'bg-[#013133]' : ''}`}
                        onClick={() => {
                          setSelectedPair(mkt.symbol);
                          setDropdownOpen(false);
                        }}
                      >
                        <td className="px-2 py-1 font-bold text-white">{mkt.base} / {mkt.quote}</td>
                        <td className="px-2 py-1 text-[#2D9DA8]">{t.last ?? "-"}</td>
                        <td className={`px-2 py-1 ${t.change > 0 ? "text-[#00B7C9]" : t.change < 0 ? "text-[#F5CB9D]" : "text-[#7DADB1]"}`}>
                          {t.change !== undefined ? `${t.change} (${t.percentage}%)` : "-"}
                        </td>
                        <td className="px-2 py-1 text-[#7DADB1]">{t.baseVolume ?? "-"}</td>
                        <td className="px-2 py-1 text-[#7DADB1]">
                          {mkt.limits?.quantity
                            ? (
                              <span>
                                <span className="text-[#2D9DA8]">{mkt.limits.quantity.min}</span>
                                <span className="mx-1 text-[#7DADB1]">-</span>
                                <span className="text-[#2D9DA8]">{mkt.limits.quantity.max}</span>
                              </span>
                            )
                            : <span className="text-[#7DADB1]">-</span>
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
        <div className="flex  text-[14px] items-center gap-8 text-[#8AABB2]">
          <span className="text-white text-sm self-center">${ticker.last}</span>
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
            <span>Mark / Index:</span>
            <span className="text-white">
              {ticker.markPrice} / {ticker.indexPrice}
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
