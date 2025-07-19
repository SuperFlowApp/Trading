import usePanelStore from '../../store/panelStore';

export default function MarginMode() {
  const isOpen = usePanelStore(s => s.isMarginModePanelOpen);
  const setOpen = usePanelStore(s => s.setMarginModePanelOpen);
  const marginMode = usePanelStore(s => s.marginMode);
  const setMarginMode = usePanelStore(s => s.setMarginMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-backgrounddark rounded-lg p-6 min-w-[260px] shadow-lg flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white mb-2">Select Margin Mode</h2>
        <button
          className={`py-2 px-4 rounded-md font-semibold ${marginMode === "Cross" ? "bg-primary2 text-black" : "bg-background text-white border border-secondary2"}`}
          onClick={() => setMarginMode("Cross")}
        >
          Cross
        </button>
        <button
          className={`py-2 px-4 rounded-md font-semibold ${marginMode === "Isolated" ? "bg-primary2 text-black" : "bg-background text-white border border-secondary2"}`}
          onClick={() => setMarginMode("Isolated")}
        >
          Isolated
        </button>
        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 py-2 rounded bg-primary2 text-black font-semibold"
            onClick={() => setOpen(false)}
          >
            Confirm
          </button>
          <button
            className="flex-1 py-2 rounded bg-secondary2 text-black font-semibold"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}