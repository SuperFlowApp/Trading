import { useState } from 'react';
import Modal from '../../CommonUIs/modal/modal.jsx';
import Button from '../../CommonUIs/Button';
import NativeSlider from '../../CommonUIs/slider';
import ModalModButton from '../../CommonUIs/modalmodbutton.jsx';
import '../../../components/CommonUIs/slider.css';

export default function LeveragePanel() {
  const [open, setOpen] = useState(false);
  const [leverage, setLeverage] = useState(10); // Add leverage state

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
            min={1}
            max={20}
            step={1}
            value={leverage}
            onChange={e => setLeverage(Number(e.target.value))} // Fix: extract value
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