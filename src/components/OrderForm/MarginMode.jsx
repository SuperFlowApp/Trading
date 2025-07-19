import usePanelStore from '../../Zustandstore/panelStore';
import { Modal, Button } from 'antd';

export default function MarginMode() {
    const isOpen = usePanelStore(s => s.isMarginModePanelOpen);
    const setOpen = usePanelStore(s => s.setMarginModePanelOpen);
    const marginMode = usePanelStore(s => s.marginMode);
    const setMarginMode = usePanelStore(s => s.setMarginMode);

    return (
        <Modal
            open={isOpen}
            onCancel={() => setOpen(false)}
            footer={null}
            closable={false}
            centered
            bodyStyle={{
                background: 'var(--color-backgrounddark)',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                minWidth: 260,
            }}
            maskStyle={{ background: 'rgba(0,0,0,0.4)' }}
            width={340}
            title={null}
        >
            <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-white mb-2">Select Margin Mode</h2>
                <label
                    className={`flex items-center gap-2 py-2 px-4 rounded-md font-semibold cursor-pointer transition-colors ${
                        marginMode === "Cross" ? "bg-primary2/20" : "bg-background"
                    }`}
                >
                    <input
                        type="checkbox"
                        checked={marginMode === "Cross"}
                        onChange={() => setMarginMode("Cross")}
                        className="check-box"
                        style={{
                            backgroundImage: "none"
                        }}
                    />
                    <span className="text-white">Cross</span>
                </label>
                <label
                    className={`flex items-center gap-2 py-2 px-4 rounded-md font-semibold cursor-pointer transition-colors ${
                        marginMode === "Isolated" ? "bg-primary2/20" : "bg-background"
                    }`}
                >
                    <input
                        type="checkbox"
                        checked={marginMode === "Isolated"}
                        onChange={() => setMarginMode("Isolated")}
                        className="check-box"
                        style={{
                            backgroundImage: "none"
                        }}
                    />
                    <span className="text-white">Isolated</span>
                </label>
                <div className="flex gap-2 mt-4">
                    <Button
                        type="primary"
                        className="flex-1 py-2 !bg-primary2 !text-black !rounded font-semibold hover:!bg-primary2/80"
                        style={{
                            background: 'var(--color-primary2)',
                            color: 'black',
                            border: 'none',
                            fontWeight: 600,
                            borderRadius: 8,
                        }}
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