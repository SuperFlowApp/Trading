import React, { useEffect, useState, useRef } from "react";
import { getAuthKey } from "../../utils/authKeyStorage";

function isTokenValid(token) {
  // Example: JWT expiration check
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

const BalanceFetch = ({ onBalance }) => {
  const [balance, setBalance] = useState(0.0);
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
    }, 1000); // Check every second

    return () => clearInterval(pollAuthKey);
  }, []);

  // Fetch balance when token changes or every 5s if valid
  useEffect(() => {
    let intervalId;

    const fetchBalance = () => {
      if (!token || !isTokenValid(token)) {
        setBalance(0.0);
        onBalance && onBalance(0.0);
        return;
      }
      fetch('https://fastify-serverless-function-rimj.onrender.com/api/balance', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (
            data &&
            data.balances &&
            data.balances.USDT &&
            typeof data.balances.USDT.free !== 'undefined'
          ) {
            setBalance(data.balances.USDT.free);
            onBalance && onBalance(data.balances.USDT.free);
          } else {
            setBalance(0.0);
            onBalance && onBalance(0.0);
            console.error("Balance response schema error:", data);
          }
        })
        .catch(err => {
          setBalance(0.0);
          onBalance && onBalance(0.0);
          console.error("Balance fetch error:", err);
        });
    };

    fetchBalance(); // Initial fetch
    intervalId = setInterval(fetchBalance, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [token, onBalance]);

  return (
<span className="flex w-full justify-between text-liquidwhite font-semibold text-xs">
      Balance: {<span className="text-white font-semibold text-xs gap-4">
        {parseFloat(balance).toFixed(1)} USDT
      </span>}
    </span>
  );
};

export default BalanceFetch;