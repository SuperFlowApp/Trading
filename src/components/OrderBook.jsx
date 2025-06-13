import React, { useEffect, useRef, useState } from 'react';

const useGroupedOrderBook = (symbol = 'BTCUSDT', limit = 10, groupSize = 1) => {
  const [asks, setAsks] = useState([]);
  const [bids, setBids] = useState([]);
  const book = useRef({ asks: {}, bids: {} });

  const bucketPrice = (price) => Math.floor(price / groupSize) * groupSize;

  const groupSide = (sideData) => {
    const grouped = {};
    sideData.forEach(({ price, size }) => {
      const bucket = bucketPrice(price);
      grouped[bucket] = (grouped[bucket] || 0) + size;
    });
    return Object.entries(grouped).map(([price, size]) => ({ price: +price, size }));
  };

  useEffect(() => {
    const fetchOrderbook = async () => {
      try {
        const res = await fetch(`https://fastify-serverless-function-rimj.onrender.com/api/orderbooks?symbol=${symbol}&limit=${limit}`);
        const data = await res.json();

        const parsedBids = data.bids.map((entry) => ({
          price: parseFloat(entry[0]),
          size: parseFloat(entry[1]),
        }));
        const parsedAsks = data.asks.map((entry) => ({
          price: parseFloat(entry[0]),
          size: parseFloat(entry[1]),
        }));

        book.current.bids = Object.fromEntries(parsedBids.map(({ price, size }) => [price, size]));
        book.current.asks = Object.fromEntries(parsedAsks.map(({ price, size }) => [price, size]));

        setBids(groupSide(parsedBids));
        setAsks(groupSide(parsedAsks));
      } catch (err) {
        console.error('Failed to fetch orderbook:', err);
      }
    };

    fetchOrderbook();
    const interval = setInterval(fetchOrderbook, 1000);
    return () => clearInterval(interval);
  }, [symbol, limit, groupSize]);

  return { asks, bids };
};


const Row = ({ size, price, total, progress, color }) => {
  const [isFadingOut, setIsFadingOut] = useState(true); // Start with fade-out (transparent background)
  const preData = useRef(size);

  useEffect(() => {
    // Check if the size has changed
    if (size !== preData.current) {
      setIsFadingOut(false); // Reset fade-out to trigger immediate background
      const fadeOutTimeout = setTimeout(() => setIsFadingOut(true), 100); // Start fade-out after 100ms
      preData.current = size; // Update the previous size
      return () => clearTimeout(fadeOutTimeout);
    }
  }, [size]);

  const textColor = color === 'green' ? 'text-[#2D9DA8]' : 'text-[#F5CB9D]';
  const rowClasses = `relative flex justify-between items-center w-full py-[2px] px-2 text-xs font-medium transition-colors ${isFadingOut
      ? 'bg-transparent duration-500' // Smooth fade-out
      : color === 'red'
        ? 'bg-[#F5CB9D]/70 duration-0' // Immediate fade-in for asks
        : 'bg-[#2D9DA8]/70 duration-0' // Immediate fade-in for bids
    }`;

  return (
    <li className="relative w-full mb-1">
      {/* Progress Bar Background */}
      <div
        className="absolute top-0 left-0 h-full"
        style={{
          width: `${progress}%`,
          background: color === 'red' ? '#F5CB9D' : '#2D9DA8',
          opacity: 0.3,
        }}
      />
      {/* Row Content */}
      <div className={rowClasses}>
        {/* Price Section */}
        <div className={`font-bold text-[15px] text-left w-1/3 ${textColor}`}>
          {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        {/* Size Section */}
        <div className="text-[15px] text-left w-1/3">
          {size.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
        </div>
        {/* Total Section */}
        <div className="text-[15px] text-left w-1/3">
          {total.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
        </div>
      </div>
    </li>
  );
};

const OrderBook = ({ selectedPair }) => {
  const [limit, setLimit] = useState(10);
  const [groupSize] = useState(1);
  const { asks, bids } = useGroupedOrderBook(selectedPair, limit, groupSize);

  const addTotals = (rows, reverse = false) => {
    let total = 0;
    let maxSize = Math.max(...rows.map((r) => r.size));

    // Reverse the rows if the reverse flag is true
    const sortedRows = reverse ? [...rows].sort((a, b) => b.price - a.price) : rows;

    return sortedRows.map((r) => {
      total += r.size;
      const progress = (r.size / maxSize) * 100;
      return { ...r, total, progress };
    });
  };

  // Calculate Market Midpoint
  const calculateMarketMidpoint = () => {
    if (bids.length === 0 || asks.length === 0) return null;
    const highestBid = bids[0].price; // Highest bid price
    const lowestAsk = asks[0].price; // Lowest ask price
    return (highestBid + lowestAsk) / 2; // Average of the two
  };

  // Calculate Spread
  const calculateSpread = () => {
    if (bids.length === 0 || asks.length === 0) return { value: null, percentage: null };
    const highestBid = bids[0].price; // Highest bid price
    const lowestAsk = asks[0].price; // Lowest ask price
    const spreadValue = lowestAsk - highestBid; // Absolute spread
    const midpoint = (highestBid + lowestAsk) / 2; // Midpoint for percentage calculation
    const spreadPercentage = (spreadValue / midpoint) * 100; // Spread as a percentage
    return { value: spreadValue, percentage: spreadPercentage };
  };

  const marketMidpoint = calculateMarketMidpoint();
  const { value: spreadValue, percentage: spreadPercentage } = calculateSpread();

  return (
    <div className="flex flex-col h-full w-full text-xs overflow-x-hidden">
      <div className="flex justify-between items-center py-2 px-2 text-sm font-semibold">
        <div className="text-[#2D9DA8] text-lg">Order Book</div>
        <select
          value={limit}
          onChange={(e) => setLimit(+e.target.value)}
          className="bg-[#1E4D4E] text-white border border-[#2D9DA8] px-2 py-1 rounded text-xs"
        >
          {[10, 20, 50, 100, 500, 1000].map((l) => (
            <option key={l} value={l}> {l} </option>
          ))}
        </select>
      </div>

      <div className="font-normal text-[15px] flex justify-between text-[#C9C9C9] px-2 py-1 font-semibold text-xs">
        <div className="text-left w-1/3">Price (USD)</div>
        <div className="text-left w-1/3">Size (BTC)</div>
        <div className="text-left w-1/3">Total (BTC)</div>
      </div>

      {/* Ask Section */}
      <ul className="flex flex-col w-full">
        {addTotals(asks, true).map((row, i) => (
          <Row {...row} progress={row.progress} color="red" key={`ask-${i}`} />
        ))}
      </ul>

      {/* Spread Section */}
      <div className="font-bold text-[18px] flex justify-between border border-[#2D9DA8]/50 rounded-lg items-center py-1 px-2 my-2 text-sm font-semibold">
        <div className="text-[#2D9DA8] text-md">Spread</div>
        <span className="text-[#fff]">
          {spreadValue !== null ? spreadValue.toFixed(4) : '—'}
        </span>
        <span className="text-[#C9C9C9] text-xs">
          {spreadPercentage !== null ? `${spreadPercentage.toFixed(2)}%` : '—'}
        </span>
      </div>

      {/* Bid Section */}
      <ul className="flex flex-col w-full">
        {addTotals(bids, true).map((row, i) => (
          <Row {...row} progress={row.progress} color="green" key={`bid-${i}`} />
        ))}
      </ul>
    </div>
  );
};

export default OrderBook;
