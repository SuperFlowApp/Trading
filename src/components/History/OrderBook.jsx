import React, { useEffect, useRef, useState, memo } from 'react';
import { useZustandStore } from '../../Zustandstore/useStore.js';
import {selectedPairStore} from '../../Zustandstore/userOrderStore.js'; // <-- import your user input store
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
        .catch(() => setError('REST orderbook fetch failed'));
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

    const eventSource = new EventSource(`http://localhost:3002/stream/orderbook?symbol=${symbol.toUpperCase()}`);

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
      } catch {}
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
const Row = memo(({ size, price, total, progress, color, onSelect, isNew, fontStyle, textAlign }) => {
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
  const rowClasses = `relative flex justify-between w-full py-[2px] px-2 text-xs transition-colors cursor-pointer ${isBlinking
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
      <div className={rowClasses} style={fontStyle}>
        {/* Price */}
        <div className={`font-medium text-[14px] w-1/4 ${textColor} text-left`}>
          {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        {/* Size */}
        <div className={`text-[15px] w-1/4 ${alignClass}`}>
          {size.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
        </div>
        {/* Total */}
        <div className={`text-[15px] w-1/4 ${alignClass}`}>
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
    // For asks (sell), always sort ascending (cheapest first)
    // For bids (buy), always sort descending (highest first)
    const sortedRows = reverse
      ? [...rows].sort((a, b) => b.price - a.price) // bids: highest first
      : [...rows].sort((a, b) => a.price - b.price); // asks: cheapest first

    // Only show top 10
    const limitedRows = sortedRows.slice(0, 10);
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
    return (sumBids + sumAsks) / totalCount;
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

  return (
    <div className="flex flex-col h-full w-full text-xs overflow-x-hidden">
      <div className="flex justify-between text-liquidwhite px-2 pb-2 pt-[3px] text-xs">
        <div className="text-left w-1/4">Price</div>
        <div className="text-right w-1/4">Size</div>
        <div className="text-right w-1/4">Total</div>
      </div>

      {/* Ask Section */}
      <ul className="flex flex-col w-full">
        {addTotals(asks, false).map((row, i) => (
          <Row
            {...row}
            progress={row.progress}
            color="red"
            key={`ask-${row.price}`}
            onSelect={handleRowSelect}
            fontStyle={{ fontWeight: 'normal', fontSize: '12px' }}
            textAlign="right"
          />
        ))}
      </ul>

      {/* Spread Section */}
      <div className="font-bold text-[18px] flex justify-between border border-liquidwhite/50 rounded-lg items-center py-1 px-2 mt-2 mb-3 text-sm font-semibold">
        <div className="text-md">Spread</div>
        <span className="">{spreadValue !== null ? spreadValue : '—'}</span>
        <span className="text-xs">
          {spreadPercentage !== null ? `${spreadPercentage.toFixed(5)}%` : '—'}
        </span>
      </div>

      {/* Bid Section */}
      <ul className="flex flex-col w-full">
        {addTotals(bids, true).map((row, i) => (
          <Row
            {...row}
            progress={row.progress}
            color="green"
            key={`bid-${row.price}`}
            onSelect={handleRowSelect}
            fontStyle={{ fontWeight: 'normal', fontSize: '12px' }}
            textAlign="right"
          />
        ))}
      </ul>

      <div className="flex justify-end items-center text-sm font-semibold mt-2">
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
        <span className="text-xs text-white">{wsConnected ? "Live" : "Offline"}</span>
      </div>

      {/* Optionally show error */}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};

export default OrderBook;
