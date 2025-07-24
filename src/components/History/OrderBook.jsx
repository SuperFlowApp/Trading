import React, { useEffect, useRef, useState, memo } from 'react';
import useZustandStore from '../../Zustandstore/panelStore.js';

// Custom hook for localhost SSE order book
const useLocalhostOrderBook = (symbol = 'btcusdt') => {
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [wsFps, setWsFps] = useState(0);
  const eventSourceRef = useRef(null);
  const updatesRef = useRef(0);

  useEffect(() => {
    let active = true;
    let localBids = [];
    let localAsks = [];

    // FPS counter
    updatesRef.current = 0;
    let fpsInterval = setInterval(() => {
      setWsFps(updatesRef.current);
      updatesRef.current = 0;
    }, 1000);

    // Connect to SSE endpoint
    const eventSource = new EventSource('https://websocketserver-am3y.onrender.com/stream/orderbook');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      if (!active) return;

      try {
        const data = JSON.parse(event.data);

        // Check if this is orderbook data
        if (data.e === 'ORDERBOOK' && data.s === symbol.toUpperCase()) {
          // Convert bids and asks arrays to the expected format
          const newBids = data.b.map(([price, size]) => ({
            price: parseFloat(price),
            size: parseFloat(size)
          }));
          const newAsks = data.a.map(([price, size]) => ({
            price: parseFloat(price),
            size: parseFloat(size)
          }));

          // Sort and limit the data
          localBids = newBids
            .sort((a, b) => b.price - a.price) // bids descending
            .slice(0, 50);
          localAsks = newAsks
            .sort((a, b) => a.price - b.price) // asks ascending  
            .slice(0, 50);

          setBids(localBids);
          setAsks(localAsks);
          updatesRef.current += 1; // Count update
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('SSE connection closed');
      }
    };

    eventSource.onopen = () => {
      console.log('SSE connection opened');
    };

    return () => {
      active = false;
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(fpsInterval);
    };
  }, [symbol]);

  return { bids, asks, wsFps };
};

// Memoized Row for per-row update
const Row = memo(({ size, price, total, progress, color, onSelect, isNew, selectedCurrency, fontStyle, textAlign }) => {
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

  const textColor = color === 'green' ? 'text-primary2' : 'text-primary1';
  const alignClass = textAlign === "right" ? "text-right" : "text-left";
  const rowClasses = `relative flex justify-between w-full py-[2px] px-2 text-xs transition-colors cursor-pointer ${isBlinking
    ? color === 'red'
      ? 'bg-primary1/40'
      : 'bg-primary2/40'
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
      <div className={rowClasses} style={fontStyle}>
        {/* Price */}
        <div className={`font-medium text-[14px] w-1/4 ${textColor} text-left`}>
          {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        {/* Size */}
        <div className={`text-[15px] w-1/4 ${textAlign === "right" ? "text-right" : "text-left"}`}>
          {selectedCurrency === 'BTC'
            ? size.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })
            : (price * size).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
        </div>
        {/* Total */}
        <div className={`text-[15px] w-1/4 ${textAlign === "right" ? "text-right" : "text-left"}`}>
          {selectedCurrency === 'BTC'
            ? total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })
            : (price * total).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
        </div>
      </div>
    </li>
  );
});

const OrderBook = () => {
  // Remove useParams and all routing logic
  const selectedPairBase = useZustandStore(s => s.selectedPair);
  const selectedPair = selectedPairBase ? `${selectedPairBase}usdt` : 'btcusdt';

  const { asks, bids, wsFps } = useLocalhostOrderBook(selectedPair);

  const [spreadValue, setSpreadValue] = useState(null);
  const [spreadPercentage, setSpreadPercentage] = useState(null);
  const setPriceMidpoint = useZustandStore(s => s.setPriceMidpoint);

  // Track previous prices for asks and bids
  const prevAskPrices = useRef(new Set());
  const prevBidPrices = useRef(new Set());

  // Helper to mark new prices and calculate cumulative totals
  const addTotals = (rows, reverse = false, prevPricesSet = new Set()) => {
    let cumulative = 0;
    // Sort rows: bids descending, asks ascending
    const sortedRows = reverse ? [...rows].sort((a, b) => b.price - a.price) : [...rows].sort((a, b) => a.price - b.price);
    // Only show top 10
    const limitedRows = sortedRows.slice(0, 10);
    // Find max size for progress bar
    const maxSize = Math.max(...limitedRows.map((r) => r.size), 1);

    return limitedRows.map((r) => {
      cumulative += r.size;
      const progress = (r.size / maxSize) * 100;
      const isNew = !prevPricesSet.has(r.price);
      return {
        ...r,
        total: cumulative,
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
      setPriceMidpoint(newPriceMidpoint); // <-- Write to Zustand

    } else {
      setSpreadValue(null);
      setSpreadPercentage(null);
      setPriceMidpoint(null); // <-- Reset in Zustand
    }
  }, [bids, asks, setPriceMidpoint]);

  const setSelectedPrice = useZustandStore(s => s.setSelectedPrice);

  const handleRowSelect = (price) => {
    setSelectedPrice(price); // <-- Write to Zustand
  };

  const selectedCurrency = useZustandStore(s => s.selectedCurrency); // <-- Zustand global state

  return (
    <div className="flex flex-col h-full w-full text-xs overflow-x-hidden">
      <div className="font-normal flex justify-between text-liquidwhite px-2 pb-3 font-semibold text-xs">
        <div className="text-left w-1/4">Price</div>
        <div className="text-right w-1/4">Size ({selectedCurrency})</div>
        <div className="text-right w-1/4">Total ({selectedCurrency})</div>
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
            selectedCurrency={selectedCurrency}
            fontStyle={{ fontWeight: 'normal', fontSize: '12px' }}
            textAlign="right"
          />
        ))}
      </ul>

      {/* Spread Section */}
      <div className="font-bold text-[18px] flex justify-between border border-liquidwhite/50 rounded-lg items-center py-1 px-2 mt-2 mb-3 text-sm font-semibold">
        <div className="text-md">Spread</div>
        <span className="">{spreadValue !== null ? spreadValue.toFixed(5) : '—'}</span>
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
            selectedCurrency={selectedCurrency}
            fontStyle={{ fontWeight: 'normal', fontSize: '12px' }}
            textAlign="right"
          />
        ))}
      </ul>

      <div className="flex justify-between items-center text-sm font-semibold">
        <div className=" text-lg"></div>
        <div className="text-white text-[10px]">Updates/sec: {wsFps}</div>
      </div>
    </div>
  );
};

export default OrderBook;
