import { useState, useEffect } from 'react';
import { getAuthKey } from '../../utils/authKeyStorage.jsx';

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
                const res = await fetch('http://localhost:3001/api/account-information', {
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

    return (
        <>
            <div className="flex flex-col bg-backgroundmid rounded-md  p-2 min-w-0 overflow-hidden">
                {accountInfoError && (
                    <div className="text-red-400 text-xs">{accountInfoError}</div>
                )}
                <div className="text-xs flex flex-col gap-2">
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Account Equity</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.marginBalance ?? ''}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Balance</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.walletBalance ?? ''}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Unrealized PNL</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.upnl ?? ''}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Maintenance Margin</span>
                        <span className="text-white font-semibold">
                            {accountInfo?.crossMaintenanceMargin ?? ''}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-liquidwhite">Cross Account Leverage</span>
                        <span className="text-white font-semibold">
                            {/* Example: show leverage from first cross position */}
                            {accountInfo?.positions?.find(p => p.cross)?.leverage ?? ''}
                        </span>
                    </div>
                </div>
            </div>
            {/* Debug panel */}
            {accountInfo && (
                <pre className="bg-backgroundlighthover text-xs text-white mt-2 p-2 rounded max-h-48 overflow-auto">
                    {JSON.stringify(accountInfo, null, 2)}
                </pre>
            )}
        </>
    );
}

export default AccountInfoPanel;