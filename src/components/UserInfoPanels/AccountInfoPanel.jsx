import { useState, useEffect } from 'react';
import { getAuthKey } from '../../utils/authKeyStorage.jsx';

// Helper to convert "0E-8", "0E-16", etc. to "0"
function normalizeZero(val) {
    if (typeof val === "string" && /^0(\.0*)?E-\d+$/.test(val)) return "0";
    return val;
}

function AccountInfoPanel() {
    const [accountInfoError, setAccountInfoError] = useState('');
    const [accountInfo, setAccountInfo] = useState(null);

    useEffect(() => {
        const fetchAccountInfo = async () => {
            const authKey = getAuthKey();
            if (!authKey) {
                setAccountInfoError('Not logged in');
                setAccountInfo(null);
                return;
            }
            setAccountInfoError('');
            try {
                const res = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/account-information', {
                    headers: {
                        'Authorization': `Bearer ${authKey}`,
                        'accept': 'application/json'
                    }
                });
                const data = await res.json();
                if (!res.ok) {
                    setAccountInfoError(data?.error || 'Failed to fetch account info');
                    setAccountInfo(null);
                } else {
                    setAccountInfo(data);
                }
            } catch (e) {
                setAccountInfoError('Network error');
                setAccountInfo(null);
            }
        };
        fetchAccountInfo();
    }, []);

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
            <div className="flex flex-col bg-backgroundmid rounded-md p-2 min-w-0 overflow-hidden">
                {accountInfoError && (
                    <div className="text-red-400 text-xs">{accountInfoError}</div>
                )}
                <div className="text-xs flex flex-col gap-2">
                    {/* Top Section */}
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Liquidation Price</span>
                        <span className="text-white font-semibold">
                            {normalizeZero(position?.liquidationPrice) ?? '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Order Value</span>
                        <span className="text-white font-semibold">
                            {orderValue ?? '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Margin Required</span>
                        <span className="text-white font-semibold">
                            {marginRequired ?? '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Fees Paid</span>
                        <span className="text-white font-semibold">
                            {normalizeZero(accountInfo?.paidFee) ?? '—'}
                        </span>
                    </div>
                    {/* Perps Overview */}
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Account Equity (Perps)</span>
                        <span className="text-white font-semibold">
                            {normalizeZero(accountInfo?.marginBalance) ?? '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Balance</span>
                        <span className="text-white font-semibold">
                            {normalizeZero(accountInfo?.walletBalance) ?? '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Unrealized PNL</span>
                        <span className="text-white font-semibold">
                            {normalizeZero(accountInfo?.upnl) ?? normalizeZero(position?.upnl) ?? '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Cross Margin Ratio</span>
                        <span className="text-white font-semibold">
                            {crossMarginRatio ?? '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Maintenance Margin</span>
                        <span className="text-white font-semibold">
                            {normalizeZero(accountInfo?.crossMaintenanceMargin) ?? normalizeZero(position?.maintenanceMargin) ?? '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Cross Account Leverage</span>
                        <span className="text-white font-semibold">
                            {normalizeZero(position?.leverage) ?? crossLeverage ?? '—'}
                        </span>
                    </div>
                </div>
            </div>
            {/* Debug panel 
            {accountInfo && (
                <pre className="bg-backgroundlighthover text-xs text-white mt-2 p-2 rounded max-h-48 overflow-auto">
                    {JSON.stringify(accountInfo, null, 2)}
                </pre>
            )}
            */}
        </>
    );
}

export default AccountInfoPanel;