import React, { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import Table from "../../CommonUIs/table";
import Modal from "../../CommonUIs/modal/modal";
import useAuthStore from "../../../store/authStore";
import { API_BASE_URL } from "../../../config/api";

function formatDate(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleString();
}

function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// Custom Symbol cell with info icon and hover tooltip
const SymbolWithInfo = ({ symbol, id }) => (
  <div className="flex items-center gap-1 relative group">
    <span>{symbol}</span>
    <span
      className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-400 text-xs cursor-pointer bg-gray-700 text-white font-bold"
      tabIndex={0}
    >
      i
      {/* Tooltip always rendered, but only visible on hover/focus */}
      <div
        className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200
        absolute left-16 top-1/2 -translate-y-1/2 ml-2 z-10 bg-black text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap"
      >
        Trade ID: {id}
      </div>
    </span>
  </div>
);

const columns = [
  {
    key: "symbol",
    label: "Symbol",
    render: (v, row) => <SymbolWithInfo symbol={v} id={row.id} />,
  },
  { key: "side", label: "Side" },
  { key: "price", label: "Price" },
  { key: "quantity", label: "Qty" },
  { key: "notional", label: "Notional" },
  { key: "timestamp", label: "Time", render: v => formatDate(v) },
  // id is hidden from the table
];

const TradesHistory = () => {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const [trades, setTrades] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setTrades([]);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const fetchMyTrades = () => {
      fetch(`https://fastify-serverless-function-ymut.onrender.com/api/my-trades`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get("authKey")}`,
        },
        body: JSON.stringify({}),
      })
        .then(async res => {
          if (res.status === 401) {
            setTrades([]);
            return;
          }
          const data = await res.json();
          setTrades(Array.isArray(data.user_trades) ? data.user_trades : []);
        })
        .catch(err => {
          setTrades([]);
          console.error("My trades fetch error:", err);
        });
    };

    fetchMyTrades(); // Initial fetch
    intervalRef.current = setInterval(fetchMyTrades, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLoggedIn]);

  const isUserLoggedIn = isLoggedIn;

  return (
    <div className="w-full">
      <Table
        columns={isUserLoggedIn ? columns : []}
        data={isUserLoggedIn ? trades : []}
        rowKey={row => row.id}
        emptyMessage={isUserLoggedIn ? "No trades found." : "Please log in to view trade history."}
        actions={
          isUserLoggedIn
            ? (trade) => (
                <button
                  className="bg-primary2normal border border-transparent hover:border-liquidwhite text-liquidlighgray hover:text-liquidwhite px-2 rounded text-body"
                  onClick={() => {
                    setSelectedTrade(trade);
                    setModalOpen(true);
                  }}
                >
                  Details
                </button>
              )
            : null
        }
      />
      {modalOpen && selectedTrade && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <div className="p-4">
            <div className="mb-4 text-body text-white">
              <div>Trade ID: {selectedTrade.id}</div>
              <div>Order ID: {selectedTrade.orderId}</div>
              <div>Symbol: {selectedTrade.symbol}</div>
              <div>Side: {selectedTrade.side}</div>
              <div>Position Side: {selectedTrade.positionSide}</div>
              <div>Price: {selectedTrade.price}</div>
              <div>Quantity: {selectedTrade.quantity}</div>
              <div>Notional: {selectedTrade.notional}</div>
              <div>Maker: {selectedTrade.maker ? "Yes" : "No"}</div>
              <div>Fee: {selectedTrade.fee?.cost} {selectedTrade.fee?.currency}</div>
              <div>Fee Rate: {selectedTrade.fee?.rate}</div>
              <div>Time: {formatDate(selectedTrade.timestamp)}</div>
            </div>
            <div className="flex justify-center gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-600 text-liquidwhite cursor-pointer min-w-[100px]"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TradesHistory;