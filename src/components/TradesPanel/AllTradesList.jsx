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

            <div className="overflow-y-auto max-h-[600px]"> 
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


{/*
    
    
    import React, { useEffect, useState } from 'react';

const Trades = () => {
    const [trades, setTrades] = useState([]);

    useEffect(() => {
        const eventSource = new EventSource('https://websocketserver-am3y.onrender.com/stream/trades');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Received trade data:', data); // <-- Add this line
                if (Array.isArray(data)) {
                    setTrades(prev => [...data, ...prev].sort((a, b) => b.timestamp - a.timestamp).slice(0, 100));
                } else {
                    setTrades(prev => [data, ...prev].sort((a, b) => b.timestamp - a.timestamp).slice(0, 100));
                }
            } catch (err) {
                console.error('Failed to parse trade:', err);
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE error:', err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    return (
        <div className="w-full rounded-lg shadow-lg text-white">
            <div className="overflow-y-auto max-h-96"> 
                <ul>
                    {trades.map((trade, idx) => {
                        // Map API fields to expected fields
                        const price = parseFloat(trade.p);
                        const quantity = parseFloat(trade.q);
                        const timestamp = trade.T || trade.E;
                        const side = trade.m ? 'SELL' : 'BUY'; // m=true: SELL, m=false: BUY
                        const id = trade.a ?? `${timestamp}-${price}-${idx}`;

                        return (
                            <li
                                key={id}
                                className={`mt-1 rounded-md flex justify-between items-center py-2 px-4 ${side === 'BUY' ? 'bg-primary2/20' : 'bg-primary1/20'}`}
                            >
                                <span className={`font-medium ${side === 'BUY' ? 'text-primary2' : 'text-primary1'}`}>
                                    {side}
                                </span>
                                <span className="text-sm">
                                    {price.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                                <span className="text-sm">
                                    {quantity.toLocaleString(undefined, {
                                        minimumFractionDigits: 4,
                                        maximumFractionDigits: 4,
                                    })}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {new Date(timestamp).toLocaleTimeString()}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default Trades;





    */}