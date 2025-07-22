import { useState, useEffect } from 'react';
import { useAuth, useAuthFetch } from '../../context/Authentication.jsx'; // <-- Import useAuthFetch

function AccountInfoPanel() {
    const { token, logout } = useAuth(); // <-- Get logout from context
    const authFetch = useAuthFetch();    // <-- Use authFetch for authenticated requests
    const [accountInfo, setAccountInfo] = useState(null);
    const [accountInfoError, setAccountInfoError] = useState('');

    // Fetch account information function
    const fetchAccountInfo = async () => {
        if (!token) {
            setAccountInfo(null);
            setAccountInfoError('');
            return;
        }
        try {
            const response = await authFetch('https://fastify-serverless-function-rimj.onrender.com/api/account-information-direct', {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                },
            });
            if (response.status === 401) {
                logout();
                setAccountInfo(null);
                setAccountInfoError('Session expired. Please log in again.');
                return;
            }
            if (!response.ok) {
                throw new Error('Failed to fetch account information');
            }
            const data = await response.json();
            setAccountInfo(data);
            setAccountInfoError('');
        } catch (err) {
            setAccountInfo(null);
            setAccountInfoError('Failed to fetch account information.');
        }
    };

    // Fetch on mount and every 5 seconds
    useEffect(() => {
        fetchAccountInfo();
        if (!token) return;
        const interval = setInterval(fetchAccountInfo, 5000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div className="flex flex-col bg-backgroundmid rounded-md  p-2 min-w-0 overflow-hidden">
            {accountInfoError && (
                <div className="text-red-400 text-xs">{accountInfoError}</div>
            )}
            <div className="text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="text-liquidwhite">Account Equity</span>
                    <span className="text-white font-semibold">
                        {token && accountInfo
                            ? `$${parseFloat(accountInfo.availableBalance || 0).toLocaleString(
                                undefined,
                                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                            )}`
                            : "--"}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidwhite">Balance</span>
                    <span className="text-white font-semibold">
                        {token && accountInfo
                            ? `$${parseFloat(accountInfo.crossBalance || 0).toLocaleString(
                                undefined,
                                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                            )}`
                            : "--"}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidwhite">Unrealized PNL</span>
                    <span className="text-white font-semibold">
                        {token && accountInfo
                            ? `$${parseFloat(accountInfo.UnrealizedPnl || 0).toLocaleString(
                                undefined,
                                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                            )}`
                            : "--"}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidwhite">Maintenance Margin</span>
                    <span className="text-white font-semibold">
                        {token && accountInfo
                            ? `$${parseFloat(
                                accountInfo.positions?.[0]?.maintenanceMargin || 0
                            ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}`
                            : "--"}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidwhite">Cross Account Leverage</span>
                    <span className="text-white font-semibold">
                        {token && accountInfo
                            ? `${accountInfo.positions?.[0]?.leverage || 0}x`
                            : "--"}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default AccountInfoPanel;