import { useState } from 'react';
import Cookies from "js-cookie";
import Modal from '../../CommonUIs/modal/modal';
import Button from '../../CommonUIs/Button';
import ModalModButton from '../../CommonUIs/modalmodbutton.jsx';
import { API_BASE_URL } from '../../../config/api';
import { useZustandStore } from '../../../Zustandstore/useStore';
import useAuthStore from '../../../store/authStore';

export default function PositionMode() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [positionMode, setPositionMode] = useState("ONE_WAY_MODE");

  const isLoggedIn = useAuthStore(state => state.isLoggedIn);

  const accountInfo = useZustandStore(s => s.accountInfo);

  // Use positionMode from accountInfo if available
  const confirmedPositionMode = accountInfo?.positionMode || "ONE_WAY_MODE";

  // Modal content style if not connected
  const modalStyle = !isLoggedIn
    ? { opacity: 0.5, pointerEvents: "none", filter: "grayscale(1)" }
    : {};

  // Handle confirm button
  const handleConfirm = async () => {
    setErrorMsg("");
    if (!isLoggedIn) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        mode: positionMode,
      };
      const res = await fetch(`https://fastify-serverless-function-ymut.onrender.com/api/position-mode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Cookies.get("authKey")}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 200) {
        setOpen(false);
      } else {
        setErrorMsg(data?.error || data?.message || "Failed to set position mode");
        setTimeout(() => setErrorMsg(""), 10000); // Hide message after 3s
      }
    } catch (e) {
      setErrorMsg("Network error");
      setTimeout(() => setErrorMsg(""), 10000); // Hide message after 3s
    } finally {
      setLoading(false);
    }
  };

  // Helper for green border if selected (use positionMode for highlight)
  const getButtonStyle = (mode) => ({
    border: positionMode === mode ? '1px solid #00eaff' : '2px solid transparent',
    transition: 'border 0.2s, box-shadow 0.2s',
  });

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
            background: 'var(--color-boxbackground)',
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
          
          <div className="flex gap-3">
            <Button
              type={positionMode === "ONE_WAY_MODE" ? "primary" : "default"}
              className="flex-1"
              style={getButtonStyle("ONE_WAY_MODE")}
              onClick={() => setPositionMode("ONE_WAY_MODE")}
              disabled={!isLoggedIn || loading}
            >
              One-way
            </Button>
            <Button
              type={positionMode === "HEDGE_MODE" ? "primary" : "default"}
              className="flex-1"
              style={getButtonStyle("HEDGE_MODE")}
              onClick={() => setPositionMode("HEDGE_MODE")}
              disabled={!isLoggedIn || loading}
            >
              Hedge
            </Button>
          </div>
          <div className="flex gap-2 mt-4 flex-col">
            <Button
              type="primary"
              className="flex-1 py-2 transition-all"
              onClick={handleConfirm}
              block
              disabled={loading}
            >
              {!isLoggedIn ? "Connect" : loading ? "..." : "Confirm"}
            </Button>
            {errorMsg && (
              <div className="text-xs text-red-400 text-center mt-1">{errorMsg}</div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}