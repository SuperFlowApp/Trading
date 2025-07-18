import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/Authentication";

// Example: Replace with your actual data fetching logic
const positions = [
  {
    symbol: "BTCUSDT",
    positionAmt: "1",
    entryPrice: "50000",
    markPrice: "50100",
    liquidationPrice: "45000",
    unrealizedPnl: "100",
    positionSide: "LONG",
    leverage: 10,
    // ...other fields
  },
  {
    symbol: "ETHUSDT",
    positionAmt: "1",
    entryPrice: "2000",
    markPrice: "2020",
    liquidationPrice: "2200",
    unrealizedPnl: "-50",
    positionSide: "SHORT",
    leverage: 5,
    // ...other fields
  }
];

function formatNumber(num, decimals = 2) {
  return Number(num).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

const pnlColor = (pnl) => pnl >= 0 ? 'text-primary2' : 'text-warningcolor';

const Positions = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError("");
    fetch("https://fastify-serverless-function-rimj.onrender.com/api/positions?limit=20", {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch positions");
        return res.json();
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return <div>Please log in to view positions.</div>;
  if (loading) return <div>Loading positions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="w-full">

      <div className="overflow-x-auto ">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-8 gap-2  text-xs font-semibold text-secondary1">
            <div>Pair</div>
            <div>Size</div>
            <div>Open Price</div>
            <div>Market Price</div>
            <div>Liquid. Price</div>
            <div>Unrealized P&amp;L</div>
            <div>TP/SL</div>
            <div>Actions</div>
          </div>
          {positions.map((pos, idx) => (
            <div
              key={pos.symbol + pos.positionSide}
              className={`rounded-md grid grid-cols-8 gap-2 items-center px-3 py-1 mt-2 text-sm ${
                idx % 2 ? 'bg-secondary1/10' : 'bg-secondary1/20'
              }`}
            >
              <div className="font-semibold">{pos.symbol} <span className="ml-1 text-xs text-gray-400">{pos.positionSide}</span></div>
              <div>{formatNumber(pos.positionAmt)}</div>
              <div>{formatNumber(pos.entryPrice)}</div>
              <div>{formatNumber(pos.markPrice)}</div>
              <div>{formatNumber(pos.liquidationPrice)}</div>
              <div className={pnlColor(Number(pos.unrealizedPnl))}>
                {formatNumber(pos.unrealizedPnl)}
              </div>
              <div>
                <button className="bg-backgrounddark  border border-transparent hover:border-secondary1 text-secondary1 hover:text-white px-2 py-1 rounded text-xs mr-1">Set TP</button>
                <button className="bg-backgrounddark  border border-transparent hover:border-secondary1 text-secondary1 hover:text-white px-2 py-1 rounded text-xs">Set SL</button>
              </div>
              <div className="flex gap-1">
                <button className=" border border-primary2 hover:border-secondary1 text-white px-2 py-1 rounded text-xs">Edit</button>
                <button className="bg-warningcolor  border border-transparent hover:border-secondary1 text-white   px-2 py-1 rounded text-xs">Close</button>
              </div>
            </div>
          ))}
          {positions.length === 0 && (
            <div className="text-center py-8 text-gray-400">No open positions.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Positions;