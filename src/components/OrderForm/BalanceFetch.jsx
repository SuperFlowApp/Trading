import React, { useEffect, useState, useRef } from "react";
import { getAuthKey, setAuthKey } from "../../utils/authKeyStorage";
import { formatPrice } from '../../utils/priceFormater';

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
        .then(async res => {
          if (res.status === 401) {
            // Token invalid, clear it
            setAuthKey(null);
            setBalance(0.0);
            onBalance && onBalance(0.0);
            return;
          }
          const data = await res.json();
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
    <div>
      <span className="flex w-full justify-between text-liquidwhite font-semibold text-xs">
        Avilable to trade: {<span className="text-white font-semibold text-xs gap-4">
          {formatPrice(balance)} USDT
        </span>}
      </span>
      <span className="flex w-full justify-between text-liquidwhite font-semibold text-xs">
        Current position: {<span className="text-white font-semibold text-xs gap-4">
          {formatPrice(balance)} ETH
        </span>}
      </span>
    </div>
  );
};

export default BalanceFetch;