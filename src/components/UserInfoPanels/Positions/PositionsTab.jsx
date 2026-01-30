import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import ModifyBalance from "./ModifyBalance";
import Table from "../../CommonUIs/table";
import { fetchAccountInformation } from "../../../hooks/FetchAccountInfo.js";
import useAuthStore from "../../../store/authStore"; // Import Zustand store

const Positions = () => {
  const [rawPositions, setRawPositions] = useState([]);
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [activePosition, setActivePosition] = useState(null);
  const [availableUsdt, setAvailableUsdt] = useState(0);

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn); // Subscribe to Zustand store

  // Fetch positions
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
            <span className={roeColor}>{row.upnl} USDT</span>
            <br />
            <span className={`text-xs ${roeColor}`}>{roeRaw}</span>
          </span>
        );
      },
    },
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
            <span className={roeColor}>{row.realizedPnl} USDT</span>
            <br />
            <span className={`text-xs ${roeColor}`}>{roeRaw}</span>
          </span>
        );
      },
    },
  ];

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
          data={[]} // No data
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
