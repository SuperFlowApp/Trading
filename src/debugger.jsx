import { useState, useEffect } from 'react';
import { marketsData, authKey } from './Zustandstore/panelStore';
import useUserInputStore from './Zustandstore/userInputStore';

export default function DebeggerPanel() {
    const useUserInputStoreState = useUserInputStore();
    // Subscribe to authKey changes:
    const authKeyValue = authKey(state => state.authKey);
    const marketsDataState = marketsData(); // <-- get marketsData state

    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        // Only fetch if not already loaded
        if (!marketsDataState.allMarketData || marketsDataState.allMarketData.length === 0) {
            fetch('https://fastify-serverless-function-rimj.onrender.com/api/markets')
                .then((res) => res.json())
                .then((data) => {
                    // Filter for active and correct type
                    const filtered = data.filter((m) => m.active && m.type === 'futures');
                    // Extract base and quote from symbol if missing
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
    }, [marketsDataState.allMarketData]);

    // Add this inside your DebeggerPanel component, for debugging:
    useEffect(() => {
        console.log("DebuggerPanel authKeyValue:", authKeyValue);
    }, [authKeyValue]);

    return (
        <div style={{ background: '#18181b', color: '#fff', minHeight: '100vh', padding: 32, justifyItems: 'center' }}>
            {/* Auth Status */}
            <div
                style={{
                    background: authKeyValue ? '#22c55e' : '#ef4444',
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
                {authKeyValue
                    ? `Authorized: ${authKeyValue}`
                    : 'Not authorized'}
            </div>

           
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>userInputStore.js</h2>
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
                {JSON.stringify({ ...useUserInputStoreState }, null, 2)}
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
                {JSON.stringify(authKeyValue, null, 2)}
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
                            {JSON.stringify(marketsDataState.allMarketData, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}