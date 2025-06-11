import { useState } from "react";

function BalancePanel() {
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Assume JWT is stored in localStorage after login
  const getJwtToken = () => localStorage.getItem("jwtToken");

  const handleFetchBalance = async () => {
    setLoading(true);
    setError("");
    setBalance(null);

    try {
      const token = getJwtToken();
      if (!token) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }

      const response = await fetch("/mock-api/balance", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch balance.");
      }

      const result = await response.json();
      setBalance(result);
    } catch (err) {
      setError("Failed to fetch balance.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#18393A] p-4 rounded-lg w-full max-w-md mx-auto space-y-3 border border-[#7DADB1]">
      <button
        className="bg-[#2D9DA8] px-4 py-2 rounded font-medium hover:bg-opacity-80 text-white"
        onClick={handleFetchBalance}
        disabled={loading}
      >
        {loading ? "Fetching..." : "Show Balance"}
      </button>
      {error && (
        <div className="bg-red-600 text-white text-xs rounded px-2 py-1 mt-2">
          {error}
        </div>
      )}
      {balance && (
        <div className="bg-black/40 p-2 rounded mt-2 text-xs overflow-x-auto text-white">
          <pre>{JSON.stringify(balance, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default BalancePanel;