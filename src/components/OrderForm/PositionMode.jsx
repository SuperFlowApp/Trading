import usePanelStore from '../../Zustandstore/panelStore';

export default function PositionMode() {
  const isOpen = usePanelStore(s => s.isPositionModePanelOpen);
  const setOpen = usePanelStore(s => s.setPositionModePanelOpen);
  const selectedPair = usePanelStore(s => s.selectedPair);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-backgrounddark rounded-lg p-6 min-w-[320px] shadow-lg flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white mb-2">
          {selectedPair ? `${selectedPair}-USD Position Mode` : 'Position Mode'}
        </h2>
        <div className="text-white text-sm mb-4">
          Your position on this coin is either <b>short</b> or <b>long</b>.<br />
          Orders specify a size and direction only; there is no distinction between open and close when placing an order.
        </div>
        <button
          className="mt-6 py-2 rounded bg-primary2 text-black font-semibold"
          onClick={() => setOpen(false)}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}