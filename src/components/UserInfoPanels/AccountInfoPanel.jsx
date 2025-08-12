import { useState, useEffect } from 'react';
import { formatPrice } from '../../utils/priceFormater';
import { useAuthKey } from "../../contexts/AuthKeyContext"; // <-- use context

// Helper to convert "0E-8", "0E-16", etc. to "0"
function normalizeZero(val) {
    if (typeof val === "string" && /^0(\.0*)?E-\d+$/.test(val)) return "0";
    return val;
}

function AccountInfoPanel() {
    const [accountInfoError, setAccountInfoError] = useState('');
    const [accountInfo, setAccountInfo] = useState(null);
    const { authKey, setAuthKey } = useAuthKey();

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
            return;
        }
        const fetchAccountInfo = async () => {
            setAccountInfoError('');
            try {
                const res = await fetch('/api/account-information', {
                    headers: {
                        'Authorization': `Bearer ${authKey}`,
                        'accept': 'application/json'
                    }
                });
                const data = await res.json();
                if (res.status === 401) {
                    setAuthKey(null);
                    setAccountInfo(null);
                } else if (!res.ok) {
                    setAccountInfo(null);
                    // Do not set error message for server/network errors
                } else {
                    setAccountInfo(data);
                }
            } catch (e) {
                setAccountInfo(null);
                // Do not set error message for network errors
            }
        };
        fetchAccountInfo();
    }, [authKey, setAuthKey]);

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
                const res = await fetch('/api/account-information', {
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

        const interval = setInterval(fetchAccountInfo, 2000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [authKey, setAuthKey]);

    // Helper: get first position (if any)
    const position = accountInfo?.positions?.[0];

    // Helper: calculate order value (pendingBuyNotional or notional)
    const orderValue = position
        ? normalizeZero(position.pendingBuyNotional) !== "0"
            ? normalizeZero(position.pendingBuyNotional)
            : normalizeZero(position.notional)
        : '';

    // Helper: margin required (isolated or cross)
    const marginRequired = normalizeZero(position?.initialMargin) !== "0"
        ? normalizeZero(position?.initialMargin)
        : normalizeZero(accountInfo?.crossInitialMargin);

    // Helper: cross margin ratio (use field or calculate)
    let crossMarginRatio = normalizeZero(position?.marginRatio);
    if ((!crossMarginRatio || crossMarginRatio === "0") && accountInfo?.crossMaintenanceMargin && accountInfo?.crossInitialMargin) {
        const maint = parseFloat(normalizeZero(accountInfo.crossMaintenanceMargin));
        const init = parseFloat(normalizeZero(accountInfo.crossInitialMargin));
        if (init > 0) crossMarginRatio = (maint / init).toFixed(4);
    }

    // Helper: cross account leverage (estimate)
    let crossLeverage = '';
    if (position && position.cross && position.notional && accountInfo?.crossInitialMargin) {
        const notional = parseFloat(normalizeZero(position.notional));
        const crossInit = parseFloat(normalizeZero(accountInfo.crossInitialMargin));
        if (crossInit > 0) crossLeverage = (notional / crossInit).toFixed(2);
    }

    return (
        <>
            <div className="flex flex-col bg-backgroundmid rounded-md p-2 w-[100%] overflow-hidden">
                {/* Do not show error messages */}
                {/* {accountInfoError && (
                    <div className="text-red-400 text-xs">{accountInfoError}</div>
                )} */}
                <div className="text-xs flex flex-col gap-2">
                    {/* Top Section */}
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Liquidation Price</span>
                        <span className="text-white font-semibold">
                            {position?.liquidationPrice != null
                                ? formatPrice(normalizeZero(position.liquidationPrice))
                                : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Order Value</span>
                        <span className="text-white font-semibold">
                            {orderValue !== ''
                                ? formatPrice(orderValue)
                                : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Margin Required</span>
                        <span className="text-white font-semibold">
                            {marginRequired !== ''
                                ? formatPrice(marginRequired)
                                : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Fees Paid</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.paidFee != null
                                ? formatPrice(normalizeZero(accountInfo.paidFee))
                                : '—'}
                        </span>
                    </div>
                    {/* Perps Overview */}
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
                                : (position?.upnl != null
                                    ? formatPrice(normalizeZero(position.upnl))
                                    : '—')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Cross Margin Ratio</span>
                        <span className="text-white font-semibold">
                            {crossMarginRatio !== undefined && crossMarginRatio !== null && crossMarginRatio !== ''
                                ? formatPrice(crossMarginRatio)
                                : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Maintenance Margin</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.crossMaintenanceMargin != null
                                ? formatPrice(normalizeZero(accountInfo.crossMaintenanceMargin))
                                : (position?.maintenanceMargin != null
                                    ? formatPrice(normalizeZero(position.maintenanceMargin))
                                    : '—')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Cross Account Leverage</span>
                        <span className="text-white font-semibold">
                            {position?.leverage != null
                                ? formatPrice(normalizeZero(position.leverage))
                                : (crossLeverage !== ''
                                    ? formatPrice(crossLeverage)
                                    : '—')}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AccountInfoPanel;