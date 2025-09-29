import React, { useEffect, useRef, useState, memo } from 'react';
import { useZustandStore } from '../../Zustandstore/useStore.js';
import { selectedPairStore } from '../../Zustandstore/userOrderStore.js';
import { formatPrice } from '../../utils/priceFormater.js';
import { MinimalDropDown } from '../CommonUIs/inputs/inputs.jsx';
import { useMultiWebSocketGlobal } from '../../contexts/MultiWebSocketContext';

// Memoized Row for per-row update
const Row = memo(({ size, price, total, progress, color, onSelect, isNew, fontSizeClass = "text-body", fontWeightClass = "font-medium", textAlign, displayCurrency }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    if (isNew) {
      setIsBlinking(true);
      const timeout = setTimeout(() => setIsBlinking(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isNew]);

  const handleSelect = () => {
    setIsSelected(true);
    setTimeout(() => setIsSelected(false), 200);
    onSelect(price);
  };

  const textColor = color === 'green' ? 'text-green' : 'text-red';
  const alignClass = textAlign === "right" ? "text-right" : "text-left";
  const rowClasses = `relative flex justify-between w-full py-[1px] px-1 text-body transition-colors cursor-pointer ${isBlinking
    ? color === 'red'
      ? 'bg-red/40'
      : 'bg-green/40'
    : 'bg-transparent'
    } ${isSelected ? 'border border-[#FFF]' : 'border border-transparent'}`;

  return (
    <li className="relative w-full my-[1px]" onClick={handleSelect}>
      <div
        className="absolute top-0 left-0 h-full"
        style={{
          width: `${progress}%`,
          background: color === 'red' ? '#F59DEF80' : '#00B7C980',
          opacity: 0.3,
        }}
      />
      <div className={rowClasses}>
        {/* Price */}
        <div className={`${fontWeightClass} ${fontSizeClass} w-1/4 ${textColor} text-left`}>
          {formatPrice(price)}
        </div>
        {/* Size */}
        <div className={`${fontSizeClass} w-1/4 ${alignClass}`}>
          {displayCurrency === 'USDT' ? formatPrice(size) : size.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
        </div>
        {/* Total */}
        <div className={`${fontSizeClass} w-1/4 ${alignClass}`}>
          {displayCurrency === 'USDT' ? formatPrice(total) : total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
        </div>
      </div>
    </li>
  );
});

const OrderBook = () => {
  // Fetch selectedPair from user input store
  const selectedPair = selectedPairStore(s => s.selectedPair);
  const symbol = `${selectedPair}USDT`;
  
  // Use global websocket hook
  const { payloads, states } = useMultiWebSocketGlobal();
  
  // Get orderbook data for current symbol
  const orderbookData = payloads.orderbook;
  const wsConnected = states.orderbook === 'open';
  
  // Track if we're fetching from REST API
  const [isFetchingRest, setIsFetchingRest] = useState(false);
  // Track orderbook data
  const [localOrderbookData, setLocalOrderbookData] = useState({ bids: [], asks: [] });
  
  // Function to fetch orderbook data from REST API
  const fetchOrderbookRest = async () => {
    try {
      setIsFetchingRest(true);
      const response = await fetch(`https://fastify-serverless-function-rimj.onrender.com/api/orderbooks?symbol=${symbol}&limit=20`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the data to match WebSocket format
      if (data && data.bids && data.asks) {
        setLocalOrderbookData({
          b: data.bids.map(([price, qty]) => [price, qty]),
          a: data.asks.map(([price, qty]) => [price, qty])
        });
      }
    } catch (error) {
      console.error("Error fetching orderbook data:", error);
    } finally {
      setIsFetchingRest(false);
    }
  };
  
  // Setup polling for REST API when WebSocket is not connected
  useEffect(() => {
    let intervalId = null;
    
    if (!wsConnected && !isFetchingRest) {
      // Initial fetch
      fetchOrderbookRest();
      
      // Setup polling interval
      intervalId = setInterval(() => {
        fetchOrderbookRest();
      }, 3000); // Poll every 3 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [wsConnected, symbol, isFetchingRest]);

  // Helper to format orderbook arrays
  const formatBook = (arr) =>
    arr.map(([price, size]) => ({
      price: parseFloat(price),
      size: parseFloat(size),
    }));

  // Extract bids/asks from either websocket payload or REST API data
  const activeData = wsConnected ? orderbookData : localOrderbookData;
  const bids = activeData?.b ? formatBook(activeData.b) : [];
  const asks = activeData?.a ? formatBook(activeData.a) : [];
  const error = null; // You can add error handling if needed

  const [spreadValue, setSpreadValue] = useState(null);
  const [spreadPercentage, setSpreadPercentage] = useState(null);
  const setPriceMidpoint = useZustandStore(s => s.setPriceMidpoint);

  // --- synced currency selector (shared with OrderPanel) ---
  const selectedCurrencyGlobal = useZustandStore(s => s.selectedCurrency);
  const setSelectedCurrencyGlobal = useZustandStore(s => s.setSelectedCurrency);
  const baseCurrency = selectedPair || 'BTC';
  const quoteCurrency = 'USDT';

  // Track previous prices for asks and bids
  const prevAskPrices = useRef(new Set());
  const prevBidPrices = useRef(new Set());

  // Helper to mark new prices and calculate cumulative totals
  const addTotals = (rows, reverse = false, prevPricesSet = new Set()) => {
    const sortedRows = [...rows].sort((a, b) => b.price - a.price);

    let limitedRows;
    if (reverse) {
      // For bids: top 10 most expensive (already sorted descending)
      limitedRows = sortedRows.slice(0, 10);
    } else {
      // For asks: top 10 cheapest (last 10 in descending order)
      limitedRows = sortedRows.slice(-10);
    }

    // For cumulative totals, we need to process in display order:
    // - Asks: from top (lowest price) to bottom (highest price)
    // - Bids: from top (highest price) to bottom (lowest price)
    const displayRows = reverse ? limitedRows : [...limitedRows].reverse();

    // Find max size for progress bar
    const maxSize = Math.max(...displayRows.map((r) => r.size), 1);

    let cumulativeBase = 0;
    let cumulativeQuote = 0;

    const result = displayRows.map((r) => {
      cumulativeBase += r.size;
      cumulativeQuote += r.size * r.price;
      const progress = (r.size / maxSize) * 100;
      const isNew = !prevPricesSet.has(r.price);
      return {
        ...r,
        progress,
        isNew,
        cumulativeBase,
        cumulativeQuote,
      };
    });

    // For asks, we reversed for display, so reverse back to match UI order
    return reverse ? result : result.reverse();
  };

  // Update previous prices after each render
  useEffect(() => {
    prevAskPrices.current = new Set(asks.map(a => a.price));
    prevBidPrices.current = new Set(bids.map(b => b.price));
  }, [asks, bids]);

  const calculateSpread = () => {
    if (bids.length === 0 || asks.length === 0) return { value: null, percentage: null };
    const highestBid = bids[0].price;
    const lowestAsk = asks[0].price;
    const spreadValue = lowestAsk - highestBid;
    const midpoint = (highestBid + lowestAsk) / 2;
    const spreadPercentage = (spreadValue / midpoint) * 100;
    return { value: formatPrice(spreadValue), percentage: spreadPercentage };
  };

  const calculatePriceMidpoint = () => {
    if (bids.length === 0 || asks.length === 0) return null;
    const sumBids = bids.reduce((sum, bid) => sum + bid.price, 0);
    const sumAsks = asks.reduce((sum, ask) => sum + ask.price, 0);
    const totalCount = bids.length + asks.length;
    const midpoint = (sumBids + sumAsks) / totalCount;
    return Number(midpoint).toFixed(4);
  };

  useEffect(() => {
    if (bids.length > 0 && asks.length > 0) {
      const { value, percentage } = calculateSpread();
      setSpreadValue(value);
      setSpreadPercentage(percentage);

      const newPriceMidpoint = calculatePriceMidpoint();
      setPriceMidpoint(newPriceMidpoint); // <-- Write to Zustand

    } else {
      setSpreadValue(null);
      setSpreadPercentage(null);
      setPriceMidpoint(null); // <-- Reset in Zustand
    }
  }, [bids, asks, setPriceMidpoint]);

  const setOrderBookClickedPrice = useZustandStore(s => s.setOrderBookClickedPrice);

  const handleRowSelect = (price) => {
    setOrderBookClickedPrice(price); // <-- Write to Zustand
  };

  const [hoveredAskIndex, setHoveredAskIndex] = useState(null);
  const [hoveredBidIndex, setHoveredBidIndex] = useState(null);
  // mousePos removed — tooltip will be positioned relative to the row

  // Refs for measuring rows and container so the tooltip can be placed OUTSIDE the book on the left
  const containerRef = useRef(null);
  const askRowRefs = useRef([]);
  const bidRowRefs = useRef([]);

  // Tooltip state: position is viewport coords (fixed) so it won't be clipped by container
  const [tooltip, setTooltip] = useState({ visible: false, top: 0, left: 0, content: null, color: 'red' });
  const TOOLTIP_WIDTH = 130; // adjusted for new tooltip width

  // Calculate cumulative sum for hovered asks (from bottom up)
  const hoveredAskSum = hoveredAskIndex !== null
    ? addTotals(asks, false)
      .slice(-10)
      .slice(hoveredAskIndex)
      .reduce((sum, row) => sum + row.size, 0)
    : null;

  // Calculate cumulative sum for hovered bids (from top down)
  const hoveredBidSum = hoveredBidIndex !== null
    ? addTotals(bids, true)
      .slice(0, hoveredBidIndex + 1)
      .reduce((sum, row) => sum + row.size, 0)
    : null;

  // Calculate stats for hovered asks (from bottom up)
  const hoveredAskStats = (() => {
    if (hoveredAskIndex === null) return null;
    const rows = addTotals(asks, false).slice(-10).slice(hoveredAskIndex);
    if (!rows.length) return null;
    const totalSize = rows.reduce((sum, row) => sum + row.size, 0);
    const totalUSDT = rows.reduce((sum, row) => sum + row.size * row.price, 0);
    const avgPrice = totalUSDT / totalSize;
    return {
      avgPrice,
      totalSize,
      totalUSDT,
    };
  })();

  // Calculate stats for hovered bids (from top down)
  const hoveredBidStats = (() => {
    if (hoveredBidIndex === null) return null;
    const rows = addTotals(bids, true).slice(0, hoveredBidIndex + 1);
    if (!rows.length) return null;
    const totalSize = rows.reduce((sum, row) => sum + row.size, 0);
    const totalUSDT = rows.reduce((sum, row) => sum + row.size * row.price, 0);
    const avgPrice = totalUSDT / totalSize;
    return {
      avgPrice,
      totalSize,
      totalUSDT,
    };
  })();

  // Mouse event handlers for asks
  const handleAskMouseEnter = (index) => (e) => {
    setHoveredAskIndex(index);
    setHoveredBidIndex(null);
    const rowEl = askRowRefs.current[index];
    if (rowEl) {
      const rowRect = rowEl.getBoundingClientRect();
      // viewport coordinates so tooltip is fixed and won't be clipped
      const top = rowRect.top + rowRect.height / 2;
      const left = rowRect.left - TOOLTIP_WIDTH - 20; // adjust left position for new tooltip

      const rows = addTotals(asks, false).slice(-10).slice(index);
      if (rows.length) {
        const totalSize = rows.reduce((sum, row) => sum + row.size, 0);
        const totalUSDT = rows.reduce((sum, row) => sum + row.size * row.price, 0);
        const avgPrice = totalUSDT / totalSize;
        setTooltip({
          visible: true,
          top,
          left,
          content: { avgPrice, totalSize, totalUSDT },
          color: 'red',
        });
      } else {
        setTooltip(t => ({ ...t, visible: false }));
      }
    }
  };
  const handleAskMouseLeave = () => {
    setHoveredAskIndex(null);
    setTooltip(t => ({ ...t, visible: false }));
  };

  // Mouse event handlers for bids
  const handleBidMouseEnter = (index) => (e) => {
    setHoveredBidIndex(index);
    setHoveredAskIndex(null);
    const rowEl = bidRowRefs.current[index];
    if (rowEl) {
      const rowRect = rowEl.getBoundingClientRect();
      const top = rowRect.top + rowRect.height / 2;
      const left = rowRect.left - TOOLTIP_WIDTH - 20; // adjust left position for new tooltip

      const rows = addTotals(bids, true).slice(0, index + 1);
      if (rows.length) {
        const totalSize = rows.reduce((sum, row) => sum + row.size, 0);
        const totalUSDT = rows.reduce((sum, row) => sum + row.size * row.price, 0);
        const avgPrice = totalUSDT / totalSize;
        setTooltip({
          visible: true,
          top,
          left,
          content: { avgPrice, totalSize, totalUSDT },
          color: 'green',
        });
      } else {
        setTooltip(t => ({ ...t, visible: false }));
      }
    }
  };
  const handleBidMouseLeave = () => {
    setHoveredBidIndex(null);
    setTooltip(t => ({ ...t, visible: false }));
  };

  // For the new numbers dropdown
  const [selectedNumber, setSelectedNumber] = useState(1);
  const numberOptions = [
    { value: 1, label: "1" },
    { value: 100, label: "100" },
    { value: 1000, label: "1000" },
    { value: 10000, label: "10000" },
  ];

  // Helper to get the display currency for Size/Total columns
  const displayCurrency = selectedCurrencyGlobal || quoteCurrency;

  // Helper to calculate size/total based on selected currency
  const getDisplayValues = (row) => {
    if (displayCurrency === quoteCurrency) {
      // Show cumulative total in quote (USDT)
      return {
        size: row.size * row.price, // size in USDT
        total: row.cumulativeQuote, // cumulative in USDT
      };
    } else {
      // Show cumulative total in base
      return {
        size: row.size, // size in base
        total: row.cumulativeBase, // cumulative in base
      };
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full overflow-x-hidden" style={{ position: 'relative' }}>
      {/* Currency selector row with number dropdown on the left and currency on the right */}
      <div className="w-full flex justify-end">
        {/* Number dropdown (left) 
        <MinimalDropDown
          options={numberOptions}
          selectedOption={selectedNumber}
          onOptionChange={setSelectedNumber}
        />
        */}
        {/* Currency dropdown (right) */}
        <MinimalDropDown
          options={[
            { value: quoteCurrency, label: quoteCurrency },
            { value: baseCurrency, label: baseCurrency },
          ]}
          selectedOption={selectedCurrencyGlobal || quoteCurrency}
          onOptionChange={setSelectedCurrencyGlobal}
        />
      </div>

      <div className="flex justify-between text-liquidlightergray pb-2 pt-[3px] px-[5px] text-body border-t-[1px] border-liquiddarkgray">
        <div className="text-left w-1/4">Price</div>
        <div className="text-right w-1/4">
          Size&nbsp;
          <span className="uppercase">({displayCurrency})</span>
        </div>
        <div className="text-right w-1/4">
          Total&nbsp;
          <span className="uppercase">({displayCurrency})</span>
        </div>
      </div>

      {/* Ask Section */}
      <ul
        className="flex flex-col w-full "
        onMouseLeave={handleAskMouseLeave}
      >
        {addTotals(asks, false).map((row, i, arr) => {
          // Highlight from bottom up to hovered index
          const highlight =
            hoveredAskIndex !== null && i >= hoveredAskIndex;
          const { size, total } = getDisplayValues(row);
          return (
            <div
              ref={el => askRowRefs.current[i] = el}
              key={`ask-wrap-${row.price}`}
              onMouseEnter={handleAskMouseEnter(i)}
              onMouseLeave={handleAskMouseLeave}
              style={{
                position: 'relative',
                background: highlight ? 'var(--color-backgroundlight)' : 'transparent',
              }}
            >
              <Row
                {...row}
                size={size}
                total={total}
                progress={row.progress}
                color="red"
                onSelect={handleRowSelect}
                fontSizeClass="font-[400]"
                fontWeightClass="font-normal"
                textAlign="right"
                displayCurrency={displayCurrency}
              />
            </div>
          );
        })}
      </ul>

      {/* Spread Section */}
      <div className="text-body flex justify-center gap-[10px] sm:gap-[60px] bg-backgroundlight items-center py-[2px] my-[3px]">
        <div className="text-body">Spread</div>
        <span className="">
          {spreadValue !== null ? `${spreadValue}$` : '—'}
        </span>
        <span className="">
          {spreadPercentage !== null ? `${spreadPercentage.toFixed(4)}%` : '—'}
        </span>
      </div>

      {/* Bid Section */}
      <ul
        className="flex flex-col w-full "
        onMouseLeave={handleBidMouseLeave}
      >
        {addTotals(bids, true).map((row, i) => {
          // Highlight from top down to hovered index
          const highlight =
            hoveredBidIndex !== null && i <= hoveredBidIndex;
          const { size, total } = getDisplayValues(row);
          return (
            <div
              ref={el => bidRowRefs.current[i] = el}
              key={`bid-wrap-${row.price}`}
              onMouseEnter={handleBidMouseEnter(i)}
              onMouseLeave={handleBidMouseLeave}
              style={{
                position: 'relative',
                background: highlight ? 'var(--color-backgroundlight)' : 'transparent',
              }}
            >
              <Row
                {...row}
                size={size}
                total={total}
                progress={row.progress}
                color="green"
                onSelect={handleRowSelect}
                textAlign="right"
                fontSizeClass="text-body"
                fontWeightClass="font-[400]"
                displayCurrency={displayCurrency}
              />
            </div>
          );
        })}
      </ul>

      {/* Replace the existing tooltip with this custom SVG shape tooltip */}
      {tooltip.visible && tooltip.content && (
        <div
          style={{ 
            position: 'fixed',
            left: tooltip.left - 10, // Adjust left position to account for new shape
            top: tooltip.top,
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            zIndex: 10000,
          }}
          aria-hidden="true"
        >
          <div className="relative">
            {/* SVG container with both the shape and the border */}
            <svg
              width="160"
              height="70" 
              viewBox="0 0 160 70"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0"
            >
              {/* Background fill */}
              <path 
                d="M0 4C0 1.79086 1.79086 0 4 0H138C140.209 0 142 1.79086 142 4V25.5L160 35L142 44.5V66C142 68.2091 140.209 70 138 70H4C1.79086 70 0 68.2091 0 66V4Z" 
                fill="var(--color-backgroundlight)"
              />
              {/* Border stroke */}
              <path 
                d="M0.5 4C0.5 2.067 2.067 0.5 4 0.5H138C139.933 0.5 141.5 2.067 141.5 4V25.2678L159.019 34.5L141.5 43.7322V66C141.5 67.933 139.933 69.5 138 69.5H4C2.067 69.5 0.5 67.933 0.5 66V4Z" 
                stroke="var(--color-primary2darker)" 
                strokeWidth="1"
              />
            </svg>
            
            {/* Tooltip content */}
            <div className="relative px-4 py-2 text-body text-[var(--color-liquidwhite)]">
              <div className="flex justify-start">
                <span className="min-w-[54px]">Avg Price:</span>
                <span className="ml-1">{formatPrice(tooltip.content.avgPrice)}</span>
              </div>
              <div className="flex justify-start">
                <span className="min-w-[54px]">Sum Size:</span>
                <span className="ml-1">{tooltip.content.totalSize?.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
              </div>
              <div className="flex justify-start">
                <span className="min-w-[54px]">Sum USDT:</span>
                <span className="ml-1">{formatPrice(tooltip.content.totalUSDT)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        {/* WebSocket status LED with additional REST indicator */}
        <div className="flex items-center">
          {isFetchingRest && (
            <span 
              className="text-xs text-gray-400 mr-2"
              title="Fetching data from REST API"
            >
              REST
            </span>
          )}
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: wsConnected ? '#22c55e' : (isFetchingRest ? '#f59e0b' : '#6b7280'), // green, amber or gray
              marginRight: 6,
              border: '1.5px solid #222'
            }}
            title={wsConnected ? "Live WebSocket connection" : (isFetchingRest ? "Using REST API" : "Disconnected")}
          />
        </div>
      </div>

      {/* Optionally show error */}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};

export default OrderBook;
