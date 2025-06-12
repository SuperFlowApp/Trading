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


const Row = ({ size, price, total, progress, color }) => {
  const [isGrowing, setIsGrowing] = useState(false);
  const preData = useRef(size);

  useEffect(() => {
    setIsGrowing(size > preData.current);
    preData.current = size;
  }, [size]);

  const textColor = color === 'green' ? 'text-[#2D9DA8]' : 'text-[#F5CB9D]';
  const rowClasses = ` relative flex justify-between items-center w-full py-[2px] px-2 text-xs font-medium ${isGrowing ? 'bg-white/5' : ''}`;

  return (
    <li className={rowClasses}>
      {/* Price Section */}
      <div className={`font-bold text-[15px] text-left w-1/3 ${textColor} `}>
        {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      {/* Size Section */}
      <div className="text-[15px] text-left w-1/3">
        {size.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
      </div>

      {/* Total Section with Progress Bar */}
      <div className="text-[15px] relative text-left w-1/3 p-[4px]" >
        <div className="relative z-10">
          {total.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
        </div>
        <div
          className="absolute top-0 left-0 h-full "
          style={{
            width: `${progress}%`,
            background: color === 'red' ? '#F5CB9D' : '#2D9DA8', // Different colors for Ask and Bid
            opacity: 0.3,
          }}
        />
      </div>
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

      <div className="font-normal text-[15px] flex justify-between text-[#C9C9C9] px-2 py-1 font-semibold text-xs">
        <div className="text-left w-1/3">Price (USD)</div>
        <div className="text-left w-1/3">Size (BTC)</div>
        <div className="text-left w-1/3">Total (BTC)</div>
      </div>

      {/* Ask Section */}
      <ul className="flex flex-col w-full">
        {addTotals(asks).map((row, i) => (
          <Row {...row} progress={row.progress} color="red" key={`ask-${i}`} />
        ))}
      </ul>

      {/* Market Midpoint Section */}
      <div className="font-bold text-[18px] flex justify-between border border-[#2D9DA8]/50 rounded-lg items-center py-1 px-2 my-2 text-sm font-semibold">
        <div className="text-[#2D9DA8] text-md">Market Midpoint</div>
        <div className="flex flex-col items-end">
          <span className="text-[#fff]">
            {marketMidpoint ? marketMidpoint.toFixed(2) : '—'}
          </span>
        </div>
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
