import { useRef, useEffect } from 'react';

function PairSelector({
  markets,
  tickers,
  selectedPair,
  setSelectedPair,
  dropdownOpen,
  setDropdownOpen,
}) {
  const dropdownRef = useRef(null);

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
  }, [dropdownOpen, setDropdownOpen]);

  const selectedMarket = markets.find(m => m.symbol === `${selectedPair}USDT`);

  return (
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
  );
}

export default PairSelector;