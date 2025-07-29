import { useState, useEffect } from 'react';
import { marketsData } from './Zustandstore/marketsDataStore.js';
import {selectedPairStore} from './Zustandstore/userOrderStore.js';
import { getAuthKey } from './utils/authKeyStorage.jsx';

export default function DebuggerPanel() {
    const selectedPairStoreState = selectedPairStore();
    const allMarketData = marketsData(state => state.allMarketData);

    // Fetch authKey from native storage
    const [authKey, setAuthKey] = useState(getAuthKey());
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        // Update authKey on storage change (for multi-tab support)
        const handler = () => setAuthKey(getAuthKey());
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, []);

    useEffect(() => {
        if (!allMarketData || allMarketData.length === 0) {
            fetch('https://fastify-serverless-function-rimj.onrender.com/api/markets')
                .then((res) => res.json())
                .then((data) => {
                    const filtered = data.filter((m) => m.active && m.type === 'futures');
                    const processed = filtered.map((mkt) => {
                        let base = mkt.base;
                        let quote = mkt.quote;
                        if (!base || !quote) {
                            const match = mkt.symbol.match(/^([A-Z]+)(USDT|USD|BTC|ETH|BNB|EUR|TRY|USDC)$/);
                            if (match) {
                                base = match[1];
                                quote = match[2];
                            } else {
                                base = mkt.symbol;
                                quote = '';
                            }
                        }
                        return { ...mkt, base, quote };
                    });
                    marketsData.getState().setAllMarketData(processed);
                });
        }
    }, [allMarketData]);

    return (
        <div style={{ background: '#18181b', color: '#fff', minHeight: '100vh', padding: 32, justifyItems: 'center' }}>
            {/* Auth Status */}
            <div
                style={{
                    background: authKey ? '#22c55e' : '#ef4444',
                    color: '#fff',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 24,
                    fontWeight: 'bold',
                    fontSize: 16,
                    textAlign: 'center',
                    width: '50%',
                }}
            >
                {authKey
                    ? `Authorized: ${authKey}`
                    : 'Not authorized'}
            </div>

            <h2 style={{ fontSize: 20, marginBottom: 8 }}>userOrderStore.js</h2>
            <pre
                style={{
                    background: '#23272f',
                    color: '#d1d5db',
                    padding: 16,
                    borderRadius: 8,
                    fontSize: 14,
                    overflowX: 'auto',
                    maxHeight: 400,
                }}
            >
                {JSON.stringify({ ...selectedPairStoreState }, null, 2)}
            </pre>

            <pre
                style={{
                    background: '#23272f',
                    color: '#d1d5db',
                    padding: 16,
                    borderRadius: 8,
                    fontSize: 14,
                    overflowX: 'auto',
                    maxHeight: 400,
                }}
            >
                {JSON.stringify({ authKey }, null, 2)}
            </pre>
            <button
                style={{
                    marginTop: 16,
                    padding: '8px 16px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                }}
                onClick={() => setModalOpen(true)}
            >
                Show allMarketData
            </button>

            {modalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        style={{
                            background: '#23272f',
                            color: '#d1d5db',
                            padding: 24,
                            borderRadius: 8,
                            maxWidth: '90vw',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            position: 'relative',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                padding: '4px 10px',
                                cursor: 'pointer',
                            }}
                            onClick={() => setModalOpen(false)}
                        >
                            Close
                        </button>
                        <h3 style={{ marginBottom: 12 }}>allMarketData</h3>
                        <pre style={{ fontSize: 12, maxHeight: 500, overflow: 'auto' }}>
                            {JSON.stringify(allMarketData, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}