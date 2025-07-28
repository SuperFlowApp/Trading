import { useZustandStore } from '../../../Zustandstore/panelStore';
import Modal from '../../CommonUIs/modal/modal'; // Use native modal
import Button from '../../CommonUIs/Button';

export default function PositionMode() {
  const isOpen = useZustandStore(s => s.isPositionModePanelOpen);
  const setOpen = useZustandStore(s => s.setPositionModePanelOpen);
  const selectedPair = useZustandStore(s => s.selectedPair);

  return (
    <Modal
      open={isOpen}
      onClose={() => setOpen(false)}
      width={380}
    >
      <div
        className="flex flex-col gap-4"
        style={{
          background: 'var(--color-backgroundmid)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          minWidth: 320,
        }}
      >
        <h2 className="text-lg font-bold text-white mb-2">
          {selectedPair ? `${selectedPair}-USD Position Mode` : 'Position Mode'}
        </h2>
        <div className="text-white text-sm mb-4">
          Your position on this coin is either <b>short</b> or <b>long</b>.<br />
          Orders specify a size and direction only; there is no distinction between open and close when placing an order.
        </div>
        <Button
          type="primary"
          className="mt-6"
          onClick={() => setOpen(false)}
          block
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}