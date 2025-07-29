import { useState, useEffect } from 'react';
import {selectedPairStore} from '../../Zustandstore/userOrderStore.js';
import PairSelector from './PairSelector';
import { formatPrice } from '../../utils/priceFormater.js';

function Infobar() {
  const [ticker, setTicker] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const selectedPair = selectedPairStore((s) => s.selectedPair);

  useEffect(() => {
    if (!selectedPair) return;
    const symbol = `${selectedPair}USDT`.toUpperCase();
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
    let ignore = false;

    async function fetchTicker() {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (!ignore) {
          setTicker({
            last: data.lastPrice,
            change: data.priceChange,
            percentage: data.priceChangePercent,
            baseVolume: data.volume,
            open: data.openPrice,
            bid: data.bidPrice,
            ask: data.askPrice,
            previousClose: data.prevClosePrice,
          });
        }
      } catch {
        if (!ignore) setTicker({});
      }
    }

    fetchTicker();
    const interval = setInterval(fetchTicker, 2000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [selectedPair]);

  return (
    <div className="bg-backgroundmid rounded-md overflow-visible">
      <div className="flex gap-8 items-center px-4 py-2">
        <PairSelector
          selectedPair={selectedPair}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
        />
        <div className="flex text-[14px] items-center gap-8 text-liquidwhite">
          <div className="flex flex-col">
            <span>Price:</span>
            <span className="text-white">{formatPrice(ticker.last)}</span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>24h Change:</span>
            <span
              className="text-white"
              style={{
                color:
                  ticker.change > 0
                    ? 'var(--color-primary2)'
                    : ticker.change < 0
                    ? 'var(--color-primary1)'
                    : undefined,
              }}
            >
              {ticker.change !== undefined && ticker.percentage !== undefined
                ? `$${formatPrice(ticker.change)} (${Number(ticker.percentage).toFixed(0)}%)`
                : ''}
            </span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>24h Volume:</span>
            <span className="text-white">{formatPrice(ticker.baseVolume)}</span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Open:</span>
            <span className="text-white">{formatPrice(ticker.open)}</span>
          </div>
          <div className="w-[1.5px] h-5 bg-white/10 self-center" />
          <div className="flex flex-col">
            <span>Bid / Ask:</span>
            <span className="text-white">
              {ticker.bid !== undefined && ticker.ask !== undefined
                ? `${formatPrice(ticker.bid)} / ${formatPrice(ticker.ask)}`
                : ''}
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