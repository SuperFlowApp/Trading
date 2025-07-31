import React, { useEffect, useState } from "react";
import { useAuthKey } from "../../contexts/AuthKeyContext"; // <-- use context

const Positions = () => {
  const { authKey } = useAuthKey(); // <-- get authKey from context
  const [rawPositions, setRawPositions] = useState([]);

  // Fetch open positions from server when authKey changes
  useEffect(() => {
    if (!authKey) {
      setRawPositions([]);
      return;
    }
    fetch("https://fastify-serverless-function-rimj.onrender.com/api/positions", {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${authKey}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        setRawPositions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setRawPositions([]);
      });
  }, [authKey]);

  // Helper to format numbers and handle nulls
  const fmt = (v, digits = 4) => {
    if (v === null || v === undefined) return "-";
    if (typeof v === "string" && v.match(/^0E-/)) return "0";
    if (!isNaN(Number(v))) return Number(v).toFixed(digits);
    return v;
  };

  // Helper to format timestamp
  const fmtTime = (ts) => {
    if (!ts) return "-";
    const d = new Date(Number(ts));
    return d.toLocaleString();
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className=" w-full text-xs text-liquidwhite">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1">Time</th>
              <th className="px-2 py-1">Pair</th>
              <th className="px-2 py-1">Side</th>
              <th className="px-2 py-1">Size</th>
              <th className="px-2 py-1">Entry Price</th>
              <th className="px-2 py-1">Mark Price</th>
              <th className="px-2 py-1">Notional</th>
              <th className="px-2 py-1">Leverage</th>
              <th className="px-2 py-1">Unrealized PnL</th>
              <th className="px-2 py-1">Realized PnL</th>
              <th className="px-2 py-1">Margin Used</th>
              <th className="px-2 py-1">Maint. Margin</th>
              <th className="px-2 py-1">Liquid. Price</th>
              <th className="px-2 py-1">Margin Mode</th>
              <th className="px-2 py-1">Last Updated</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {authKey ? (
              rawPositions && rawPositions.length > 0 ? (
                rawPositions.map((pos, idx) => (
                  <tr
                    key={pos.symbol + pos.positionSide + idx}
                    className={idx % 2 ? "bg-liquidwhite/10" : "bg-liquidwhite/20"}
                  >
                    <td className="px-2 py-1">{fmtTime(pos.timestamp)}</td>
                    <td className="px-2 py-1 font-semibold">{pos.symbol}</td>
                    <td className="px-2 py-1">
                      {pos.positionSide === "BOTH"
                        ? Number(pos.positionAmt) >= 0
                          ? "LONG"
                          : "SHORT"
                        : pos.positionSide}
                    </td>
                    <td className="px-2 py-1">{fmt(pos.positionAmt, 4)}</td>
                    <td className="px-2 py-1">{fmt(pos.entryPrice, 4)}</td>
                    <td className="px-2 py-1">{fmt(pos.markPrice, 4)}</td>
                    <td className="px-2 py-1">{fmt(pos.notional, 4)}</td>
                    <td className="px-2 py-1">{pos.leverage}</td>
                    <td className={`px-2 py-1 ${Number(pos.upnl) >= 0 ? 'text-primary2' : 'text-warningcolor'}`}>
                      {fmt(pos.upnl, 4)}
                    </td>
                    <td className="px-2 py-1">{fmt(pos.realizedPnl, 4)}</td>
                    <td className="px-2 py-1">{fmt(pos.isolatedMarginBalance, 4)}</td>
                    <td className="px-2 py-1">{fmt(pos.maintenanceMargin, 4)}</td>
                    <td className="px-2 py-1">{pos.liquidationPrice === null ? "-" : fmt(pos.liquidationPrice, 4)}</td>
                    <td className="px-2 py-1">
                      {pos.marginMode || (pos.cross === true ? "Cross" : pos.cross === false ? "Isolated" : "-")}
                    </td>
                    <td className="px-2 py-1">{fmtTime(pos.updateTime)}</td>
                    <td className="px-2 py-1">
                      <div className="flex gap-1">
                        <button className="bg-backgrounddark border border-transparent hover:border-liquidwhite text-liquidwhite hover:text-white px-2 py-1 rounded text-xs mr-1">Set TP</button>
                        <button className="bg-backgrounddark border border-transparent hover:border-liquidwhite text-liquidwhite hover:text-white px-2 py-1 rounded text-xs">Set SL</button>
                        <button className="border border-primary2 hover:border-liquidwhite text-white px-2 py-1 rounded text-xs">Edit</button>
                        <button className="bg-warningcolor border border-transparent hover:border-liquidwhite text-white px-2 py-1 rounded text-xs">Close</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={16} className="text-center py-8 text-gray-400">
                    No positions.
                  </td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan={16} className="text-center py-8 text-gray-400">
                  Please log in to view your positions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Positions;