import React, { useEffect, useRef, useState, memo } from 'react';



// Utility to merge order book updates into local state
const mergeOrderBook = (prev, updates, isBid) => {
  const map = new Map(prev.map(({ price, size }) => [price, size]));
  updates.forEach(([price, size]) => {
    price = parseFloat(price);
    size = parseFloat(size);
    if (size === 0) {
      map.delete(price);
    } else {
      map.set(price, size);
    }
  });
  // Sort: bids desc, asks asc
  const sorted = Array.from(map.entries())
    .map(([price, size]) => ({ price, size }))
    .sort((a, b) => (isBid ? b.price - a.price : a.price - b.price));
  return sorted.slice(0, 50); // keep top 50 for performance
};

// Custom hook for Binance order book
const useBinanceOrderBook = (symbol = 'btcusdt') => {
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    let active = true;
    let snapshotDone = false;
    let localBids = [];
    let localAsks = [];
    let lastUpdate = Date.now();

    // Step 1: Get snapshot
    fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        localBids = data.bids.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
        localAsks = data.asks.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
        setBids(localBids.slice(0, 50));
        setAsks(localAsks.slice(0, 50));
        snapshotDone = true;
      });

    // Step 2: Connect WebSocket
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@depth@100ms`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      if (!snapshotDone) return;
      const data = JSON.parse(event.data);
      localBids = mergeOrderBook(localBids, data.b, true);
      localAsks = mergeOrderBook(localAsks, data.a, false);

      // Throttle UI updates to every 100ms
      const now = Date.now();
      if (now - lastUpdate > 100) {
        setBids(localBids.slice(0, 50));
        setAsks(localAsks.slice(0, 50));
        lastUpdate = now;
      }
    };

    ws.onerror = () => ws.close();

    return () => {
      active = false;
      ws.close();
    };
  }, [symbol]);

  return { bids, asks };
};

// Memoized Row for per-row update
const Row = memo(({ size, price, total, progress, color, onSelect, isNew }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    if (isNew) {
      setIsBlinking(true);
      const timeout = setTimeout(() => setIsBlinking(false), 100);
      return () => clearTimeout(timeout);
    }
  }, [isNew]);

  const handleSelect = () => {
    setIsSelected(true);
    setTimeout(() => setIsSelected(false), 200);
    onSelect(price);
  };

  const textColor = color === 'green' ? 'text-primary2' : 'text-primary1';
  const rowClasses = `relative flex justify-between items-center w-full py-[2px] px-2 text-xs font-medium transition-colors cursor-pointer ${
    isBlinking
      ? color === 'red'
        ? 'bg-primary1/50'
        : 'bg-primary2/50'
      : 'bg-transparent'
  } ${isSelected ? 'border border-[#FFF]' : 'border border-transparent'}`;

  return (
    <li className="relative w-full mb-1" onClick={handleSelect}>
      <div
        className="absolute top-0 left-0 h-full"
        style={{
          width: `${progress}%`,
          background: color === 'red' ? '#F59DEF80' : '#00B7C980',
          opacity: 0.3,
        }}
      />
      <div className={rowClasses}>
        <div className={`font-bold text-[15px] text-left w-1/3 ${textColor}`}>
          {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[15px] text-left w-1/3">
          {size.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
        </div>
        <div className="text-[15px] text-left w-1/3">
          {total.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
        </div>
      </div>
    </li>
  );
});

const OrderBook = ({ selectedPair = 'btcusdt', onPriceMidpointChange, onRowSelect }) => {
  const { asks, bids } = useBinanceOrderBook(selectedPair.toLowerCase());

  const [spreadValue, setSpreadValue] = useState(null);
  const [spreadPercentage, setSpreadPercentage] = useState(null);
  const [priceMidpoint, setPriceMidpoint] = useState(null);

  // Track previous prices for asks and bids
  const prevAskPrices = useRef(new Set());
  const prevBidPrices = useRef(new Set());

  // Helper to mark new prices
  const addTotals = (rows, reverse = false, prevPricesSet = new Set()) => {
    let total = 0;
    let maxSize = Math.max(...rows.map((r) => r.size), 1);
    const sortedRows = reverse ? [...rows].sort((a, b) => b.price - a.price) : rows;
    const limitedRows = sortedRows.slice(0, 10);
    return limitedRows.map((r) => {
      total += r.size;
      const progress = (r.size / maxSize) * 100;
      const isNew = !prevPricesSet.has(r.price);
      return { ...r, total, progress, isNew };
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
    return { value: spreadValue, percentage: spreadPercentage };
  };

  const calculatePriceMidpoint = () => {
    if (bids.length === 0 || asks.length === 0) return null;
    const averageBids = bids.reduce((sum, bid) => sum + bid.price, 0) / bids.length;
    const averageAsks = asks.reduce((sum, ask) => sum + ask.price, 0) / asks.length;
    return (averageBids + averageAsks) / 2;
  };

  useEffect(() => {
    if (bids.length > 0 && asks.length > 0) {
      const { value, percentage } = calculateSpread();
      setSpreadValue(value);
      setSpreadPercentage(percentage);

      const newPriceMidpoint = calculatePriceMidpoint();
      setPriceMidpoint(newPriceMidpoint);

      if (onPriceMidpointChange) {
        onPriceMidpointChange(newPriceMidpoint);
      }
    } else {
      setSpreadValue(null);
      setSpreadPercentage(null);
      setPriceMidpoint(null);
    }
  }, [bids, asks, onPriceMidpointChange]);

  const handleRowSelect = (price) => {
    if (onRowSelect) {
      onRowSelect(price);
    }
  };

  return (
    <div className="flex flex-col h-full w-full text-xs overflow-x-hidden">
      <div className="flex justify-between items-center text-sm font-semibold">
        <div className=" text-lg"></div>
      </div>

      <div className="font-normal flex justify-between text-secondary1 px-2 pb-3 font-semibold text-xs">
        <div className="text-left w-1/3">Price (USD)</div>
        <div className="text-left w-1/3">Size (BTC)</div>
        <div className="text-left w-1/3">Total (BTC)</div>
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
          />
        ))}
      </ul>

      {/* Spread Section */}
      <div className="font-bold text-[18px] flex justify-between border border-secondary1/50 rounded-lg items-center py-1 px-2 mt-2 mb-3 text-sm font-semibold">
        <div className="text-md">Spread</div>
        <span className="">{spreadValue !== null ? `${spreadValue.toFixed(5)}$` : '—'}</span>
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
          />
        ))}
      </ul>
    </div>
  );
};

export default OrderBook;
