import React, { useEffect, useState } from "react";
import { useAuthKey } from "../../contexts/AuthKeyContext";
import Modal from "../CommonUIs/modal/modal";

const Positions = () => {
  const { authKey } = useAuthKey();
  const [rawPositions, setRawPositions] = useState([]);
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [activePosition, setActivePosition] = useState(null);
  const [marginMode, setMarginMode] = useState("");
  const [marginAmount, setMarginAmount] = useState("");

  // Fetch open positions from server when authKey changes
  useEffect(() => {
    if (!authKey) {
      setRawPositions([]);
      return;
    }
    const fetchPositions = () => {
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
    };

    fetchPositions(); // Initial fetch
    const interval = setInterval(fetchPositions, 2000);

    return () => clearInterval(interval); // Cleanup on unmount or authKey change
  }, [authKey]);

  // Set modal defaults when active position changes
  useEffect(() => {
    if (activePosition) {
      setMarginMode(activePosition.cross === true ? "Cross" : "Isolated");
      setMarginAmount(fmt(activePosition.isolatedMarginBalance, 4));
    }
  }, [activePosition]);

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

  const handleMarginUpdate = () => {
    // Implement your margin update logic here
    console.log(`Updating margin for ${activePosition.symbol}:`, {
      mode: marginMode,
      amount: marginAmount
    });
    
    // You would typically make an API call here
    // For now, we'll just close the modal
    setShowMarginModal(false);
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className=" w-full text-xs text-liquidwhite">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1">Pair</th>
              <th className="px-2 py-1">Side</th>
              <th className="px-2 py-1">Size</th>
              <th className="px-2 py-1">Entry Price</th>
              <th className="px-2 py-1">Mark Price</th>
              <th className="px-2 py-1">Notional</th>
              <th className="px-2 py-1">Leverage</th>
              <th className="px-2 py-1">Unrealized PNL</th>
              <th className="px-2 py-1">Realized PnL</th>
              <th className="px-2 py-1">Margin</th>
              <th className="px-2 py-1">Maint. Margin</th>
              <th className="px-2 py-1">Liquid. Price</th>
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
                    <td
                      className={`px-2 py-1 ${Number(pos.upnl) === 0
                          ? 'text-gray-400'
                          : Number(pos.upnl) > 0
                            ? 'text-green'
                            : 'text-red'
                        }`}
                    >
                      {fmt(pos.upnl, 4) + "%"}
                    </td>
                    <td className="px-2 py-1">{fmt(pos.realizedPnl, 4)}</td>
                    <td className="pr-2 py-1">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span>{fmt(pos.isolatedMarginBalance, 4)}</span>
                          <span className="text-body text-gray-400">
                            {pos.marginMode || (pos.cross === true ? "Cross" : pos.cross === false ? "Isolated" : "-")}
                          </span>
                        </div>
                        <button 
                          className="mr-2 p-1 bg-primary2darker rounded-md  text-body"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePosition(pos);
                            setShowMarginModal(true);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-1">{fmt(pos.maintenanceMargin, 4)}</td>
                    <td className="px-2 py-1">{pos.liquidationPrice === null ? "-" : fmt(pos.liquidationPrice, 4)}</td>
                    <td className="px-2 py-1">{fmtTime(pos.updateTime)}</td>
                    <td className="px-2 py-1">
                      {/* Remove the button group from here */}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="text-center py-8 text-gray-400">
                    No positions.
                  </td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan={14} className="text-center py-8 text-gray-400">
                  Please log in to view your positions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Margin Modal */}
      <Modal 
        open={showMarginModal}
        onClose={() => setShowMarginModal(false)}
        width={320}
      >
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">
            Adjust Margin {activePosition?.symbol}
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Margin Mode</label>
            <div className="flex space-x-2">
              <button 
                className={`px-4 py-2 rounded ${marginMode === 'Cross' ? 'bg-primary2dark' : 'bg-backgrounddark'}`}
                onClick={() => setMarginMode('Cross')}
              >
                Cross
              </button>
              <button 
                className={`px-4 py-2 rounded ${marginMode === 'Isolated' ? 'bg-primary2dark' : 'bg-backgrounddark'}`}
                onClick={() => setMarginMode('Isolated')}
              >
                Isolated
              </button>
            </div>
          </div>
          
          {marginMode === 'Isolated' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Margin Amount</label>
              <input
                type="number"
                value={marginAmount}
                onChange={e => setMarginAmount(e.target.value)}
                className="w-full p-2 bg-backgrounddark border border-primary2darker rounded text-white"
                placeholder="Enter margin amount"
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-2 mt-6">
            <button 
              className="px-4 py-2 bg-backgrounddark rounded"
              onClick={() => setShowMarginModal(false)}
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-primary2dark rounded"
              onClick={handleMarginUpdate}
            >
              Update Margin
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Positions;