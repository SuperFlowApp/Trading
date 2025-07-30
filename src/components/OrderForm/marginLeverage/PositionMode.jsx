import { useState } from 'react';
import Modal from '../../CommonUIs/modal/modal';
import Button from '../../CommonUIs/Button';
import ModalModButton from '../../CommonUIs/modalmodbutton.jsx';
import { selectedPairStore } from '../../../Zustandstore/userOrderStore.js';
import { getAuthKey } from '../../../utils/authKeyStorage.jsx';

export default function PositionMode() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blink, setBlink] = useState(""); // "success" | "error" | ""
  const [errorMsg, setErrorMsg] = useState("");
  const [positionMode, setPositionMode] = useState("ONE_WAY_MODE");

  const selectedPair = selectedPairStore(s => s.selectedPair);
  const authKey = getAuthKey();

  // Modal content style if not connected
  const modalStyle = !authKey
    ? { opacity: 0.5, pointerEvents: "none", filter: "grayscale(1)" }
    : {};

  // Handle confirm button
  const handleConfirm = async () => {
    setErrorMsg("");
    if (!authKey) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        mode: positionMode,
      };
      const res = await fetch("https://fastify-serverless-function-rimj.onrender.com/api/position-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authKey}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 200) {
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
        {positionMode === "ONE_WAY_MODE" ? "One-way" : "Hedge"}
      </ModalModButton>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        width={340}
      >
        <div
          style={{
            background: 'var(--color-backgroundmid)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            minWidth: 260,
            ...modalStyle,
          }}
          className="flex flex-col gap-4"
        >
          <h2 className="text-lg font-bold text-white mb-2">
            Select Position Mode
          </h2>
          <div className="flex gap-3">
            <Button
              type={positionMode === "ONE_WAY_MODE" ? "primary" : "default"}
              className="flex-1"
              onClick={() => setPositionMode("ONE_WAY_MODE")}
              disabled={!authKey || loading}
            >
              One-way
            </Button>
            <Button
              type={positionMode === "HEDGE_MODE" ? "primary" : "default"}
              className="flex-1"
              onClick={() => setPositionMode("HEDGE_MODE")}
              disabled={!authKey || loading}
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
              disabled={loading}
            >
              {!authKey ? "Connect" : loading ? "..." : "Confirm"}
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