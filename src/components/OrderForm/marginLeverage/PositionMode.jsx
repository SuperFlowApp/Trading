import { useState } from 'react';
import Modal from '../../CommonUIs/modal/modal';
import Button from '../../CommonUIs/Button';
import ModalModButton from '../../CommonUIs/modalmodbutton.jsx';
import {selectedPairStore} from '../../../Zustandstore/userInputStore.js'

export default function PositionMode() {
  const [open, setOpen] = useState(false);
  const selectedPair = selectedPairStore(s => s.selectedPair);

  return (
    <>
      <ModalModButton onClick={() => setOpen(true)}>
        One-way
      </ModalModButton>
      <Modal
        open={open}
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
    </>
  );
}