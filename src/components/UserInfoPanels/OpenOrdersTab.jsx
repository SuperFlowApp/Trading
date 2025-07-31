import React, { useEffect, useState } from "react";
import { useAuthKey } from "../../contexts/AuthKeyContext";

function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

const OpenOrdersTab = () => {
  const { authKey } = useAuthKey(); // Use context
  const [orders, setOrders] = useState([]);

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
    intervalId = setInterval(fetchOrders, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [authKey]);

  // Show login state
  if (!authKey || !isTokenValid(authKey)) {
    return (
      <div>
        <span className="flex w-full justify-between text-liquidwhite font-semibold text-xs mb-2">
          Please log in to view open orders.
        </span>
      </div>
    );
  }

  return (
    <div>
      <span className="flex w-full justify-between text-liquidwhite font-semibold text-xs mb-2">
        Raw Open Orders Data:
      </span>
      <pre className="bg-gray-900 text-white text-xs p-2 rounded overflow-x-auto max-h-96">
        {JSON.stringify(orders, null, 2)}
      </pre>
    </div>
  );
};

export default OpenOrdersTab;