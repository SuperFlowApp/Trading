import React, { useEffect, useState } from "react";
import { useAuthKey } from "../../../contexts/AuthKeyContext";
import ModifyBalance from "./ModifyBalance";
import Table from "../../CommonUIs/table";
import { API_BASE_URL } from "../../../config/api";
import { formatPrice } from "../../../utils/priceFormater"; // Add this import

const Positions = () => {
  const { authKey } = useAuthKey();
  const [rawPositions, setRawPositions] = useState([]);
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [activePosition, setActivePosition] = useState(null);

  // Fetch open positions from server when authKey changes
  const fetchPositions = React.useCallback(() => {
    if (!authKey) {
      setRawPositions([]);
      return;
    }
    fetch(`${API_BASE_URL}/api/positions`, {
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

  useEffect(() => {
    fetchPositions(); // Initial fetch
    const interval = setInterval(fetchPositions, 10000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

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

  const handleCloseMarginModal = () => {
    setShowMarginModal(false);
    setActivePosition(null);
  };

  // Helper to safely parse numbers
  const num = v => Number(v) || 0;

  // Calculate removable balance for the active position
  const removableBalance = activePosition
    ? num(activePosition.isolatedMarginBalance)
      + num(activePosition.upnl)
      - num(activePosition.initialMargin)
      - num(activePosition.pendingInitialMargin || 0)
    : 0;

  const columns = [
    {
      key: "symbol",
      label: "Coin",
      render: v => v.replace(/USDT$/, ""), // Remove 'USDT' from end of symbol
    },
    {
      key: "positionSide",
      label: "Side",
      render: v => v, // Show the value directly from the API response
    },
    { key: "positionAmt", label: "Size", render: v => fmt(v, 4) },
    { key: "entryPrice", label: "Entry Price", render: v => fmt(v, 4) },
    { key: "markPrice", label: "Mark Price", render: v => fmt(v, 4) },
    { key: "notional", label: "Notional", render: v => fmt(v, 4) },
    { key: "leverage", label: "Leverage" },
    {
      key: "upnl",
      label: "Unrealized PNL",
      render: v => fmt(v, 4) + "%",
    },
    { key: "realizedPnl", label: "Realized PnL", render: v => fmt(v, 4) },
    {
      key: "isolatedMarginBalance",
      label: "Margin",
      render: (v, row) => {
        const positionType = row.isCross ? "Cross" : "Isolated";
        return (
          <div className="flex items-center justify-between pr-8">
            <div className="flex flex-col">
              <span>{formatPrice(v)} USDT</span>
              <span>{positionType}</span>
            </div>
            {positionType === "Isolated" && (
              <button
                className="ml-2 p-1 bg-none hover:bg-liquiddarkgray rounded-md"
                onClick={e => {
                  e.stopPropagation();
                  setActivePosition(row);
                  setShowMarginModal(true);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        );
      },
    },
    { key: "maintenanceMargin", label: "Maint. Margin", render: v => fmt(v, 4) },
    {
      key: "liquidationPrice",
      label: "Liquid. Price",
      render: v => v === null ? "-" : fmt(v, 4),
    },
    { key: "updateTime", label: "Last Updated", render: v => fmtTime(v) },
  ];

  return (
    <div className="w-full">
      <Table
        columns={columns}
        data={authKey ? rawPositions : []}
        rowKey={row => row.symbol + row.positionSide}
        emptyMessage={authKey ? "No positions." : "Please log in to view your positions."}
      />
      <ModifyBalance
        open={showMarginModal}
        onClose={handleCloseMarginModal}
        position={activePosition}
        margin={activePosition?.isolatedMarginBalance}
        removableBalance={removableBalance}
        onBalanceModified={fetchPositions} // <-- Pass callback
      />
    </div>
  );
};

export default Positions;