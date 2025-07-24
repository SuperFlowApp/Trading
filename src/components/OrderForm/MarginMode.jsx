import { useEffect } from 'react';
import useZustandStore from '../../Zustandstore/panelStore';
import { Modal } from 'antd';
import Button from '../CommonUIs/Button.jsx';

export default function MarginMode() {
    const isOpen = useZustandStore(s => s.isMarginModePanelOpen);
    const setOpen = useZustandStore(s => s.setMarginModePanelOpen);
    const marginMode = useZustandStore(s => s.marginMode);
    const setMarginMode = useZustandStore(s => s.setMarginMode);
    const allMarketData = useZustandStore(s => s.allMarketData);
    const selectedPair = useZustandStore(s => s.selectedPair);

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
        <Modal
            open={isOpen}
            onCancel={() => setOpen(false)}
            footer={null}
            closable={false}
            centered
            styles={{
                body: {
                    background: 'var(--color-backgrounddark)',
                    borderRadius: '0.5rem',
                    padding: '1.5rem',
                    minWidth: 260,
                }
            }}
            width={340}
            title={null}
        >
            <div className="flex flex-col gap-4">
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
    );
}