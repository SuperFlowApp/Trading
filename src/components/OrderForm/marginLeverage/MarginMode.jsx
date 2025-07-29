import { useEffect, useState } from 'react';
import { useZustandStore, marketsData } from '../../../Zustandstore/panelStore.js';
import Modal from '../../CommonUIs/modal/modal.jsx';
import Button from '../../CommonUIs/Button.jsx';
import ModalModButton from '../../CommonUIs/modalmodbutton.jsx';
import {selectedPairStore} from '../../../Zustandstore/userInputStore.js'


export default function MarginMode() {
    const [open, setOpen] = useState(false);
    const marginMode = useZustandStore(s => s.marginMode);
    const setMarginMode = useZustandStore(s => s.setMarginMode);
    const allMarketData = marketsData(s => s.allMarketData);
    const selectedPair = selectedPairStore(s => s.selectedPair);

    // Find the current market object for the selected pair
    const currentMarket = allMarketData.find(
        mkt => mkt.base === selectedPair && mkt.type === "futures"
    );

    // Determine available margin modes
    const availableModes = [];
    if (currentMarket?.marginModes?.cross) availableModes.push("Cross");
    if (currentMarket?.marginModes?.isolated) availableModes.push("Isolated");

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
    }, [selectedPair, availableModes.join(','), setMarginMode, marginMode]);

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
                                type="checkbox"
                                checked={marginMode === mode}
                                onChange={() => setMarginMode(mode)}
                                className="check-box"
                                style={{
                                    backgroundImage: "none"
                                }}
                            />
                            <span className="text-white">{mode}</span>
                        </label>
                    ))}
                    <div className="flex gap-2 mt-4">
                        <Button
                            type="primary"
                            className="flex-1 py-2"
                            onClick={() => setOpen(false)}
                            block
                        >
                            Confirm
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}