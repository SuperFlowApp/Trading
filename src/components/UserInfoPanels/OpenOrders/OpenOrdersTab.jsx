import React, { useEffect, useState } from "react";
import { useAuthKey } from "../../../contexts/AuthKeyContext";
import { formatPrice } from "../../../utils/priceFormater";
import Modal from "../../CommonUIs/modal/modal"; // <-- Add this import

const priceKeys = ["price", "notional", "quantity", "filled", "remaining"];

function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

const columns = [
  { key: "orderId", label: "Order ID" },
  { key: "symbol", label: "Symbol" },
  { key: "side", label: "Side" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "price", label: "Price" },
  { key: "quantity", label: "Qty" },
  { key: "filled", label: "Filled" },
  { key: "remaining", label: "Remaining" },
  { key: "notional", label: "Notional" },
  { key: "timeInForce", label: "TIF" },
  { key: "timestamp", label: "Created" },
];

function formatDate(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleString();
}

const OpenOrdersTab = () => {
  const { authKey } = useAuthKey();
  const [orders, setOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false); // <-- Add
  const [selectedOrder, setSelectedOrder] = useState(null); // <-- Add

  // Fetch open orders when authKey changes or every 5s if valid
  useEffect(() => {
    if (!authKey || !isTokenValid(authKey)) {
      setOrders([]);
      return;
    }

    let intervalId;

    const fetchOrders = () => {
      fetch('https://fastify-serverless-function-rimj.onrender.com/api/open-orders', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${authKey}`,
        },
      })
        .then(async res => {
          if (res.status === 401) {
            setOrders([]);
            return;
          }
          const data = await res.json();
          setOrders(data);
        })
        .catch(err => {
          setOrders([]);
          console.error("Open orders fetch error:", err);
        });
    };

    fetchOrders(); // Initial fetch
    intervalId = setInterval(fetchOrders, 2000);

    return () => clearInterval(intervalId);
  }, [authKey]);

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-liquidwhite">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-2 py-2 border-b border-gray-700 font-semibold text-left">
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-2 border-b border-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {!authKey || !isTokenValid(authKey) ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-8 text-gray-400">
                  Please log in to view open orders.
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-8 text-gray-400">
                  No open orders.
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.orderId} className="border-b border-gray-800 hover:bg-gray-800">
                  {columns.map(col => (
                    <td key={col.key} className="px-2 py-1">
                      {col.key === "timestamp"
                        ? formatDate(order[col.key])
                        : priceKeys.includes(col.key)
                          ? formatPrice(order[col.key])
                          : order[col.key] ?? "-"}
                    </td>
                  ))}
                  <td className=" py-1">
                    <div className="flex gap-1">
                      {/*
                      <button className="bg-backgrounddark border border-transparent hover:border-liquidwhite text-liquidwhite hover:text-white px-2 py-1 rounded text-xs mr-1">Set TP</button>
                      <button className="bg-backgrounddark border border-transparent hover:border-liquidwhite text-liquidwhite hover:text-white px-2 py-1 rounded text-xs">Set SL</button>
                      <button className="border border-primary2normal hover:border-liquidwhite text-white px-2 py-1 rounded text-xs">Edit</button>
                      */}
                      <button
                        className="bg-warningcolor border border-transparent hover:border-liquidwhite text-white px-2 py-1 rounded text-xs"
                        onClick={() => {
                          setSelectedOrder(order);
                          setModalOpen(true);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {modalOpen && selectedOrder && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Cancel Order</h2>
            <div className="mb-4 text-sm">
              <div><b>Order ID:</b> {selectedOrder.orderId}</div>
              <div><b>Symbol:</b> {selectedOrder.symbol}</div>
              <div><b>Side:</b> {selectedOrder.side}</div>
              <div><b>Type:</b> {selectedOrder.type}</div>
              <div><b>Price:</b> {formatPrice(selectedOrder.price)}</div>
              <div><b>Quantity:</b> {formatPrice(selectedOrder.quantity)}</div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-backgroundmid border border-gray-700 text-liquidwhite hover:bg-backgroundlighthover"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-warningcolor text-white hover:bg-red-700"
                onClick={async () => {
                  try {
                    const id = selectedOrder.orderId;
                    const symbol = selectedOrder.symbol;
                    const res = await fetch(
                      `https://fastify-serverless-function-rimj.onrender.com/api/cancel-order?id=${id}&symbol=${symbol}`,
                      {
                        method: "DELETE",
                        headers: {
                          accept: "application/json",
                          Authorization: `Bearer ${authKey}`,
                        },
                      }
                    );
                    const data = await res.json();
                    setOrders(orders => orders.filter(o => o.orderId !== id));
                    setModalOpen(false);
                  } catch (err) {
                    console.error("Cancel order error:", err);
                    setModalOpen(false);
                  }
                }}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OpenOrdersTab;