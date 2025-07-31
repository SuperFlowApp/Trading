import React, { useEffect, useState } from "react";
import { useAuthKey } from "../../contexts/AuthKeyContext"; // <-- use context
import { formatPrice } from '../../utils/priceFormater';
import { selectedPairStore } from "../../Zustandstore/userOrderStore";

function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

const BalanceFetch = ({ onBalance }) => {
  const { authKey } = useAuthKey(); // <-- get authKey from context
  const [balance, setBalance] = useState(0.0);
  const [currentPosition, setCurrentPosition] = useState(0.0);
  const [positionNotFound, setPositionNotFound] = useState(false);

  // Zustand store for selected pair
  const selectedPair = selectedPairStore((state) => state.selectedPair);

  // Fetch balance and current position when authKey or selectedPair changes or every 5s if valid
  useEffect(() => {
    let intervalId;

    // Reset state on logout
    if (!authKey) {
      setBalance(0.0);
      setCurrentPosition(0.0);
      setPositionNotFound(false);
      onBalance && onBalance(0.0);
      return;
    }

    const fetchBalanceAndPosition = () => {
      if (positionNotFound) return;

      if (!authKey || !isTokenValid(authKey)) {
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
          Authorization: `Bearer ${authKey}`,
        },
      })
        .then(async res => {
          if (res.status === 401) {
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
          Authorization: `Bearer ${authKey}`,
        },
      })
        .then(async res => {
          if (res.status === 401) {
            setCurrentPosition(0.0);
            return;
          }
          if (res.status === 404) {
            setCurrentPosition(0.0);
            setPositionNotFound(true);
            return;
          }
          const data = await res.json();
          if (data && typeof data.positionAmt !== "undefined") {
            setCurrentPosition(Number(data.positionAmt));
          } else if (data && data.position && typeof data.position.amount !== "undefined") {
            setCurrentPosition(Number(data.position.amount));
          } else {
            setCurrentPosition(0.0);
          }
        })
        .catch(err => {
          setCurrentPosition(0.0);
        });
    };

    fetchBalanceAndPosition(); // Initial fetch
    intervalId = setInterval(fetchBalanceAndPosition, 5000);

    return () => clearInterval(intervalId);
  }, [authKey, onBalance, selectedPair, positionNotFound]);

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