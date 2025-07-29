import { useState } from 'react';
import { useZustandStore } from '../../../Zustandstore/useStore.js';
import Modal from '../../CommonUIs/modal/modal.jsx';
import Button from '../../CommonUIs/Button';
import NativeSlider from '../../CommonUIs/slider';
import ModalModButton from '../../CommonUIs/modalmodbutton.jsx';
import '../../../components/CommonUIs/slider.css';

const MIN_SLIDER = 1;
const MAX_SLIDER = 20;

export default function LeveragePanel() {
  const [open, setOpen] = useState(false);
  const leverage = useZustandStore(s => s.leverage);
  const setLeverage = useZustandStore(s => s.setLeverage);

  return (
    <>
      <ModalModButton onClick={() => setOpen(true)}>
        {leverage}X
      </ModalModButton>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        width={380}
      >
        <div
          className="flex flex-col items-center gap-4"
          style={{
            background: 'var(--color-backgroundmid)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            minWidth: 320,
          }}
        >
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
    </>
  );
}