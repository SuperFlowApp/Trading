import { useZustandStore } from '../../Zustandstore/panelStore.js';
import { Modal } from 'antd';
import Button from '../CommonUIs/Button.jsx';
import NativeSlider from '../CommonUIs/slider.jsx';
import '../../components/CommonUIs/slider.css';

const MIN_SLIDER = 1;
const MAX_SLIDER = 20;

export default function LeveragePanel() {
  const leverage = useZustandStore(s => s.leverage);
  const setLeverage = useZustandStore(s => s.setLeverage);
  const isOpen = useZustandStore(s => s.isLeveragePanelOpen);
  const setOpen = useZustandStore(s => s.setLeveragePanelOpen);

  return (
    <Modal
      open={isOpen}
      onCancel={() => setOpen(false)}
      footer={null}
      closable={false}
      centered
      styles={{
        body: {
          background: 'var(--color-backgroundmid)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          minWidth: 320,
        }
      }}
      width={380}
      title={null}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-full flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Set Leverage</h2>
        </div>
        <NativeSlider
          min={MIN_SLIDER}
          max={MAX_SLIDER}
          step={1}
          value={leverage}
          onChange={(_, value) => setLeverage(Number(value))}
        />
        <div className="text-2xl font-bold text-primary2">{leverage}X</div>
        <Button
          type="primary"
          className="mt-2"
          onClick={() => setOpen(false)}
          block
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}