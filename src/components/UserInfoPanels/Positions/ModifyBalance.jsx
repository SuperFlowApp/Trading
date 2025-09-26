import React, { useEffect, useState } from "react";
import { useAuthKey } from "../../../contexts/AuthKeyContext";
import ModifyBalance from "./ModifyBalance";
import Table from "../../CommonUIs/table";
import { API_BASE_URL } from "../../../config/api";
import { formatPrice } from "../../../utils/priceFormater";

const Positions = () => {
  const { authKey } = useAuthKey();
  const [rawPositions, setRawPositions] = useState([]);
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [activePosition, setActivePosition] = useState(null);

  // Fetch positions
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
      .catch(() => setRawPositions([]));
  }, [authKey]);

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 10000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  // helpers
  const fmt = (v, digits = 4) => {
    if (v === null || v === undefined) return "-";
    if (typeof v === "string" && v.match(/^0E-/)) return "0";
    const n = Number(v);
    return isNaN(n) ? v : n.toFixed(digits);
  };
  const num = (v) => (v === null || v === undefined ? 0 : Number(v) || 0);

  // ROE% = upnl / initialMargin
  const calcROE = (upnl, initialMargin) => {
    const im = num(initialMargin);
    if (im === 0) return "0.0000%";
    return ((num(upnl) / im) * 100).toFixed(4) + "%";
  };

  // Notional fallback if API gives null/0
  const calcNotional = (row) => {
    const provided = num(row.notional);
    if (provided > 0) return provided;
    // fallback: |size| * mark
    return Math.abs(num(row.positionAmt) * num(row.markPrice));
  };

  const handleCloseMarginModal = () => {
    setShowMarginModal(false);
    setActivePosition(null);
  };

  const columns = [
    {
      key: "symbol",
      label: "Coin",
      render: (v) => v.replace(/USDT$/i, ""),
    },
    {
      key: "positionSide",
      label: "Side",
      render: (v) => v || "BOTH",
    },
    { key: "positionAmt", label: "Size", render: (v) => fmt(v, 4) },
    { key: "entryPrice", label: "Entry Price", render: (v) => fmt(v, 4) },
    { key: "markPrice", label: "Mark Price", render: (v) => fmt(v, 4) },
    {
      key: "notional",
      label: "Notional",
      render: (_v, row) => fmt(calcNotional(row), 4),
    },
    { key: "leverage", label: "Leverage", render: (v) => (v ? String(v) : "-") },
    {
      key: "upnl",
      label: "Unrealized PNL",
      render: (_v, row) => {
        const upnl = num(row.upnl);
        const roeValue = row.initialMargin ? (upnl / num(row.initialMargin)) * 100 : 0;
        const roeTxt = calcROE(upnl, row.initialMargin);
        const cls =
          roeValue > 0
            ? "text-liquidGreen"
            : roeValue < 0
            ? "text-liquidRed"
            : "text-liquidlightergray";
        return (
          <span>
            <span className={cls}>{formatPrice(upnl)} USDT</span>
            <br />
            <span className={`text-xs ${cls}`}>{roeTxt}</span>
          </span>
        );
      },
    },
    {
      key: "realizedPnl",
      label: "Realized PnL",
      render: (_v, row) => {
        const r = num(row.realizedPnl);
        // For color parity with UPNL, we optionally use IM for %; if IM=0, show 0%.
        const roeValue = row.initialMargin ? (r / num(row.initialMargin)) * 100 : 0;
        const roeTxt = calcROE(r, row.initialMargin);
        const cls =
          roeValue > 0
            ? "text-liquidGreen"
            : roeValue < 0
            ? "text-liquidRed"
            : "text-liquidlightergray";
        return (
          <span>
            <span className={cls}>{formatPrice(r)} USDT</span>
            <br />
            <span className={`text-xs ${cls}`}>{roeTxt}</span>
          </span>
        );
      },
    },
    {
      key: "isolatedMarginBalance",
      label: "Margin",
      render: (v, row) => {
        const positionType = row.isCross ? "Cross" : "Isolated";
        return (
          <div className="flex items-center justify-between pr-8">
            <div className="flex flex-col">
              <span>{formatPrice(num(v))} USDT</span>
              <span className="text-liquidlightergray">{positionType}</span>
            </div>
            {positionType === "Isolated" && (
              <button
                className="ml-2 p-1 bg-none hover:bg-liquiddarkgray rounded-md"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePosition(row);
                  setShowMarginModal(true);
                }}
                title="Adjust isolated margin"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "liquidationPrice",
      label: "Liquid. Price",
      render: (v) => (v === null || v === undefined ? "-" : fmt(v, 4)),
    },
    // Removed: Maint. Margin, Last Updated (noisy / less useful in main view)
  ];

  // Removable balance for modal (unchanged)
  const removableBalance =
    activePosition
      ? num(activePosition.isolatedMarginBalance) +
        num(activePosition.upnl) -
        num(activePosition.initialMargin) -
        num(activePosition.pendingInitialMargin || 0)
      : 0;

  return (
    <div className="w-full">
      <Table
        columns={columns}
        data={authKey ? rawPositions : []} // Do NOT filter out empty rows
        rowKey={(row) => row.symbol + row.positionSide}
        emptyMessage={authKey ? "No positions." : "Please log in to view your positions."}
      />
      <ModifyBalance
        open={showMarginModal}
        onClose={handleCloseMarginModal}
        position={activePosition}
        margin={activePosition?.isolatedMarginBalance}
        removableBalance={removableBalance}
        onBalanceModified={fetchPositions}
      />
    </div>
  );
};

export default Positions;
