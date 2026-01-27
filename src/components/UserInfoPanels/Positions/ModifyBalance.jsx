import React, { useState } from "react";
import Cookies from "js-cookie";
import Modal from "../../CommonUIs/modal/modal";
import { PriceFieldInput } from "../../CommonUIs/inputs/inputs";
import { API_BASE_URL } from "../../../config/api";
import { useZustandStore } from "../../../Zustandstore/useStore";
import { formatPrice } from "../../../utils/priceFormater";

const ModifyBalance = ({
  open,
  onClose,
  position,
  margin
}) => {
  const [action, setAction] = useState("add");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const authKey = Cookies.get("authKey");

  // Clear input when switching tabs
  React.useEffect(() => {
    setAmount("");
  }, [action]);

  // Fetch available balance from Zustand store
  const availableUsdt = useZustandStore(state => state.availableUsdt);

  if (!position) return null;

  const handleMaxClick = () => {
    if (action === "remove") {
      setAmount(removableBalance.toString());
    } else {
      setAmount(availableUsdt.toString());
    }
  };

  const handleMarginUpdate = async () => {
    if (!authKey || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Map our UI action to API action
      const apiAction = action === "add" ? "deposit" : "withdraw";

      const response = await fetch(`https://fastify-serverless-function-ymut.onrender.com/api/modify-isolated-balance?action=${apiAction}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`
        },
        body: JSON.stringify({
          symbol: position.symbol,
          positionSide: position.positionSide || "BOTH",
          amount: parseFloat(amount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to modify margin');
      }

      // Success - close modal
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to modify margin');
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate removable balance for "remove" action
  const removableBalance = action === "remove"
    ? Math.min(position.isolatedMarginBalance || 0, availableUsdt)
    : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={320}
    >
      <div className="p-4">
        {/* Tabs */}
        <div className="flex border-b border-liquiddarkgray mb-4">
          <button
            className={`py-2 px-4 ${action === "add"
              ? "border-b-2 border-primary2normal text-primary2light"
              : "text-color_lighter_gray"}`}
            onClick={() => setAction("add")}
          >
            Add Margin
          </button>
          <button
            className={`py-2 px-4 ${action === "remove"
              ? "border-b-2 border-primary2normal text-primary2light"
              : "text-color_lighter_gray"}`}
            onClick={() => setAction("remove")}
          >
            Remove Margin
          </button>
        </div>

        {/* Pair Symbol */}
        <h2 className="text-body font-semibold text-color_lighter_gray">
          {position.symbol}
        </h2>

        <div className="my-2">
          <PriceFieldInput
            label="Amount (USDT)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            buttonLabel="MAX"
            onButtonClick={handleMaxClick}
            inputProps={{
              type: "number",
              placeholder: "0",
              min: "0",
              step: "0.01",
            }}
          />
        </div>

        {/* Available/Removable Balance */}
        <div className="mb-2 text-xs text-color_lighter_gray flex justify-between">
          <span>
            {action === "remove" ? "Max removable balance:" : "Max addable balance:"}
          </span>
          <span className="font-bold text-liquidwhite">
            {action === "remove"
              ? formatPrice(removableBalance) + " USDT"
              : formatPrice(availableUsdt) + " USDT"}
          </span>
        </div>

        {/* Current Margin */}
        <div className="mb-2 text-xs text-color_lighter_gray flex justify-between">
          <span>Currently assigned Margin:</span>
          <span className="font-bold text-liquidwhite">
            {formatPrice(margin)} USDT
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-3 text-liquidRed text-sm">
            {error}
          </div>
        )}

        {/* Confirm Button */}
        <button
          className="w-full py-2 px-4 bg-primary2normal hover:bg-primary2dark text-boxbackground font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleMarginUpdate}
          disabled={isSubmitting || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0}
        >
          {isSubmitting ? "Processing..." : "Confirm"}
        </button>
      </div>
    </Modal>
  );
};

export default ModifyBalance;