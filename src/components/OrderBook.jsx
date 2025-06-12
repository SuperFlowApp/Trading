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
    return Object.entries(grouped)
      .map(([price, size]) => ({ price: +price, size }))
      .sort((a, b) => b.price - a.price);
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

  return { asks: asks.reverse(), bids };
};

const ProgressBar = ({ progress }) => (
  <div className="absolute top-0 left-0 w-full h-full">
    <div className="h-full bg-[#2D9DA8] opacity-10" style={{ width: `${progress}%` }} />
  </div>
);

const Row = ({ size, price, total, progress, color }) => {
  const [isGrowing, setIsGrowing] = useState(false);
  const preData = useRef(size);

  useEffect(() => {
    setIsGrowing(size > preData.current);
    preData.current = size;
  }, [size]);

  const textColor = color === 'green' ? 'text-[#2D9DA8]' : 'text-[#F5CB9D]';
  const rowClasses = `relative flex justify-between items-center w-full py-1 px-2 text-xs font-medium ${isGrowing ? 'bg-white/5' : ''}`;

  return (
    <li className={rowClasses}>
      <div className={`text-left w-1/3 ${textColor}`}>{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div className="text-left w-1/3">{size.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
      <div className="text-left w-1/3">{total.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
      <ProgressBar progress={progress} />
    </li>
  );
};

const OrderBook = ({ selectedPair }) => {
  const [limit, setLimit] = useState(10);
  const [groupSize] = useState(1);
  const { asks, bids } = useGroupedOrderBook(selectedPair, limit, groupSize);

  const addTotals = (rows) => {
    let total = 0;
    let maxSize = Math.max(...rows.map((r) => r.size));
    return rows.map((r) => {
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

  const marketMidpoint = calculateMarketMidpoint();

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

      <div className="flex justify-between text-[#7DADB1] px-2 py-1 font-semibold text-xs">
        <div className="text-left w-1/3">Price (USD)</div>
        <div className="text-left w-1/3">Size (BTC)</div>
        <div className="text-left w-1/3">Total (BTC)</div>
      </div>

      <ul className="flex flex-col w-full">
        {addTotals(asks).map((row, i) => (
          <Row {...row} progress={row.progress} color="red" key={`ask-${i}`} />
        ))}
      </ul>

      {/* Market Midpoint Section */}
      <div className="flex justify-between items-center py-2 px-2 text-sm font-semibold">
        <div className="text-[#2D9DA8] text-md">Market Midpoint</div>
        <div className="flex flex-col items-end">
          <span className="text-[#7DADB1] text-xs font-medium">Combined View</span>
          <span className="text-sm font-medium">
            {marketMidpoint ? marketMidpoint.toFixed(2) : '—'}
          </span>
        </div>
      </div>

      <div className="flex justify-between text-[#7DADB1] px-2 py-1 font-semibold text-xs">
        <div className="text-left w-1/3">Price (USD)</div>
        <div className="text-left w-1/3">Size (BTC)</div>
        <div className="text-left w-1/3">Total (BTC)</div>
      </div>

      <ul className="flex flex-col w-full">
        {addTotals(bids).map((row, i) => (
          <Row {...row} progress={row.progress} color="green" key={`bid-${i}`} />
        ))}
      </ul>
    </div>
  );
};

export default OrderBook;
