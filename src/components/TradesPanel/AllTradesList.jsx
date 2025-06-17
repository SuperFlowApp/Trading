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

            <div className="overflow-y-auto max-h-96"> 
                <ul className="">
                    {trades.map((trade) => (
                        <li
                            key={trade.id}
                            className={`mt-1 rounded-md flex justify-between items-center py-2 px-4 ${trade.side === 'BUY' ? 'bg-primary2/20' : 'bg-primary1/20'
                                }`}
                        >
                            <span
                                className={`font-medium ${trade.side === 'BUY' ? 'text-primary2' : 'text-primary1'
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