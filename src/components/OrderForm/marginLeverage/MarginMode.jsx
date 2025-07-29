import { useEffect, useState } from 'react';
import { marketsData } from '../../../Zustandstore/marketsDataStore.js';
import Modal from '../../CommonUIs/modal/modal.jsx';
import Button from '../../CommonUIs/Button.jsx';
import ModalModButton from '../../CommonUIs/modalmodbutton.jsx';
import { selectedPairStore } from '../../../Zustandstore/userOrderStore.js';
import { getAuthKey } from '../../../utils/authKeyStorage.jsx';

export default function MarginMode() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [blink, setBlink] = useState(""); // "success" | "error" | ""
    const [errorMsg, setErrorMsg] = useState("");

    // Fetch all market data and selected pair from their respective stores
    const allMarketData = marketsData(s => s.allMarketData);
    const selectedPair = selectedPairStore(s => s.selectedPair);
    const authKey = getAuthKey();

    // Find the current market object for the selected pair
    const currentMarket = allMarketData.find(
        mkt => mkt.base === selectedPair && mkt.type === "futures"
    );

    // Extract available margin modes for the selected pair
    const availableModes = [];
    if (currentMarket?.marginModes?.cross) availableModes.push("Cross");
    if (currentMarket?.marginModes?.isolated) availableModes.push("Isolated");

    // Local state for margin mode selection
    const [marginMode, setMarginMode] = useState(availableModes[0] || 'Cross');

    // Auto-select margin mode if only one is available or current is not available
    useEffect(() => {
        if (availableModes.length === 1 && marginMode !== availableModes[0]) {
            setMarginMode(availableModes[0]);
        } else if (
            availableModes.length > 0 &&
            !availableModes.includes(marginMode)
        ) {
            setMarginMode(availableModes[0]);
        }
    }, [selectedPair, availableModes.join(','), marginMode]);

    // Handle confirm/connect button
    const handleConfirm = async () => {
        setErrorMsg("");
        if (!authKey) {
            setOpen(false);
            return;
        }
        setLoading(true);
        try {
            const payload = {
                symbol: currentMarket.symbol,
                marginMode: marginMode.toUpperCase(),
            };
            const res = await fetch("https://fastify-serverless-function-rimj.onrender.com/api/margin-mode", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authKey}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            console.log("Received response:", res.status, data);

            if (res.status === 200) {
                setOpen(false);
            } else {
                setBlink("error");
                setErrorMsg(data?.message || "Failed to set margin mode");
                setTimeout(() => setBlink(""), 400);
            }
        } catch (e) {
            setBlink("error");
            setErrorMsg("Network error");
            setTimeout(() => setBlink(""), 400);
        } finally {
            setLoading(false);
        }
    };

    // Modal content style if not connected
    const modalStyle = !authKey
        ? { opacity: 0.5, pointerEvents: "none", filter: "grayscale(1)" }
        : {};

    return (
        <>
            <ModalModButton onClick={() => setOpen(true)}>
                {marginMode}
            </ModalModButton>
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                width={340}
            >
                <div
                    style={{
                        background: 'var(--color-backgroundmid)',
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        minWidth: 260,
                        ...modalStyle,
                    }}
                    className="flex flex-col gap-4"
                >
                    <h2 className="text-lg font-bold text-white mb-2">Select Margin Mode</h2>
                    {availableModes.length === 0 && (
                        <div className="text-red-400">No margin modes available for this pair.</div>
                    )}
                    {availableModes.map(mode => (
                        <label
                            key={mode}
                            className={`flex items-center gap-2 py-2 px-4 rounded-md font-semibold cursor-pointer transition-colors`}
                        >
                            <input
                                type="radio"
                                name="marginMode"
                                checked={marginMode === mode}
                                onChange={() => setMarginMode(mode)}
                                className="check-box"
                                style={{
                                    backgroundImage: "none",
                                    backgroundColor: marginMode === mode ? undefined : "var(--color-backgroundmid)"
                                }}
                                disabled={!authKey}
                            />
                            <span className="text-white">{mode}</span>
                        </label>
                    ))}
                    <div className="flex gap-2 mt-4 flex-col">
                        <Button
                            type="primary"
                            className={`flex-1 py-2 transition-all ${blink === "success" ? "blink-success" : ""} ${blink === "error" ? "blink-error" : ""}`}
                            onClick={handleConfirm}
                            block
                            disabled={loading}
                        >
                            {!authKey ? "Connect" : loading ? "..." : "Confirm"}
                        </Button>
                        {blink === "error" && errorMsg && (
                            <div className="text-xs text-red-400 text-center mt-1">{errorMsg}</div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}