import React, { useEffect, useState } from 'react';
import { selectedPairStore } from '../../Zustandstore/userOrderStore.js';
import { useMultiWebSocketGlobal } from '../../contexts/MultiWebSocketContext';

const Trades = () => {
    const [trades, setTrades] = useState([]);
    const selectedPair = selectedPairStore((state) => state.selectedPair);
    const symbol = `${selectedPair}USDT`;

    // Use global websocket hook
    const { payloads } = useMultiWebSocketGlobal();
    const wsTradeData = payloads.trades;

    // Initial REST fetch
    useEffect(() => {
        let active = true;
        const fetchTrades = async () => {
            try {
                const res = await fetch(
                    `https://fastify-serverless-function-rimj.onrender.com/api/trades?symbol=${symbol}&limit=100`
                );
                const data = await res.json();
                if (active) {
                    setTrades(data.sort((a, b) => b.timestamp - a.timestamp));
                }
            } catch (err) {
                console.error('Failed to fetch trades:', err);
            }
        };
        fetchTrades();
        return () => { active = false; };
    }, [symbol]);

    // Listen for live trades from websocket payload
    useEffect(() => {
        if (wsTradeData && wsTradeData.e === 'trade' && wsTradeData.s === symbol) {
            setTrades(prev => [wsTradeData, ...prev].slice(0, 100));
        }
    }, [wsTradeData, symbol]);

    return (
        <div className="w-full rounded-md text-white text-right">
            <div className="overflow-y-auto max-h-[570px]">
                <table className="w-full">
                    <thead>
                        <tr className="bg-backgroundmid text-body text-liquidwhite">
                            <th className="pb-2 pl-2 font-normal text-left">Price</th>
                            <th className="pb-2 pr-2 font-normal">Size</th>
                            <th className="pb-2 pr-2 font-normal">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map((trade) => {
                            const side = trade.m ? 'SELL' : 'BUY'; // 'm' is isBuyerMaker
                            return (
                                <tr
                                    key={`${trade.a || trade.id}-${trade.T || trade.timestamp}`}
                                    className={`rounded-md ${side === 'BUY' ? 'text-green bg-green/20' : 'text-red bg-red/20'}`}
                                >
                                    <td className="text-body text-left pl-2">
                                        {parseFloat(trade.p || trade.price).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </td>
                                    <td className="text-body pr-2">
                                        {parseFloat(trade.q || trade.quantity).toLocaleString(undefined, {
                                            minimumFractionDigits: 4,
                                            maximumFractionDigits: 4,
                                        })}
                                    </td>
                                    <td className="text-xs text-gray-400 pr-2">
                                        {new Date(trade.T || trade.timestamp).toLocaleTimeString()}
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