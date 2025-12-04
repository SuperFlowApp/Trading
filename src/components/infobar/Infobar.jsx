import { useState, useEffect } from 'react';
import { selectedPairStore } from '../../Zustandstore/userOrderStore.js';
import PairSelector from './PairSelector';
import { formatPrice } from '../../utils/priceFormater.js';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useMultiWebSocketGlobal } from '../../contexts/MultiWebSocketContext';

function Infobar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expand, setExpand] = useState(false);
  const selectedPair = selectedPairStore((s) => s.selectedPair);

  // Use mark price and last price from websocket
  const { payloads } = useMultiWebSocketGlobal();
  const wsMarkPrice = payloads.markPrice;
  const wsLastPrice = payloads.lastPrice;

  // Compose symbol for display
  const symbol = selectedPair ? `${selectedPair}USDT`.toUpperCase() : 'BTCUSDT';

  // Extract ticker info from websocket markPrice payload
  const ticker = wsMarkPrice && wsMarkPrice.s === symbol
    ? {
        last: wsMarkPrice.p, // mark price
        change: wsMarkPrice.priceChange,
        percentage: wsMarkPrice.priceChangePercent,
        baseVolume: wsMarkPrice.volume,
        open: wsMarkPrice.openPrice,
        bid: wsMarkPrice.bidPrice,
        ask: wsMarkPrice.askPrice,
        previousClose: wsMarkPrice.prevClosePrice,
      }
    : {};

  // Extract last price info from websocket lastPrice payload
  const lastPriceInfo = wsLastPrice && wsLastPrice.s === symbol
    ? {
        last: wsLastPrice.p,
        open: wsLastPrice.openPrice,
      }
    : {};

  useEffect(() => {
    if (ticker.last !== undefined && ticker.last !== null) {
      document.title = `${formatPrice(ticker.last)} | ${symbol}`;
    } else {
      document.title = symbol;
    }
  }, [ticker.last, symbol]);

  return (
    <div className="bg-boxbackground border-[1px] border-borderscolor flex flex-col sm:flex-row rounded-md overflow-visible">
      <div className="flex gap-2 sm:gap-8 items-center px-4 py-2">
        {/* Pair Selector always visible */}
        <PairSelector
          selectedPair={selectedPair}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
        />
        {/* Current Price always visible */}
        <div className="flex text-body items-center gap-2 sm:gap-8 text-liquidwhite">
          <div className="flex flex-col">
            <span>Mark Price:</span>
            <span className="text-white">
              {ticker.last !== undefined && ticker.last !== null
                ? formatPrice(ticker.last)
                : "--"}
            </span>
          </div>
          <div className="flex flex-col">
            <span>Last Price:</span>
            <span className="text-white">
              {lastPriceInfo.last !== undefined && lastPriceInfo.last !== null
                ? formatPrice(lastPriceInfo.last)
                : "--"}
            </span>
          </div>
        </div>
        {/* Dropdown for extra info on mobile */}
        <div className="ml-auto flex sm:hidden">
          <button
            className="flex items-center px-2 py-1 rounded text-liquidlightergray hover:text-liquidwhite"
            onClick={() => setExpand((v) => !v)}
            aria-label="Show more"
          >
            {expand ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      {/* Expanded values: below main row on mobile, inline on desktop */}
      <div className={`px-4 pb-2 ${expand ? 'flex flex-col gap-2' : 'hidden'} sm:flex sm:flex-row sm:items-center sm:gap-8 sm:pb-0 sm:px-4 text-body `}>
        <div className="flex flex-col">
          <span>24h Change:</span>
          <span
            className="text-white"
            style={{
              color:
                ticker.change > 0
                  ? 'var(--color-green)'
                  : ticker.change < 0
                  ? 'var(--color-red)'
                  : undefined,
            }}
          >
            {ticker.change !== undefined && ticker.percentage !== undefined
              ? `$${formatPrice(ticker.change)} (${Number(ticker.percentage).toFixed(0)}%)`
              : '--'}
          </span>
        </div>
        <div className="flex flex-col">
          <span>24h Volume:</span>
          <span className="text-white">
            {ticker.baseVolume !== undefined && ticker.baseVolume !== null
              ? formatPrice(ticker.baseVolume)
              : "--"}
          </span>
        </div>
        <div className="flex flex-col">
          <span>Open:</span>
          <span className="text-white">
            {ticker.open !== undefined && ticker.open !== null
              ? formatPrice(ticker.open)
              : "--"}
          </span>
        </div>
        <div className="flex flex-col">
          <span>Last Price Open:</span>
          <span className="text-white">
            {lastPriceInfo.open !== undefined && lastPriceInfo.open !== null
              ? formatPrice(lastPriceInfo.open)
              : "--"}
          </span>
        </div>
        <div className="flex flex-col">
          <span>Bid / Ask:</span>
          <span className="text-white">
            {ticker.bid !== undefined && ticker.ask !== undefined && ticker.bid !== null && ticker.ask !== null
              ? `${formatPrice(ticker.bid)} / ${formatPrice(ticker.ask)}`
              : "--"}
          </span>
        </div>
        <div className="flex flex-col">
          <span>Previous Close:</span>
          <span className="text-white">
            {ticker.previousClose !== undefined && ticker.previousClose !== null
              ? formatPrice(ticker.previousClose)
              : "--"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Infobar;