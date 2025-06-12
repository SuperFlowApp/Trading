import React, { useEffect, useState } from 'react';

const Trades = () => {
    const [trades, setTrades] = useState([]);

    useEffect(() => {
        const fetchTrades = async () => {
            try {
                const res = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/trades');
                const data = await res.json();
                setTrades(data.sort((a, b) => b.timestamp - a.timestamp)); // Sort by latest timestamp
            } catch (err) {
                console.error('Failed to fetch trades:', err);
            }
        };

        // Fetch trades every 5 seconds
        const intervalId = setInterval(fetchTrades, 5000);

        // Fetch immediately on mount
        fetchTrades();

        return () => clearInterval(intervalId); // Cleanup interval on unmount
    }, []);

    return (
        <div className="w-full rounded-lg shadow-lg text-white">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-[#2D9DA8] text-lg">Trades History</h2>
            </div>
            <div className="overflow-y-auto max-h-96">
                <ul className="divide-y divide-gray-700">
                    {trades.map((trade) => (
                        <li
                            key={trade.id}
                            className={`flex justify-between items-center py-2 px-4 ${trade.side === 'BUY' ? 'bg-[#2B8A93]/10' : 'bg-[#F5CB9D]/10'
                                }`}
                        >
                            <span
                                className={`font-medium ${trade.side === 'BUY' ? 'text-[#2B8A93]' : 'text-[#F5CB9D]'
                                    }`}
                            >
                                {trade.side}
                            </span>
                            <span className="text-sm">
                                {parseFloat(trade.price).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                            <span className="text-sm">
                                {parseFloat(trade.quantity).toLocaleString(undefined, {
                                    minimumFractionDigits: 4,
                                    maximumFractionDigits: 4,
                                })}
                            </span>
                            <span className="text-xs text-gray-400">
                                {new Date(trade.timestamp).toLocaleTimeString()}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Trades;