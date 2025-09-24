import { useState } from 'react';
import Modal from '../../CommonUIs/modal/modal';
import Button from '../../CommonUIs/Button';
import ModalModButton from '../../CommonUIs/modalmodbutton.jsx';
import { selectedPairStore } from '../../../Zustandstore/userOrderStore.js';
import { useAuthKey } from '../../../contexts/AuthKeyContext';
import { API_BASE_URL } from '../../../config/api';
import { useZustandStore } from '../../../Zustandstore/useStore';

export default function PositionMode() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blink, setBlink] = useState(""); // "success" | "error" | ""
  const [errorMsg, setErrorMsg] = useState("");
  const [positionMode, setPositionMode] = useState("ONE_WAY_MODE");
  const [confirmedPositionMode, setConfirmedPositionMode] = useState("ONE_WAY_MODE"); // <-- new state

  const selectedPair = selectedPairStore(s => s.selectedPair);
  const { authKey } = useAuthKey();
  
  // Get open orders state from Zustand
  const isOpenOrder = useZustandStore(s => s.isOpenOrder);

  // Modal content style if not connected or has open orders
  const modalStyle = !authKey || isOpenOrder
    ? { opacity: 0.5, pointerEvents: "none", filter: "grayscale(1)" }
    : {};

  // Handle confirm button
  const handleConfirm = async () => {
    setErrorMsg("");
    if (!authKey || isOpenOrder) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        mode: positionMode,
      };
      const res = await fetch(`${API_BASE_URL}/api/position-mode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authKey}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 200) {
        setConfirmedPositionMode(positionMode); // <-- update only on success
        setOpen(false);
      } else {
        setBlink("error");
        setErrorMsg(data?.error || data?.message || "Failed to set position mode");
        setTimeout(() => setBlink(""), 400);
      }
    } catch (e) {
      setBlink("error");
      setErrorMsg("Network error");
      setTimeout(() => setBlink(""), 400);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ModalModButton onClick={() => setOpen(true)}>
        {confirmedPositionMode === "ONE_WAY_MODE" ? "One-way" : "Hedge"}
      </ModalModButton>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        width={340}
      >
        <div
          style={{
            background: 'var(--color-backgroundmid)',
            borderRadius: '4',
            padding: '1.5rem',
            minWidth: 260,
            ...modalStyle,
          }}
          className="flex flex-col gap-4"
        >
          <h2 className="text-lg font-bold text-white mb-2">
            Select Position Mode
          </h2>
          
          {/* Show notification when there are open orders */}
          {isOpenOrder && authKey && (
            <div className="bg-yellow-600/20 border border-yellow-600/40 rounded p-3 text-yellow-200 text-sm">
              Since you have open orders, you can't change position mode.
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              type={positionMode === "ONE_WAY_MODE" ? "primary" : "default"}
              className="flex-1"
              onClick={() => setPositionMode("ONE_WAY_MODE")}
              disabled={!authKey || loading || isOpenOrder}
            >
              One-way
            </Button>
            <Button
              type={positionMode === "HEDGE_MODE" ? "primary" : "default"}
              className="flex-1"
              onClick={() => setPositionMode("HEDGE_MODE")}
              disabled={!authKey || loading || isOpenOrder}
            >
              Hedge
            </Button>
          </div>
          <div className="flex gap-2 mt-4 flex-col">
            <Button
              type="primary"
              className={`flex-1 py-2 transition-all ${blink === "success" ? "blink-success" : ""} ${blink === "error" ? "blink-error" : ""}`}
              onClick={handleConfirm}
              block
              disabled={loading || isOpenOrder}
            >
              {!authKey ? "Connect" : isOpenOrder ? "Can't Change" : loading ? "..." : "Confirm"}
            </Button>
            {blink === "error" && errorMsg && (
              <div className="text-xs text-red-400 text-center mt-1">{errorMsg}</div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}