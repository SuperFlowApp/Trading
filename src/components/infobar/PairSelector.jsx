import { useRef, useEffect, useState } from 'react';
import { marketsData } from '../../Zustandstore/marketsDataStore';
import {selectedPairStore} from '../../Zustandstore/userOrderStore.js';
import { formatPrice } from '../../utils/priceFormater.js';

function PairSelector({
  dropdownOpen,
  setDropdownOpen,
}) {
  const [markets, setMarkets] = useState([]);
  const [marketStats, setMarketStats] = useState({}); // New state for stats
  const MARKET_TYPE = 'futures';
  const dropdownRef = useRef(null);

  // Use userOrderStore.js for selectedPair
  const selectedPair = selectedPairStore(s => s.selectedPair);
  const setSelectedPair = selectedPairStore(s => s.setSelectedPair);

  // Fetch available trading pairs and tickers
  useEffect(() => {
    let intervalId;

    async function fetchPairs() {
      try {
        const res = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/markets');
        const data = await res.json();

        // Filter for active and correct type
        const filtered = data.filter(m => m.active && m.type === MARKET_TYPE);

        // Extract base and quote from symbol if missing
        const processed = filtered.map(mkt => {
          let base = mkt.base;
          let quote = mkt.quote;
          if (!base || !quote) {
            const match = mkt.symbol.match(/^([A-Z]+)(USDT)$/);
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
    intervalId = setInterval(fetchPairs, 4000);

    return () => clearInterval(intervalId);
  }, []);

  /*/ Fetch stats for each market from Binance every 5 seconds
  useEffect(() => {
    if (markets.length === 0) return;
    let statsInterval;

    async function fetchStats() {
      const stats = {};
      await Promise.all(markets.map(async mkt => {
        try {
          // Binance Futures API endpoints
          const symbol = mkt.symbol;
          // 24h ticker
          const tickerRes = await fetch(``);
          const ticker = await tickerRes.json();

          // Funding rate (8hr)
          const fundingRes = await fetch(``);
          const funding = await fundingRes.json();

          // Open Interest
          const oiRes = await fetch(``);
          const openInterest = await oiRes.json();

          stats[symbol] = {
            lastPrice: ticker.lastPrice,
            priceChangePercent: ticker.priceChangePercent,
            priceChange: ticker.priceChange, // <-- add this line
            volume: ticker.volume,
            fundingRate: funding.lastFundingRate,
            openInterest: openInterest.openInterest,
          };
        } catch (err) {
          stats[mkt.symbol] = null;
        }
      }));
      setMarketStats(stats);
    }

    fetchStats();
    statsInterval = setInterval(fetchStats, 5000);

    return () => clearInterval(statsInterval);
  }, [markets]);
*/
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
        <div className="font-normal text-title flex items-center gap-2">
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
        <div className="absolute z-50 left-0 top-full mt-2 bg-backgrounddark border border-secondary2 rounded-md shadow-lg w-[900px] max-h-[350px] overflow-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="bg-backgroundlight text-white">
                <th className="px-2 py-1">Pair</th>
                <th className="px-2 py-1">Last Price</th>
                <th className="px-2 py-1">24h Change</th>
                <th className="px-2 py-1">8hr Funding</th>
                <th className="px-2 py-1">Volume</th>
                <th className="px-2 py-1">Open Interest</th>
                {/* Removed max leverage column */}
              </tr>
            </thead>
            <tbody>
              {markets.map(mkt => {
                const stats = marketStats[mkt.symbol] || {};
                // Get market data from global store
                const allMarketData = marketsData.getState().allMarketData || [];
                const marketObj = allMarketData.find(md => md.symbol === mkt.symbol);
                // Find max leverage
                let maxLeverage = '-';
                if (marketObj && Array.isArray(marketObj.marginTiers)) {
                  maxLeverage = Math.max(...marketObj.marginTiers.map(tier => tier.maxLeverage));
                }
                return (
                  <tr
                    key={mkt.id}
                    className={`cursor-pointer border border-transparent hover:bg-primary2dark ${`${selectedPair}USDT` === mkt.symbol ? 'bg-primary2darker' : ''}`}
                    onClick={e => {
                      e.stopPropagation();
                      setDropdownOpen(false);
                      setSelectedPair(mkt.base);
                      localStorage.setItem('selectedPairDetails', JSON.stringify(mkt));
                    }}
                  >
                    <td className="px-2 py-1 font-bold text-white">
                      {mkt.base} / {mkt.quote}
                      {maxLeverage !== '-' && (
                        <span className="ml-1 text-primary2normal">[{maxLeverage}x]</span>
                      )}
                    </td>
                    <td className="px-2 py-1">{stats.lastPrice ? formatPrice(stats.lastPrice) : "-"}</td>
                    <td className="px-2 py-1"
                      style={{
                        color:
                          stats.priceChangePercent > 0
                            ? 'var(--color-green)'
                            : stats.priceChangePercent < 0
                            ? 'var(--color-liquidRed)'
                            : undefined,
                      }}
                    >
                      {stats.priceChangePercent && stats.lastPrice
                        ? `${formatPrice(stats.priceChange)} / ${formatPrice(stats.priceChangePercent)}%`
                        : "-"}
                    </td>
                    <td className="px-2 py-1">{stats.fundingRate ? `${formatPrice(stats.fundingRate * 100)}%` : "-"}</td>
                    <td className="px-2 py-1">{stats.volume ? formatPrice(stats.volume) : "-"}</td>
                    <td className="px-2 py-1">{stats.openInterest ? formatPrice(stats.openInterest) : "-"}</td>
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