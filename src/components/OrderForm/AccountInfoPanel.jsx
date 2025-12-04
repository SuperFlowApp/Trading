import { useState, useEffect } from 'react';
import { formatPrice } from '../../utils/priceFormater';
import { useAuthKey } from "../../contexts/AuthKeyContext";
import { useZustandStore } from '../../Zustandstore/useStore.js';
import { fetchAccountInformation } from '../../hooks/useAccountInformationAPI';
import Button from '../CommonUIs/Button.jsx';

// Helper to convert "0E-8", "0E-16", etc. to "0"
function normalizeZero(val) {
    if (typeof val === "string" && /^0(\.0*)?E-\d+$/.test(val)) return "0";
    return val;
}

// Helper to get color class for PNL values
function getPnlClass(val) {
    const num = Number(val);
    if (isNaN(num)) return "text-liquidGray";
    if (num > 0) return "text-liquidGreen";
    if (num < 0) return "text-liquidRed";
    return "text-liquidGray";
}

// Helper to format with $ prefix
function formatWithDollar(val) {
    if (val == null || isNaN(Number(val))) return '—';
    return `$${formatPrice(val)}`;
}

function AccountInfoPanel() {
    const [accountInfoError, setAccountInfoError] = useState('');
    const [accountInfo, setAccountInfo] = useState(null);
    const { authKey, setAuthKey } = useAuthKey();
    const setAccountInfoGlobal = useZustandStore(s => s.setAccountInfo);

    // Listen for authKey changes (multi-tab support)
    useEffect(() => {
        const handler = () => {
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
            setAccountInfoGlobal(null);
            return;
        }
        const fetchInfo = async () => {
            setAccountInfoError('');
            try {
                const { ok, status, data } = await fetchAccountInformation(authKey);
                if (status === 401) {
                    setAuthKey(null);
                    setAccountInfo(null);
                    setAccountInfoGlobal(null);
                } else if (!ok) {
                    setAccountInfo(null);
                    setAccountInfoGlobal(null);
                } else {
                    setAccountInfo(data);
                    setAccountInfoGlobal(data);
                }
            } catch (e) {
                setAccountInfo(null);
            }
        };
        fetchInfo();
    }, [authKey, setAuthKey, setAccountInfoGlobal]);

    // Poll for account info every 3 seconds if authKey is present
    useEffect(() => {
        if (!authKey) {
            setAccountInfo(null);
            setAccountInfoError('');
            return;
        }

        let isMounted = true;

        const fetchInfo = async () => {
            setAccountInfoError('');
            try {
                const { ok, status, data } = await fetchAccountInformation(authKey);
                if (!isMounted) return;
                if (status === 401) {
                    setAuthKey(null);
                    setAccountInfo(null);
                } else if (!ok) {
                    setAccountInfo(null);
                } else {
                    setAccountInfo(data);
                }
            } catch (e) {
                if (isMounted) setAccountInfo(null);
            }
        };

        fetchInfo(); // initial fetch

        const interval = setInterval(fetchInfo, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [authKey, setAuthKey]);

    return (
        <div className="flex flex-col bg-boxbackground rounded-md p-2 w-[100%] overflow-hidden border-[1px] border-borderscolor">
            {/* Buttons */}
            <div className="flex flex-col gap-2 mb-2">
                <Button type="secondary" block>Deposit</Button>
                <Button type="primary" block>Withdraw</Button>
            </div>

            <div className="pt-2 border-t border-liquiddarkgray ...">


            </div>
            {/* Account Info */}
            <div className="text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="text-liquidwhite py-2">Account overview</span>
                    <span></span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidlightergray">Wallet Balance</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.walletBalance != null
                            ? formatWithDollar(normalizeZero(accountInfo.walletBalance))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidlightergray">Realized PNL</span>
                    <span className={`font-semibold ${getPnlClass(normalizeZero(accountInfo?.realizedPnl))}`}>
                        {accountInfo?.realizedPnl != null
                            ? formatWithDollar(normalizeZero(accountInfo.realizedPnl))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidlightergray">Unrealized PNL</span>
                    <span className={`font-semibold ${getPnlClass(normalizeZero(accountInfo?.upnl))}`}>
                        {accountInfo?.upnl != null
                            ? formatWithDollar(normalizeZero(accountInfo.upnl))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidlightergray">Available For Order</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.availableForOrder != null
                            ? formatWithDollar(normalizeZero(accountInfo.availableForOrder))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidlightergray">Margin Balance</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.marginBalance != null
                            ? formatWithDollar(normalizeZero(accountInfo.marginBalance))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidlightergray">Cross Pending Initial Margin</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.crossPendingInitialMargin != null
                            ? formatWithDollar(normalizeZero(accountInfo.crossPendingInitialMargin))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidlightergray">Cross Maintenance Margin</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.crossMaintenanceMargin != null
                            ? formatWithDollar(normalizeZero(accountInfo.crossMaintenanceMargin))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidlightergray">Cross Initial Margin</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.crossInitialMargin != null
                            ? formatWithDollar(normalizeZero(accountInfo.crossInitialMargin))
                            : '—'}
                    </span>
                </div>


                <div className="flex justify-between">
                    <span className="text-liquidlightergray">Paid Fee</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.paidFee != null
                            ? formatWithDollar(normalizeZero(accountInfo.paidFee))
                            : '—'}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default AccountInfoPanel;