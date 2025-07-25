import { useRef, useEffect, useState } from 'react';
import { useZustandStore,marketsData } from '../../Zustandstore/panelStore';
import useUserInputStore from '../../Zustandstore/userInputStore';

function PairSelector({
  dropdownOpen,
  setDropdownOpen,
}) {
  const [markets, setMarkets] = useState([]);
  const MARKET_TYPE = 'futures';
  const dropdownRef = useRef(null);

  // Use userInputStore for selectedPair
  const selectedPair = useUserInputStore(s => s.selectedPair);
  const setSelectedPair = useUserInputStore(s => s.setSelectedPair);

  // Fetch available trading pairs and tickers
  useEffect(() => {
    async function fetchPairs() {
      try {
        const res = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/markets');
        const data = await res.json();
        //console.log('Received markets data:', data);

        // Filter for active and correct type
        const filtered = data.filter(m => m.active && m.type === MARKET_TYPE);

        // Extract base and quote from symbol if missing
        const processed = filtered.map(mkt => {
          let base = mkt.base;
          let quote = mkt.quote;
          if (!base || !quote) {
            const match = mkt.symbol.match(/^([A-Z]+)(USDT|USD|BTC|ETH|BNB|EUR|TRY|USDC)$/);
            if (match) {
              base = match[1];
              quote = match[2];
            } else {
              base = mkt.symbol;
              quote = '';
            }
          }
          return { ...mkt, base, quote };
        });

        setMarkets(processed);

        // Store all market data in marketsData store
        marketsData.getState().setAllMarketData(processed);

      } catch (err) {
        console.error('Failed to fetch trading pairs:', err);
      }
    }
    fetchPairs();
  }, []);

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

  const COIN_ICONS = {
    BTC: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    XRP: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
    DOGE: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    AAVE: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png",
    ADA: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
    XMR: "https://assets.coingecko.com/coins/images/69/large/monero_logo.png",
    DASH: "https://assets.coingecko.com/coins/images/19/large/dash-logo.png",
    ZEC: "https://assets.coingecko.com/coins/images/486/large/circle-zec.png",
    XTZ: "https://assets.coingecko.com/coins/images/976/large/tezos.png",
    BNB: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png",
    // Add more as needed
  };

  return (
    <div
      className="relative flex items-center gap-3 py-1 cursor-pointer"
      onClick={() => setDropdownOpen(v => !v)}
      ref={dropdownRef}
    >
      <div className="flex flex-col text-white">
        <div className="font-normal text-base text-[22px] flex items-center gap-2">
          {selectedMarket && COIN_ICONS[selectedMarket.base] && (
            <img
              src={COIN_ICONS[selectedMarket.base]}
              alt={selectedMarket.base}
              className="w-6 h-6 mr-1"
              style={{ display: "inline-block", verticalAlign: "middle" }}
            />
          )}
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
                {/* <th className="px-2 py-1">Market</th> */}
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Maker Fee</th>
                <th className="px-2 py-1">Taker Fee</th>
                <th className="px-2 py-1">Funding Every</th>
                <th className="px-2 py-1">Max Leverage</th>
                <th className="px-2 py-1">Margin Modes</th>
              </tr>
            </thead>
            <tbody>
              {markets.map(mkt => {
                // Find max leverage from marginTiers
                let maxLeverage = "-";
                if (Array.isArray(mkt.marginTiers) && mkt.marginTiers.length > 0) {
                  maxLeverage = Math.max(...mkt.marginTiers.map(tier => Number(tier.maxLeverage)));
                }
                // Margin Modes
                let marginModes = "-";
                if (mkt.marginModes) {
                  marginModes = [
                    mkt.marginModes.cross ? "Cross" : null,
                    mkt.marginModes.isolated ? "Isolated" : null,
                  ].filter(Boolean).join(", ");
                }
                return (
                  <tr
                    key={mkt.id}
                    className={`cursor-pointer border border-transparent hover:bg-primary2deactiveactive ${`${selectedPair}USDT` === mkt.symbol ? 'bg-primary2deactive' : ''}`}
                    onClick={e => {
                      e.stopPropagation();
                      setDropdownOpen(false);
                      setSelectedPair(mkt.base);
                      localStorage.setItem('selectedPairDetails', JSON.stringify(mkt));
                    }}
                  >
                    <td className="px-2 py-1 font-bold text-white">{mkt.base} / {mkt.quote}</td>
                    <td className="px-2 py-1">
                      <span className={mkt.active ? "text-green-400" : "text-red-400"}>
                        {mkt.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-2 py-1">{mkt.makerFee ? `${(parseFloat(mkt.makerFee) * 100).toFixed(1)}%` : "-"}</td>
                    <td className="px-2 py-1">{mkt.takerFee ? `${(parseFloat(mkt.takerFee) * 100).toFixed(1)}%` : "-"}</td>
                    <td className="px-2 py-1">{mkt.fundingPeriod ? `${mkt.fundingPeriod / 3600000}h` : "-"}</td>
                    <td className="px-2 py-1">{maxLeverage !== "-" ? `${maxLeverage}x` : "-"}</td>
                    <td className="px-2 py-1">{marginModes}</td>
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