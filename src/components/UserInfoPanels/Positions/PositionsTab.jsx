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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ===== Fetch =====
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

  // ===== Helpers =====
  const num = (v) => Number(v) || 0;

  const fmt = (v, digits = 4) => {
    if (v === null || v === undefined) return "-";
    if (typeof v === "string" && v.match(/^0E-/)) return "0";
    const n = Number(v);
    if (!isNaN(n)) return n.toFixed(digits);
    return v;
  };

  const fmtTime = (ts) => {
    if (!ts) return "-";
    const d = new Date(Number(ts));
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString();
    return (
      <>
        {date}
        <br />
        {time}
      </>
    );
  };

  // ROE% vs Initial Margin
  const calcROE = (pnl, initialMargin) => {
    const im = num(initialMargin);
    if (im === 0) return "0.00%";
    return ((num(pnl) / im) * 100).toFixed(2) + "%";
  };

  // Liquidation price (isolated, linear perp):
  // M + (P - E) * q = MM  =>  P = E + (MM - M) / q
  const computeLiqPrice = (row) => {
    const q = num(row.positionAmt);
    if (!q) return null; // empty position
    if (row.isCross) return null; // cross uses account-level equity
    const E = num(row.entryPrice);
    const M = num(row.isolatedMarginBalance);
    const MM = num(row.maintenanceMargin);
    if (!isFinite(E) || (M === 0 && MM === 0)) return null;
    const liq = E + (MM - M) / q;
    if (!isFinite(liq) || liq <= 0) return null;
    return liq;
  };

  // Margin Health (isolated only): MM / (M + uPNL)
  const computeHealthPct = (row) => {
    if (row.isCross) return null;
    const equity = num(row.isolatedMarginBalance) + num(row.upnl);
    const MM = num(row.maintenanceMargin);
    if (equity <= 0) return 100;
    if (MM <= 0) return 0;
    const pct = (MM / equity) * 100;
    return Math.max(0, Math.min(999, pct));
  };

  const handleCloseMarginModal = () => {
    setShowMarginModal(false);
    setActivePosition(null);
  };

  // Removable margin for the active isolated position
  const removableBalance = activePosition
    ? num(activePosition.isolatedMarginBalance) +
      num(activePosition.upnl) -
      num(activePosition.initialMargin) -
      num(activePosition.pendingInitialMargin || 0)
    : 0;

  // ===== Columns =====
  const baseColumns = [
    {
      key: "symbol",
      label: "Coin",
      render: (v) => v.replace(/USDT$/, ""),
    },
    {
      key: "positionSide",
      label: "Side",
      render: (v) => v,
    },
    {
      key: "positionAmt",
      label: "Size",
      render: (v) => fmt(v, 4),
    },
    {
      key: "entryPrice",
      label: "Entry Price",
      render: (v) => fmt(v, 4),
    },
    {
      key: "markPrice",
      label: "Mark Price",
      render: (v) => fmt(v, 4),
    },
    {
      key: "notional",
      label: "Notional",
      render: (v, row) => {
        const fallback = Math.abs(num(row.positionAmt) * num(row.markPrice));
        return fmt(v || fallback, 4);
      },
    },
    { key: "leverage", label: "Leverage" },
    {
      key: "health",
      label: "Health",
      render: (_v, row) => {
        const pct = computeHealthPct(row);
        if (pct === null || !isFinite(pct)) return "-";
        let c = "text-liquidlightergray";
        if (pct >= 80) c = "text-liquidRed";
        else if (pct >= 40) c = "text-yellow-400";
        else c = "text-liquidGreen";
        return <span className={`text-xs ${c}`}>{pct.toFixed(1)}%</span>;
      },
    },
    {
      key: "upnl",
      label: "Unrealized PNL",
      render: (_v, row) => {
        const im = num(row.initialMargin);
        const roeValue = im === 0 ? 0 : (num(row.upnl) / im) * 100;
        const roeStr = im === 0 ? "0.0000%" : roeValue.toFixed(4) + "%";
        let color = "text-liquidlightergray";
        if (!isNaN(roeValue)) {
          color =
            roeValue > 0
              ? "text-liquidGreen"
              : roeValue < 0
              ? "text-liquidRed"
              : "text-liquidlightergray";
        }
        return (
          <span>
            <span className={color}>{formatPrice(row.upnl)} USDT</span>
            <br />
            <span className={`text-xs ${color}`}>{roeStr}</span>
          </span>
        );
      },
    },
    {
      key: "realizedPnl",
      label: "Realized PnL",
      render: (_v, row) => {
        const im = num(row.initialMargin);
        const roeValue = im === 0 ? 0 : (num(row.realizedPnl) / im) * 100;
        const roeStr = im === 0 ? "0.0000%" : roeValue.toFixed(4) + "%";
        let color = "text-liquidlightergray";
        if (!isNaN(roeValue)) {
          color =
            roeValue > 0
              ? "text-liquidGreen"
              : roeValue < 0
              ? "text-liquidRed"
              : "text-liquidlightergray";
        }
        return (
          <span>
            <span className={color}>{formatPrice(row.realizedPnl)} USDT</span>
            <br />
            <span className={`text-xs ${color}`}>{roeStr}</span>
          </span>
        );
      },
    },
    {
      key: "modeAndMargin",
      label: "Mode / Margin",
      render: (_v, row) => {
        const isIsolated = !row.isCross;
        return (
          <div className="flex items-center justify-between pr-8">
            <div className="flex flex-col">
              <span>
                {isIsolated
                  ? `Isolated (${formatPrice(row.isolatedMarginBalance)} USDT)`
                  : "Cross"}
              </span>
            </div>
            {isIsolated && (
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
      render: (v, row) => {
        const apiLiq = v === null ? null : num(v);
        const calcLiq =
          apiLiq || apiLiq === 0 ? apiLiq : computeLiqPrice(row);
        return calcLiq === null ? "-" : fmt(calcLiq, 4);
      },
    },
  ];

  const advancedColumns = [
    {
      key: "maintenanceMargin",
      label: "Maint. Margin",
      render: (v) => fmt(v, 4),
    },
    {
      key: "updateTime",
      label: "Last Updated",
      render: (v) => fmtTime(v),
    },
  ];

  const columns = showAdvanced
    ? [...baseColumns, ...advancedColumns]
    : baseColumns;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <button
          className="text-xs px-2 py-1 rounded bg-liquiddarkgray hover:bg-neutral-700"
          onClick={() => setShowAdvanced((s) => !s)}
        >
          {showAdvanced ? "Hide Advanced" : "Show Advanced"}
        </button>
      </div>

      <Table
        columns={columns}
        data={authKey ? rawPositions : []}
        rowKey={(row) => row.symbol + row.positionSide}
        emptyMessage={
          authKey ? "No positions." : "Please log in to view your positions."
        }
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
