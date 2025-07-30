import { useState, useEffect } from 'react';
import Modal from '../../CommonUIs/modal/modal.jsx';
import Button from '../../CommonUIs/Button';
import NativeSlider from '../../CommonUIs/slider';
import ModalModButton from '../../CommonUIs/modalmodbutton.jsx';
import '../../../components/CommonUIs/slider.css';
import { getAuthKey } from '../../../utils/authKeyStorage.jsx';

// Import Zustand stores
import { useZustandStore } from '../../../Zustandstore/useStore';
import { orderFormStore } from '../../../Zustandstore/userOrderStore';
import { marketsData } from '../../../Zustandstore/marketsDataStore';

export default function LeveragePanel() {
  const [open, setOpen] = useState(false);
  const [leverage, setLeverage] = useState(10);
  const [confirmedLeverage, setConfirmedLeverage] = useState(10); // <-- new state
  const [loading, setLoading] = useState(false);
  const [blink, setBlink] = useState(""); // "success" | "error" | ""
  const [errorMsg, setErrorMsg] = useState("");

  // Zustand selectors
  const currentNotional = useZustandStore(s => s.currentNotional);
  const selectedSymbol = orderFormStore(s => s.OrderFormState.symbol); // e.g. "BTCUSDT"
  const allMarketData = marketsData(s => s.allMarketData);

  // Find market for selected symbol
  const market = allMarketData?.find(m => m.symbol === selectedSymbol);

  // Find margin tier for current notional
  let maxLeverage = 1;
  let tierMsg = '';
  if (market && Array.isArray(market.marginTiers)) {
    const notional = Number(currentNotional) || 0;
    const tier = market.marginTiers.find(
      t => notional >= Number(t.minNotional) && notional < Number(t.maxNotional)
    );
    if (tier) {
      maxLeverage = tier.maxLeverage;
      tierMsg = `Tier: [${tier.minNotional} - ${tier.maxNotional}), Max Leverage: ${tier.maxLeverage}`;
    } else {
      // If notional is above all tiers, use last tier
      const lastTier = market.marginTiers[market.marginTiers.length - 1];
      if (lastTier && notional >= Number(lastTier.minNotional)) {
        maxLeverage = lastTier.maxLeverage;
        tierMsg = `Tier: [${lastTier.minNotional} - ${lastTier.maxNotional}), Max Leverage: ${lastTier.maxLeverage}`;
      }
    }
  }

  // --- Add this effect to sync leverage with maxLeverage ---
  // If leverage is above new maxLeverage, reset it to maxLeverage
  // If leverage is below 1, reset to 1
  useEffect(() => {
    setLeverage(prev => {
      if (prev > maxLeverage) return maxLeverage;
      if (prev < 1) return 1;
      return prev;
    });
  }, [maxLeverage]);

  const authKey = getAuthKey();

  // Modal content style if not connected
  const modalStyle = !authKey
    ? { opacity: 0.5, pointerEvents: "none", filter: "grayscale(1)" }
    : {};

  // Handle confirm/connect button
  const handleConfirm = async () => {
    setErrorMsg("");
    if (!authKey) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        symbol: selectedSymbol,
        leverage: leverage,
      };
      const res = await fetch("https://fastify-serverless-function-rimj.onrender.com/api/leverage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authKey}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("Leverage API response:", res.status, data); // <-- print response body
      if (res.status === 200) {
        setBlink("success");
        setConfirmedLeverage(leverage); // <-- update only on success
        setTimeout(() => {
          setBlink("");
          setOpen(false);
        }, 400);
      } else {
        setBlink("error");
        setErrorMsg(data?.message || "Failed to set leverage");
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
        {confirmedLeverage}X {/* <-- only update after success */}
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
            ...modalStyle,
          }}
        >
          <div className="w-full flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Set Leverage</h2>
          </div>
          <NativeSlider
            min={1}
            max={maxLeverage}
            step={1}
            value={leverage}
            onChange={e => setLeverage(Number(e.target.value))}
            disabled={!authKey}
          />
          <div className="text-2xl font-bold text-primary2">{leverage}X</div>
          <Button
            type="primary"
            className={`mt-2 flex-1 py-2 transition-all ${blink === "success" ? "blink-success" : ""} ${blink === "error" ? "blink-error" : ""}`}
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
      </Modal>
    </>
  );
}