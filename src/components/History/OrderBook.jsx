import React, { useEffect, useRef, useState, memo } from 'react';
import { useZustandStore } from '../../Zustandstore/useStore.js';
import { selectedPairStore } from '../../Zustandstore/userOrderStore.js'; // <-- import your user input store
import { formatPrice } from '../../utils/priceFormater.js';

// Custom hook for localhost SSE order book
const useUnifiedOrderBook = (symbol) => {
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Helper to format orderbook arrays
  const formatBook = (arr) =>
    arr.map(([price, size]) => ({
      price: parseFloat(price),
      size: parseFloat(size),
    }));

  // Initial REST fetch with polling
  useEffect(() => {
    let active = true;
    setError(null);

    // Polling interval (e.g., every 1500ms)
    const fetchOrderBook = () => {
      fetch(`https://fastify-serverless-function-rimj.onrender.com/api/orderbooks?symbol=${symbol.toUpperCase()}&limit=10`)
        .then(res => res.json())
        .then(data => {
          if (!active) return;
          if (data.bids && data.asks) {
            setBids(formatBook(data.bids));
            setAsks(formatBook(data.asks));
          }
        })
    };

    fetchOrderBook(); // Initial fetch
    const intervalId = setInterval(fetchOrderBook, 1500); // Poll every 1.5s

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [symbol]);

  // SSE live updates
  useEffect(() => {
    let active = true;
    setError(null);

    const eventSource = new EventSource(`https://websocketserver-am3y.onrender.com/stream/orderbook?symbol=${symbol.toUpperCase()}`);

    eventSource.onopen = () => {
      if (!active) return;
      setWsConnected(true);
    };

    eventSource.onmessage = (event) => {
      if (!active) return;
      try {
        const data = JSON.parse(event.data);
        if (data.e === 'ORDERBOOK' && data.s === symbol.toUpperCase()) {
          setBids(formatBook(data.b));
          setAsks(formatBook(data.a));
        }
      } catch { }
    };

    eventSource.onerror = () => {
      setWsConnected(false);
      fetch(`https://fastify-serverless-function-rimj.onrender.com/api/orderbooks?symbol=${symbol.toUpperCase()}&limit=10`)
        .then(res => res.json())
        .then(data => {
          if (!active) return;
          if (data.bids && data.asks) {
            setBids(formatBook(data.bids));
            setAsks(formatBook(data.asks));
          }
        });
      eventSource.close();
    };

    return () => {
      active = false;
      eventSource.close();
    };
  }, [symbol]);

  return { bids, asks, wsConnected, error };
};

// Memoized Row for per-row update
const Row = memo(({ size, price, total, progress, color, onSelect, isNew, fontSizeClass = "text-body", fontWeightClass = "font-medium", textAlign }) => {
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
    <li className="relative w-full mb-[3px]" onClick={handleSelect}>
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
          {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        {/* Size */}
        <div className={`${fontSizeClass} w-1/4 ${alignClass}`}>
          {size.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
        </div>
        {/* Total */}
        <div className={`${fontSizeClass} w-1/4 ${alignClass}`}>
          {total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
        </div>
      </div>
    </li>
  );
});

const OrderBook = () => {
  // Fetch selectedPair from user input store
  const selectedPair = selectedPairStore(s => s.selectedPair);
  // Compose symbol for API (e.g., BTCUSDT)
  const symbol = selectedPair ? `${selectedPair}USDT` : 'BTCUSDT';

  const { asks, bids, wsConnected, error } = useUnifiedOrderBook(symbol);

  const [spreadValue, setSpreadValue] = useState(null);
  const [spreadPercentage, setSpreadPercentage] = useState(null);
  const setPriceMidpoint = useZustandStore(s => s.setPriceMidpoint);

  // Track previous prices for asks and bids
  const prevAskPrices = useRef(new Set());
  const prevBidPrices = useRef(new Set());

  // Helper to mark new prices and calculate cumulative totals
  const addTotals = (rows, reverse = false, prevPricesSet = new Set()) => {
    // Always sort descending (cheapest last)
    const sortedRows = [...rows].sort((a, b) => b.price - a.price);

    let limitedRows;
    if (reverse) {
      // For bids: top 10 most expensive (already sorted descending)
      limitedRows = sortedRows.slice(0, 10);
    } else {
      // For asks: top 10 cheapest (last 10 in descending order)
      limitedRows = sortedRows.slice(-10);
    }
    // Find max size for progress bar
    const maxSize = Math.max(...limitedRows.map((r) => r.size), 1);

    return limitedRows.map((r) => {
      const progress = (r.size / maxSize) * 100;
      const isNew = !prevPricesSet.has(r.price);
      return {
        ...r,
        total: r.price * r.size,
        progress,
        isNew,
      };
    });
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
  const TOOLTIP_WIDTH = 140; // used to place the box fully outside

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
      const left = rowRect.left - TOOLTIP_WIDTH - 8;

      // compute stats immediately (don't rely on hoveredAskStats state which may not update synchronously)
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
      const left = rowRect.left - TOOLTIP_WIDTH - 8;

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

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full  overflow-x-hidden" style={{ position: 'relative' }}>
      <div className="flex justify-between text-liquidwhite pb-2 pt-[3px] text-body">
        <div className="text-left w-1/4">Price</div>
        <div className="text-right w-1/4">Size</div>
        <div className="text-right w-1/4">USDT Total</div>
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
          return (
            <div
              ref={el => askRowRefs.current[i] = el}
              key={`ask-wrap-${row.price}`}
              onMouseEnter={handleAskMouseEnter(i)}
              onMouseLeave={handleAskMouseLeave}
              style={{
                position: 'relative',
                background: highlight ? 'var(--color-backgroundlight)' : 'transparent',
                borderRadius: highlight && i === hoveredAskIndex ? '4px 4px 0 0' : undefined,
              }}
            >
              <Row
                {...row}
                progress={row.progress}
                color="red"
                onSelect={handleRowSelect}
                fontSizeClass="font-[400]"
                fontWeightClass="font-normal"
                textAlign="right"
              />

            </div>
          );
        })}
      </ul>

      {/* Spread Section */}
      <div className="text-body flex justify-center gap-[60px] bg-backgroundlight rounded-[4px] items-center py-[1px] my-1">
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
          return (
            <div
              ref={el => bidRowRefs.current[i] = el}
              key={`bid-wrap-${row.price}`}
              onMouseEnter={handleBidMouseEnter(i)}
              onMouseLeave={handleBidMouseLeave}
              style={{
                position: 'relative',
                background: highlight ? 'var(--color-backgroundlight)' : 'transparent',
                borderRadius: highlight && i === hoveredBidIndex ? '0 0 4px 4px' : undefined,
              }}
            >
              <Row
                {...row}
                progress={row.progress}
                color="green"
                onSelect={handleRowSelect}
                textAlign="right"
                fontSizeClass="text-body"
                fontWeightClass="font-[400]"
              />

            </div>
          );
        })}
      </ul>

      {/* Outside tooltip placed using fixed coords so it's outside the orderbook and won't be clipped */}
      {tooltip.visible && tooltip.content && (
        <div
          // keep left/top in style because they are dynamic viewport coords
          style={{ left: tooltip.left, top: tooltip.top }}
          className={`fixed text-body pointer-events-none w-[140px] -translate-y-1/2 rounded-lg p-1 shadow-md z-[10000] bg-[var(--color-liquiddarkgray)] text-[var(--color-liquidwhite)] }`}
          aria-hidden="true"
        >
          <div><span>Avg Price:</span>{" "}{tooltip.content.avgPrice?.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
          <div><span>Sum Size:</span>{" "}{tooltip.content.totalSize?.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
          <div><span>Sum USDT:</span>{" "}{tooltip.content.totalUSDT?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>

          {/* right-side triangle using SVG (inner polygon scaled 2x) */}
          <svg
            aria-hidden="true"
            className="absolute -right-[25px] top-1/2 -translate-y-1/2 w-12 h-16 pointer-events-none -z-1"
            viewBox="0 0 48 64"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            focusable="false"
          >
            {/* centered triangle -> tip at middle (30,32), base from (8,8) to (8,56) */}
            <polygon
              points="30,32 8,8 8,56"
              fill="var(--color-liquiddarkgray)"
            />
          </svg>
        </div>
      )}

      <div className="flex justify-end">
        {/* WebSocket status LED */}
        <span
          style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: wsConnected ? '#22c55e' : '#6b7280', // green or gray
            marginRight: 6,
            border: '1.5px solid #222'
          }}
          title={wsConnected ? "Live connection" : "Disconnected"}
        />
      </div>

      {/* Optionally show error */}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};

export default OrderBook;
