import React, { useEffect, useState, useRef } from "react";
import { getAuthKey, setAuthKey } from "../../utils/authKeyStorage";
import { formatPrice } from '../../utils/priceFormater';
import { selectedPairStore } from "../../Zustandstore/userOrderStore";

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
  const [currentPosition, setCurrentPosition] = useState(0.0);
  const [token, setToken] = useState(getAuthKey());
  const [positionNotFound, setPositionNotFound] = useState(false); // NEW
  const tokenRef = useRef(token);

  // Zustand store for selected pair
  const selectedPair = selectedPairStore((state) => state.selectedPair);

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

  // Fetch balance and current position when token or selectedPair changes or every 5s if valid
  useEffect(() => {
    let intervalId;

    const fetchBalanceAndPosition = () => {
      if (positionNotFound) return; // NEW: Stop if 404 previously received

      if (!token || !isTokenValid(token)) {
        setBalance(0.0);
        setCurrentPosition(0.0);
        onBalance && onBalance(0.0);
        return;
      }

      // Fetch balance
      fetch('https://fastify-serverless-function-rimj.onrender.com/api/balance', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async res => {
          if (res.status === 401) {
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

      // Fetch current position
      const symbol = selectedPair ? `${selectedPair}USDT` : "BTCUSDT";
      fetch(`https://fastify-serverless-function-rimj.onrender.com/api/current-position?symbol=${encodeURIComponent(symbol)}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async res => {
          if (res.status === 401) {
            setAuthKey(null);
            setCurrentPosition(0.0);
            return;
          }
          if (res.status === 404) {
            setCurrentPosition(0.0);
            setPositionNotFound(true); // NEW: Stop future fetches
            return;
          }
          const data = await res.json();
          // Try to extract position amount from API response
          // Adjust this logic if your API returns a different schema
          if (data && typeof data.positionAmt !== "undefined") {
            setCurrentPosition(Number(data.positionAmt));
          } else if (data && data.position && typeof data.position.amount !== "undefined") {
            setCurrentPosition(Number(data.position.amount));
          } else {
            setCurrentPosition(0.0);
            // Optionally log schema error
            // console.error("Current position response schema error:", data);
          }
        })
        .catch(err => {
          setCurrentPosition(0.0);
          // Optionally log error
          // console.error("Current position fetch error:", err);
        });
    };

    fetchBalanceAndPosition(); // Initial fetch
    intervalId = setInterval(fetchBalanceAndPosition, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [token, onBalance, selectedPair, positionNotFound]); // Add positionNotFound to deps

  return (
    <div>
      <span className="flex w-full justify-between text-liquidwhite font-semibold text-xs">
        Avilable to trade: {<span className="text-white font-semibold text-xs gap-4">
          {formatPrice(balance)} USDT
        </span>}
      </span>
      <span className="flex w-full justify-between text-liquidwhite font-semibold text-xs">
        Current position: {<span className="text-white font-semibold text-xs gap-4">
          {formatPrice(currentPosition)} {`${selectedPair}`}
        </span>}
      </span>
    </div>
  );
};

export default BalanceFetch;