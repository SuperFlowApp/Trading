import React, { useEffect, useState } from "react";
import { useAuthKey } from "../../../contexts/AuthKeyContext";
import { formatPrice } from "../../../utils/priceFormater";
import Modal from "../../CommonUIs/modal/modal";
import Table from "../../CommonUIs/table";

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
  { key: "price", label: "Price", render: v => formatPrice(v) },
  { key: "quantity", label: "Qty", render: v => formatPrice(v) },
  { key: "filled", label: "Filled", render: v => formatPrice(v) },
  { key: "remaining", label: "Remaining", render: v => formatPrice(v) },
  { key: "notional", label: "Notional", render: v => formatPrice(v) },
  { key: "timeInForce", label: "TIF" },
  { key: "timestamp", label: "Created", render: v => formatDate(v) },
];

function formatDate(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleString();
}

const OpenOrdersTab = () => {
  const { authKey } = useAuthKey();
  const [orders, setOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Loading and response state for cancel
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelResponse, setCancelResponse] = useState(null);

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
    intervalId = setInterval(fetchOrders, 10000);

    return () => clearInterval(intervalId);
  }, [authKey]);

  const isUserLoggedIn = authKey && isTokenValid(authKey);

  // Reset loading/response state when modal opens/closes or order changes
  useEffect(() => {
    setCancelLoading(false);
    setCancelResponse(null);
  }, [modalOpen, selectedOrder]);

  return (
    <div className="w-full">
      <Table
        columns={columns}
        data={isUserLoggedIn ? orders : []}
        rowKey={row => row.orderId}
        emptyMessage={isUserLoggedIn ? "No open orders." : "Please log in to view open orders."}
        actions={
          isUserLoggedIn
            ? (order) => (
                <button
                  className="bg-liquidRed border border-transparent hover:border-liquidwhite text-liquidlighgray hover:text-liquidwhite px-2 rounded text-body"
                  onClick={() => {
                    setSelectedOrder(order);
                    setModalOpen(true);
                  }}
                >
                  Cancel
                </button>
              )
            : null
        }
      />
      {modalOpen && selectedOrder && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <div className="p-4">
            <div className="mb-4 text-body text-white">
              <div>Order ID: {selectedOrder.orderId}</div>
              <div>Symbol: {selectedOrder.symbol}</div>
              <div>Side: {selectedOrder.side}</div>
              <div>Type: {selectedOrder.type}</div>
              <div>Price: {formatPrice(selectedOrder.price)}</div>
              <div>Quantity: {formatPrice(selectedOrder.quantity)}</div>
            </div>
            {cancelResponse && (
              <div className="mb-4 p-2 rounded bg-backgroundmid border border-primary2normal text-liquidwhite break-all">
                {cancelResponse.error ? (
                  <>
                    Response:
                    <pre className="whitespace-pre-wrap break-all">{JSON.stringify(cancelResponse, null, 2)}</pre>
                  </>
                ) : (
                  <span>
                    Your order {cancelResponse.orderId} canceled successfully.
                  </span>
                )}
              </div>
            )}
            <div className="flex justify-center gap-2">
              {!cancelResponse ? (
                <button
                  className={`px-4 py-2 rounded bg-liquidRed text-liquidwhite hover:bg-red-700 flex items-center justify-center min-w-[100px]`}
                  onClick={async () => {
                    setCancelLoading(true);
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
                      setCancelResponse(data);
                      setOrders(orders => orders.filter(o => o.orderId !== id));
                    } catch (err) {
                      setCancelResponse({ error: "Cancel order error" });
                    } finally {
                      setCancelLoading(false);
                    }
                  }}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-liquidwhite" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Cancelling...
                    </span>
                  ) : (
                    "Confirm Cancel"
                  )}
                </button>
              ) : (
                <button
                  className="px-4 py-2 rounded bg-gray-600 text-liquidwhite cursor-pointer min-w-[100px]"
                  onClick={() => setModalOpen(false)}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OpenOrdersTab;