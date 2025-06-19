import React, { useEffect, useRef, useState } from 'react';

// Remove useGroupedOrderBook and replace with SSE logic
const useSSEOrderBook = () => {
  const [asks, setAsks] = useState([]);
  const [bids, setBids] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource('https://websocketserver-am3y.onrender.com/stream/orderbook');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // data.b = bids, data.a = asks (array of [price, quantity])
        setBids(
          data.b.map(([price, size]) => ({
            price: parseFloat(price),
            size: parseFloat(size),
          }))
        );
        setAsks(
          data.a.map(([price, size]) => ({
            price: parseFloat(price),
            size: parseFloat(size),
          }))
        );
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = () => {
      console.error('Error with SSE connection.');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return { asks, bids };
};

const Row = ({ size, price, total, progress, color, onSelect }) => {
  const [isBlinking, setIsBlinking] = useState(false); // State to control the fill blink effect
  const [isSelected, setIsSelected] = useState(false); // State to control the border on click
  const previousSize = useRef(size); // Track the previous size for comparison

  useEffect(() => {
    // Trigger fill blink when the size changes
    if (size !== previousSize.current) {
      setIsBlinking(true); // Start the fill blink
      const timeout = setTimeout(() => setIsBlinking(false), 200); // Reset after 200ms
      previousSize.current = size; // Update the previous size
      return () => clearTimeout(timeout); // Cleanup timeout
    }
  }, [size]);

  const handleSelect = () => {
    setIsSelected(true); // Add border on click
    setTimeout(() => setIsSelected(false), 200); // Remove border after 200ms
    onSelect(price); // Pass the selected price to the parent
  };

  const textColor = color === 'green' ? 'text-primary2' : 'text-primary1';
  const rowClasses = `relative flex justify-between items-center w-full py-[2px] px-2 text-xs font-medium transition-colors cursor-pointer ${
    isBlinking
      ? color === 'red'
        ? 'bg-primary1/70' // Fill blink for asks
        : 'bg-primary2/70' // Fill blink for bids
      : 'bg-transparent' // Default background
  } ${
    isSelected
      ? 'border border-[#FFF]' // 1px border on click
      : 'border border-transparent' // No border by default
  }`;

  return (
    <li
      className="relative w-full mb-1"
      onClick={handleSelect} // Trigger the select action
    >
      {/* Progress Bar Background */}
      <div
        className="absolute top-0 left-0 h-full"
        style={{
          width: `${progress}%`,
          background: color === 'red' ? '#F59DEF80' : '#00B7C980',
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

const OrderBook = ({ selectedPair, onPriceMidpointChange, onRowSelect }) => {
  // Remove limit/groupSize, not needed for SSE
  const { asks, bids } = useSSEOrderBook();

  const [spreadValue, setSpreadValue] = useState(null);
  const [spreadPercentage, setSpreadPercentage] = useState(null);
  const [priceMidpoint, setPriceMidpoint] = useState(null);

  const addTotals = (rows, reverse = false) => {
    let total = 0;
    let maxSize = Math.max(...rows.map((r) => r.size), 1);

    const sortedRows = reverse ? [...rows].sort((a, b) => b.price - a.price) : rows;
    const limitedRows = sortedRows.slice(0, 10);

    return limitedRows.map((r) => {
      total += r.size;
      const progress = (r.size / maxSize) * 100;
      return { ...r, total, progress };
    });
  };

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
        {/* Limit selector removed */}
      </div>

      <div className="font-normal flex justify-between text-secondary1 px-2 pb-3 font-semibold text-xs">
        <div className="text-left w-1/3">Price (USD)</div>
        <div className="text-left w-1/3">Size (BTC)</div>
        <div className="text-left w-1/3">Total (BTC)</div>
      </div>

      {/* Ask Section */}
      <ul className="flex flex-col w-full">
        {addTotals(asks, true).map((row, i) => (
          <Row
            {...row}
            progress={row.progress}
            color="red"
            key={`ask-${i}`}
            onSelect={handleRowSelect}
          />
        ))}
      </ul>

      {/* Spread Section */}
      <div className="font-bold text-[18px] flex justify-between border border-secondary1/50 rounded-lg items-center py-1 px-2 mt-2 mb-3 text-sm font-semibold">
        <div className="text-md">Spread</div>
        <span className="">{spreadValue !== null ? spreadValue.toFixed(4) : '—'}</span>
        <span className="text-xs">
          {spreadPercentage !== null ? `${spreadPercentage.toFixed(2)}%` : '—'}
        </span>
      </div>

      {/* Bid Section */}
      <ul className="flex flex-col w-full">
        {addTotals(bids, true).map((row, i) => (
          <Row
            {...row}
            progress={row.progress}
            color="green"
            key={`bid-${i}`}
            onSelect={handleRowSelect}
          />
        ))}
      </ul>
    </div>
  );
};

export default OrderBook;
