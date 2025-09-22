import { useState, useEffect } from 'react';
import { formatPrice } from '../../utils/priceFormater';
import { useAuthKey } from "../../contexts/AuthKeyContext"; // <-- use context
import { useZustandStore } from '../../Zustandstore/useStore.js';

// Helper to convert "0E-8", "0E-16", etc. to "0"
function normalizeZero(val) {
    if (typeof val === "string" && /^0(\.0*)?E-\d+$/.test(val)) return "0";
    return val;
}

function AccountInfoPanel() {
    const [accountInfoError, setAccountInfoError] = useState('');
    const [accountInfo, setAccountInfo] = useState(null);
    const { authKey, setAuthKey } = useAuthKey();
    const setAccountInfoGlobal = useZustandStore(s => s.setAccountInfo);

    // Listen for authKey changes (multi-tab support)
    useEffect(() => {
        const handler = () => {
            // No need to manually fetch authKey, context will update
            if (!authKey) {
                setAccountInfo(null);
                setAccountInfoError('');
            }
        };
        window.addEventListener("authKeyChanged", handler);
        return () => window.removeEventListener("authKeyChanged", handler);
    }, [authKey]);

    // Fetch account info when authKey changes and authKey is present
    useEffect(() => {
        if (!authKey) {
            setAccountInfo(null);
            setAccountInfoError('');
            setAccountInfoGlobal(null); // clear global on logout
            return;
        }
        const fetchAccountInfo = async () => {
            setAccountInfoError('');
            try {
                const res = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/account-information', {
                    headers: {
                        'Authorization': `Bearer ${authKey}`,
                        'accept': 'application/json'
                    }
                });
                const data = await res.json();
                if (res.status === 401) {
                    setAuthKey(null);
                    setAccountInfo(null);
                    setAccountInfoGlobal(null);
                } else if (!res.ok) {
                    setAccountInfo(null);
                    setAccountInfoGlobal(null);
                } else {
                    setAccountInfo(data);
                    setAccountInfoGlobal(data); // <-- update global Zustand
                }
            } catch (e) {
                setAccountInfo(null);
                // Do not set error message for network errors
            }
        };
        fetchAccountInfo();
    }, [authKey, setAuthKey, setAccountInfoGlobal]);

    // Poll for account info every 10 seconds if authKey is present
    useEffect(() => {
        if (!authKey) {
            setAccountInfo(null);
            setAccountInfoError('');
            return;
        }

        let isMounted = true;

        const fetchAccountInfo = async () => {
            setAccountInfoError('');
            try {
                const res = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/account-information', {
                    headers: {
                        'Authorization': `Bearer ${authKey}`,
                        'accept': 'application/json'
                    }
                });
                const data = await res.json();
                if (!isMounted) return;
                if (res.status === 401) {
                    setAuthKey(null);
                    setAccountInfo(null);
                } else if (!res.ok) {
                    setAccountInfo(null);
                } else {
                    setAccountInfo(data);
                }
            } catch (e) {
                if (isMounted) setAccountInfo(null);
            }
        };

        fetchAccountInfo(); // initial fetch

        const interval = setInterval(fetchAccountInfo, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [authKey, setAuthKey]);

    // Helper: get first position (if any)
    const position = accountInfo?.positions?.[0];

    // Remove helpers that use missing fields
    // For example, liquidationPrice, pendingBuyNotional, notional, initialMargin, marginRatio, cross, upnl, maintenanceMargin, leverage

    return (
        <>
            <div className="flex flex-col bg-backgroundmid rounded-md p-2 w-[100%] overflow-hidden">
                <div className="text-xs flex flex-col gap-2">
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Account Equity (Perps)</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.marginBalance != null
                                ? formatPrice(normalizeZero(accountInfo.marginBalance))
                                : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Balance</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.walletBalance != null
                                ? formatPrice(normalizeZero(accountInfo.walletBalance))
                                : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Unrealized PNL</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.upnl != null
                                ? formatPrice(normalizeZero(accountInfo.upnl))
                                : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Paid Fee</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.paidFee != null
                                ? formatPrice(normalizeZero(accountInfo.paidFee))
                                : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Available For Order</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.availableForOrder != null
                                ? formatPrice(normalizeZero(accountInfo.availableForOrder))
                                : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Cross Initial Margin</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.crossInitialMargin != null
                                ? formatPrice(normalizeZero(accountInfo.crossInitialMargin))
                                : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Cross Maintenance Margin</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.crossMaintenanceMargin != null
                                ? formatPrice(normalizeZero(accountInfo.crossMaintenanceMargin))
                                : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Cross Pending Initial Margin</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.crossPendingInitialMargin != null
                                ? formatPrice(normalizeZero(accountInfo.crossPendingInitialMargin))
                                : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Position Mode</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.positionMode || '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Realized PNL</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.realizedPnl != null
                                ? formatPrice(normalizeZero(accountInfo.realizedPnl))
                                : '—'}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AccountInfoPanel;