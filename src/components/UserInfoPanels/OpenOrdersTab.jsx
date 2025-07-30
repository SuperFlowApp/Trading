import React, { useEffect, useState, useRef } from "react";
import { getAuthKey, setAuthKey } from "../../utils/authKeyStorage";

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
  const [orders, setOrders] = useState([]);
  const [token, setToken] = useState(getAuthKey());
  const tokenRef = useRef(token);

  // Poll for authKey changes in localStorage
  useEffect(() => {
    const pollAuthKey = setInterval(() => {
      const currentToken = getAuthKey();
      if (currentToken !== tokenRef.current) {
        tokenRef.current = currentToken;
        setToken(currentToken);
      }
    }, 1000);
    return () => clearInterval(pollAuthKey);
  }, []);

  // Listen to authKeyChanged event
  useEffect(() => {
    const handleAuthKeyChange = () => {
      const currentToken = getAuthKey();
      tokenRef.current = currentToken;
      setToken(currentToken);
    };
    window.addEventListener("authKeyChanged", handleAuthKeyChange);
    return () => window.removeEventListener("authKeyChanged", handleAuthKeyChange);
  }, []);

  // Fetch open orders when token changes or every 5s if valid
  useEffect(() => {
    let intervalId;

    const fetchOrders = () => {
      if (!token || !isTokenValid(token)) {
        setOrders([]);
        return;
      }
      fetch('https://fastify-serverless-function-rimj.onrender.com/api/open-orders', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async res => {
          if (res.status === 401) {
            setAuthKey(null);
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
  }, [token]);

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