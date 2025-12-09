import { useEffect, useState } from 'react';
import { formatPrice } from '../../utils/priceFormater';
import Cookies from 'js-cookie';
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
    const [accountInfo, setAccountInfo] = useState(() => {
        try {
            return JSON.parse(Cookies.get("accountInfo") || "null");
        } catch {
            return null;
        }
    });
    const [authKey, setAuthKey] = useState(Cookies.get("authKey"));

    // Listen for authKey changes (login/logout)
    useEffect(() => {
        const handler = () => setAuthKey(Cookies.get("authKey"));
        window.addEventListener("authKeyChanged", handler);
        return () => window.removeEventListener("authKeyChanged", handler);
    }, []);

    // Fetch and store account info in cookie and state every 5 seconds
    useEffect(() => {
        if (!authKey) {
            Cookies.remove("accountInfo");
            setAccountInfo(null);
            return;
        }

        let isMounted = true;

        const fetchAndUpdate = async () => {
            try {
                const { ok, status, data } = await fetchAccountInformation(authKey);
                if (status === 401) {
                    Cookies.remove("authKey");
                    Cookies.remove("username");
                    Cookies.remove("accountInfo");
                    setAccountInfo(null);
                    window.location.reload();
                    return;
                } else if (!ok) {
                    Cookies.remove("accountInfo");
                    setAccountInfo(null);
                } else {
                    Cookies.set("accountInfo", JSON.stringify(data), { expires: 1 });
                    if (isMounted) setAccountInfo(data);
                }
            } catch (e) {
                Cookies.remove("accountInfo");
                if (isMounted) setAccountInfo(null);
            }
        };

        fetchAndUpdate(); // initial fetch

        const interval = setInterval(fetchAndUpdate, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [authKey]);

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