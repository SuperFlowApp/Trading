import React, { useEffect, useState } from 'react';
import useUserInputStore from '../../Zustandstore/userInputStore'; // Import the store

const Trades = () => {
    const [trades, setTrades] = useState([]);
    const selectedPair = useUserInputStore((state) => state.selectedPair); // Get selectedPair from store

    useEffect(() => {
        const fetchTrades = async () => {
            try {
                // Compose symbol for API (e.g., BTCUSDT)
                const symbol = `${selectedPair}USDT`;
                const res = await fetch(
                    `https://fastify-serverless-function-rimj.onrender.com/api/trades?symbol=${symbol}&limit=100`
                );
                const data = await res.json();
                setTrades(data.sort((a, b) => b.timestamp - a.timestamp));
            } catch (err) {
                console.error('Failed to fetch trades:', err);
            }
        };

        // Fetch trades every 5 seconds
        const intervalId = setInterval(fetchTrades, 5000);

        // Fetch immediately on mount or when selectedPair changes
        fetchTrades();

        return () => clearInterval(intervalId);
    }, [selectedPair]); // Re-run effect when selectedPair changes

    return (
        <div className="w-full rounded-lg text-white text-right">
            <div className="overflow-y-auto max-h-[570px]">
                <table className="w-full">
                    <thead>
                        <tr className="bg-backgroundmid text-[12px] text-liquidwhite">
                            {/* <th className="py-2 px-4 text-left">Side</th> */}
                            <th className="pb-2 pl-2 font-normal text-left">Price</th>
                            <th className="pb-2 pr-2 font-normal">Size</th>
                            <th className="pb-2 pr-2 font-normal">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map((trade) => {
                            const side = trade.isBuyerMaker ? 'SELL' : 'BUY';
                            return (
                                <tr
                                    key={trade.id}
                                    className={`rounded-md ${side === 'BUY' ? 'text-primary2 bg-primary2/20' : 'text-primary1 bg-primary1/20'}`}
                                >
                                    {/* Remove Side column */}
                                    <td className="text-sm text-left pl-4">
                                        {parseFloat(trade.price).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </td>
                                    <td className="text-sm pr-4">
                                        {parseFloat(trade.quantity).toLocaleString(undefined, {
                                            minimumFractionDigits: 4,
                                            maximumFractionDigits: 4,
                                        })}
                                    </td>
                                    <td className="text-xs text-gray-400 pr-4">
                                        {new Date(trade.timestamp).toLocaleTimeString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Trades;