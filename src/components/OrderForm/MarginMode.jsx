import usePanelStore from '../../Zustandstore/panelStore';

export default function MarginMode() {
    const isOpen = usePanelStore(s => s.isMarginModePanelOpen);
    const setOpen = usePanelStore(s => s.setMarginModePanelOpen);
    const marginMode = usePanelStore(s => s.marginMode);
    const setMarginMode = usePanelStore(s => s.setMarginMode);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="modal-container p-6 min-w-[260px] shadow-lg flex flex-col gap-4">
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
                            // Hide the checkmark/tick
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
                            // Hide the checkmark/tick
                            backgroundImage: "none"
                        }}
                    />
                    <span className="text-white">Isolated</span>
                </label>
                <div className="flex gap-2 mt-4">
                    <button
                        className="flex-1 py-2 rounded bg-primary2 text-black font-semibold"
                        onClick={() => setOpen(false)}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}