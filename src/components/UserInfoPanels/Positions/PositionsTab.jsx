import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import ModifyBalance from "./ModifyBalance";
import Table from "../../CommonUIs/table";
import { API_BASE_URL } from "../../../config/api";
import { formatPrice } from "../../../utils/priceFormater";
import { fetchAccountInformation } from "../../../hooks/FetchAccountInfo.js";

const Positions = () => {
  const [rawPositions, setRawPositions] = useState([]);
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [activePosition, setActivePosition] = useState(null);
  const [availableUsdt, setAvailableUsdt] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Listen for login state changes
  useEffect(() => {
    const handler = (e) => setIsLoggedIn(e.detail === true);
    window.addEventListener("userLoginStateChanged", handler);
    // Optionally, set initial state based on cookies (for first load)
    setIsLoggedIn(!!Cookies.get("authKey"));
    return () => window.removeEventListener("userLoginStateChanged", handler);
  }, []);

  // --- fetch ---
  const fetchPositions = React.useCallback(() => {
    const authKey = Cookies.get("authKey");
    if (!isLoggedIn || !authKey) {
      setRawPositions([]);
      return;
    }
    fetch(`https://fastify-serverless-function-ymut.onrender.com/api/positions`, {
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
  }, [isLoggedIn]);

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 10000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  // Fetch available USDT for trading
  useEffect(() => {
    const authKey = Cookies.get("authKey");
    if (!isLoggedIn || !authKey) {
      setAvailableUsdt(0);
      return;
    }
    fetchAccountInformation(authKey).then((res) => {
      setAvailableUsdt(Number(res.availableForOrder || 0));
    });
  }, [isLoggedIn]);

  // --- helpers ---
  const fmt = (v, digits = 4) => {
    if (v === null || v === undefined) return "-";
    if (typeof v === "string" && v.match(/^0E-/)) return "0";
    const n = Number(v);
    if (!isNaN(n)) return n.toFixed(digits);
    return v;
  };

  const num = (v) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  const calcROE = (upnl, initialMargin) => {
    const im = num(initialMargin);
    if (im <= 0) return "0.00%";
    return ((num(upnl) / im) * 100).toFixed(2) + "%";
  };

  // Simple health ratio for Isolated only:
  // health% ~= maintMargin / max(isoMarginBalance + upnl, 0.0000001)
  const calcIsolatedHealthPct = (row) => {
    if (!row || row.isCross) return null;
    const mm = num(row.maintenanceMargin);
    const balanceLike = num(row.isolatedMarginBalance) + num(row.upnl);
    if (balanceLike <= 0) return null;
    return ((mm / balanceLike) * 100).toFixed(1) + "%";
  };

  const columns = [
    {
      key: "symbol",
      label: "Coin",
      render: (v) => v.replace(/USDT$/, ""),
    },
    {
      key: "positionSide",
      label: "Side",
      render: (v) => v || "BOTH",
    },
    { key: "positionAmt", label: "Size", render: (v) => fmt(v, 4) },
    { key: "entryPrice", label: "Entry Price", render: (v) => fmt(v, 4) },
    { key: "markPrice", label: "Mark Price", render: (v) => fmt(v, 4) },

    // Notional with safe fallback if API sends 0/blank
    {
      key: "notional",
      label: "Notional",
      render: (v, row) => {
        const apiNotional = num(v);
        const fallback = Math.abs(num(row.positionAmt) * num(row.markPrice));
        const value = apiNotional > 0 ? apiNotional : fallback;
        return fmt(value, 4);
      },
    },

    { key: "leverage", label: "Leverage" },

    // UPNL as $ and % (ROE vs initialMargin)
    {
      key: "upnl",
      label: "Unrealized PNL",
      render: (v, row) => {
        const im = num(row.initialMargin);
        const roeValue = im === 0 ? 0 : (num(row.upnl) / im) * 100;
        const roeRaw = im === 0 ? "0.0000%" : roeValue.toFixed(4) + "%";
        let roeColor = "text-color_lighter_gray";
        if (!isNaN(roeValue)) {
          roeColor =
            roeValue > 0
              ? "text-liquidGreen"
              : roeValue < 0
                ? "text-liquidRed"
                : "text-color_lighter_gray";
        }
        return (
          <span>
            <span className={roeColor}>{formatPrice(row.upnl)} USDT</span>
            <br />
            <span className={`text-xs ${roeColor}`}>{roeRaw}</span>
          </span>
        );
      },
    },

    // Realized PnL stays (nice-to-have)
    {
      key: "realizedPnl",
      label: "Realized PnL",
      render: (v, row) => {
        const im = num(row.initialMargin);
        const roeValue = im === 0 ? 0 : (num(row.realizedPnl) / im) * 100;
        const roeRaw = im === 0 ? "0.0000%" : roeValue.toFixed(4) + "%";
        let roeColor = "text-color_lighter_gray";
        if (!isNaN(roeValue)) {
          roeColor =
            roeValue > 0
              ? "text-liquidGreen"
              : roeValue < 0
                ? "text-liquidRed"
                : "text-color_lighter_gray";
        }
        return (
          <span>
            <span className={roeColor}>{formatPrice(row.realizedPnl)} USDT</span>
            <br />
            <span className={`text-xs ${roeColor}`}>{roeRaw}</span>
          </span>
        );
      },
    },

    // Merge mode + margin + tiny health% (isolated only)
    {
      key: "isolatedMarginBalance",
      label: "Margin",
      render: (v, row) => {
        const positionType = row.isCross ? "Cross" : "Isolated";
        return (
          <div className="flex items-center pr-8">
            <div className="flex flex-col">
              <span>{formatPrice(v)} USDT</span>
              <span className="text-color_lighter_gray">{positionType}</span>
            </div>
            {positionType === "Isolated" && (
              <button
                className="ml-2 p-1 bg-none hover:bg-liquiddarkgray rounded-md self-start"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePosition(row);
                  setShowMarginModal(true);
                }}
                aria-label="Modify isolated margin"
                title="Modify isolated margin"
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


    // Keep Liq. Price column; show "-" if not provided
    {
      key: "liquidationPrice",
      label: "Liquid. Price",
      render: (v) => (v === null || v === undefined ? "-" : fmt(v, 4)),
    },
  ];

  // Calculate removable balance for the active position
  const removableBalance = activePosition
    ? num(activePosition.isolatedMarginBalance) +
      num(activePosition.upnl) -
      num(activePosition.initialMargin) -
      num(activePosition.pendingInitialMargin || 0)
    : 0;

  const handleCloseMarginModal = () => {
    setShowMarginModal(false);
    setActivePosition(null);
  };

  return (
    <div className="w-full">
      {/* Only show table header if logged in */}
      {isLoggedIn && (
        <Table
          columns={columns}
          data={rawPositions}
          rowKey={(row) => row.symbol + row.positionSide}
          emptyMessage="No positions."
        />
      )}
      {!isLoggedIn && (
        <Table
          columns={[]} // Hide columns/header
          data={[]}    // No data
          emptyMessage="Please log in to view your positions."
        />
      )}
      <ModifyBalance
        open={showMarginModal}
        onClose={handleCloseMarginModal}
        position={activePosition}
        margin={activePosition?.isolatedMarginBalance}
        removableBalance={removableBalance}
        availableUsdt={availableUsdt}
        onBalanceModified={fetchPositions}
      />
    </div>
  );
};

export default Positions;
