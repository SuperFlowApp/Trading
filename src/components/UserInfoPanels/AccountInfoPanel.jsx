import { useState, useEffect } from 'react';

function AccountInfoPanel() {
    const [accountInfoError, setAccountInfoError] = useState('');




    return (
        <div className="flex flex-col bg-backgroundmid rounded-md  p-2 min-w-0 overflow-hidden">
            {accountInfoError && (
                <div className="text-red-400 text-xs">{accountInfoError}</div>
            )}
            <div className="text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="text-liquidwhite">Account Equity</span>
                    <span className="text-white font-semibold">
                       
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidwhite">Balance</span>
                    <span className="text-white font-semibold">
                        
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidwhite">Unrealized PNL</span>
                    <span className="text-white font-semibold">
                        
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidwhite">Maintenance Margin</span>
                    <span className="text-white font-semibold">
                        
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-liquidwhite">Cross Account Leverage</span>
                    <span className="text-white font-semibold">
                        
                    </span>
                </div>
            </div>
        </div>
    );
}

export default AccountInfoPanel;