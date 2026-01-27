import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Table from "../../CommonUIs/table";
import Modal from "../../CommonUIs/modal/modal";
import { API_BASE_URL } from "../../../config/api";

const columns = [
  { key: "tradeId", label: "Trade ID" },
  { key: "symbol", label: "Symbol" },
  { key: "side", label: "Side" },
  { key: "price", label: "Price" },
  { key: "quantity", label: "Qty" },
  { key: "notional", label: "Notional" },
  { key: "timestamp", label: "Time", render: v => formatDate(v) },
];

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

const TradesHistory = () => {
  const authKey = Cookies.get("authKey");
  const [trades, setTrades] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  useEffect(() => {
    if (!authKey || !isTokenValid(authKey)) {
      setTrades([]);
      return;
    }

    let intervalId;

    const fetchTrades = () => {
      fetch(`https://fastify-serverless-function-ymut.onrender.com/api/trades`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${authKey}`,
        },
      })
        .then(async res => {
          if (res.status === 401) {
            setTrades([]);
            return;
          }
          const data = await res.json();
          setTrades(data);
        })
        .catch(err => {
          setTrades([]);
          console.error("Trades fetch error:", err);
        });
    };

    fetchTrades(); // Initial fetch
    intervalId = setInterval(fetchTrades, 10000);

    return () => clearInterval(intervalId);
  }, [authKey]);

  const isUserLoggedIn = authKey && isTokenValid(authKey);

  return (
    <div className="w-full">
      <Table
        columns={isUserLoggedIn ? columns : []} // Hide header if not logged in
        data={isUserLoggedIn ? trades : []}
        rowKey={row => row.tradeId}
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
              <div>Trade ID: {selectedTrade.tradeId}</div>
              <div>Symbol: {selectedTrade.symbol}</div>
              <div>Side: {selectedTrade.side}</div>
              <div>Price: {selectedTrade.price}</div>
              <div>Quantity: {selectedTrade.quantity}</div>
              <div>Notional: {selectedTrade.notional}</div>
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