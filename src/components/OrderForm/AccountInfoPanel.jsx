import { useEffect, useState } from 'react';
import { useAccountInfoStore } from '../../hooks/ZustAccountInfo';
import { formatPrice } from '../../utils/priceFormater';
import Button from '../CommonUIs/Button.jsx';
import Cookies from "js-cookie"; // Make sure this is at the top

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
    const accountInfo = useAccountInfoStore(s => s.accountInfo);
    const updateAccountInfo = useAccountInfoStore(s => s.updateAccountInfo);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Listen for login state changes
        const handler = (e) => setIsLoggedIn(e.detail === true);
        window.addEventListener("userLoginStateChanged", handler);
        // Set initial state
        setIsLoggedIn(!!Cookies.get("authKey"));
        return () => window.removeEventListener("userLoginStateChanged", handler);
    }, []);

    useEffect(() => {
        let intervalId;
        if (isLoggedIn) {
            updateAccountInfo(); // Fetch immediately on login
            intervalId = setInterval(updateAccountInfo, 5000); // Fetch every 5 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isLoggedIn, updateAccountInfo]);

    return (
        <div className="flex flex-col bg-boxbackground rounded-md p-2 w-[100%] overflow-hidden border-[1px] border-borderscolor">
            {/* Buttons */}
            <div className="flex flex-col gap-2 mb-2">
                <Button type="secondary" block>Deposit</Button>
                <Button type="primary" block>Withdraw</Button>
            </div>
            <div className="pt-2 border-t border-liquiddarkgray ..."></div>
            {/* Account Info */}
            <div className="text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="text-liquidwhite py-2">Account overview</span>
                    <span></span>
                </div>
                <div className="flex justify-between">
                    <span className="text-color_lighter_gray">Wallet Balance</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.walletBalance != null
                            ? formatWithDollar(normalizeZero(accountInfo.walletBalance))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-color_lighter_gray">Realized PNL</span>
                    <span className={`font-semibold ${getPnlClass(normalizeZero(accountInfo?.realizedPnl))}`}>
                        {accountInfo?.realizedPnl != null
                            ? formatWithDollar(normalizeZero(accountInfo.realizedPnl))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-color_lighter_gray">Unrealized PNL</span>
                    <span className={`font-semibold ${getPnlClass(normalizeZero(accountInfo?.upnl))}`}>
                        {accountInfo?.upnl != null
                            ? formatWithDollar(normalizeZero(accountInfo.upnl))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-color_lighter_gray">Available For Order</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.availableForOrder != null
                            ? formatWithDollar(normalizeZero(accountInfo.availableForOrder))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-color_lighter_gray">Margin Balance</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.marginBalance != null
                            ? formatWithDollar(normalizeZero(accountInfo.marginBalance))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-color_lighter_gray">Cross Pending Initial Margin</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.crossPendingInitialMargin != null
                            ? formatWithDollar(normalizeZero(accountInfo.crossPendingInitialMargin))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-color_lighter_gray">Cross Maintenance Margin</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.crossMaintenanceMargin != null
                            ? formatWithDollar(normalizeZero(accountInfo.crossMaintenanceMargin))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-color_lighter_gray">Cross Initial Margin</span>
                    <span className="text-white font-semibold">
                        {accountInfo?.crossInitialMargin != null
                            ? formatWithDollar(normalizeZero(accountInfo.crossInitialMargin))
                            : '—'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-color_lighter_gray">Paid Fee</span>
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