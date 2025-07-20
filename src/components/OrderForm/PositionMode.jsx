import usePanelStore from '../../Zustandstore/panelStore';
import { Modal } from 'antd';
import Button from '../CommonUIs/Button.jsx';

export default function PositionMode() {
  const isOpen = usePanelStore(s => s.isPositionModePanelOpen);
  const setOpen = usePanelStore(s => s.setPositionModePanelOpen);
  const selectedPair = usePanelStore(s => s.selectedPair);

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
        minWidth: 320,
      }}
      maskStyle={{ background: 'rgba(0,0,0,0.4)' }}
      width={380}
      title={null}
    >
      <div className="flex flex-col gap-4">
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