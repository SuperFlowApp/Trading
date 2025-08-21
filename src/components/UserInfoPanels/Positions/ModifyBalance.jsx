import React, { useState } from "react";
import Modal from "../../CommonUIs/modal/modal";
import { PriceFieldInput } from "../../CommonUIs/inputs/inputs";
import { useAuthKey } from "../../../contexts/AuthKeyContext";

const ModifyBalance = ({
  open,
  onClose,
  position
}) => {
  const [action, setAction] = useState("add"); // "add" or "remove"
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { authKey } = useAuthKey();

  if (!position) return null;

  const handleMaxClick = () => {
    // For add margin - can set to a placeholder max value or leave as is
    // For remove margin - set to position's isolated margin
    if (action === "remove") {
      const maxRemovable = position.isolatedMarginBalance || 0;
      setAmount(maxRemovable.toString());
    } else {
      // For add, you might want to set it to available balance
      // This would need to be passed as a prop or fetched
      console.log("Set max amount for adding margin");
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
      
      const response = await fetch(`https://fastify-serverless-function-rimj.onrender.com/api/modify-isolated-balance?action=${apiAction}`, {
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
      console.error('Error modifying margin:', err);
      setError(err.message || 'Failed to modify margin');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              : "text-liquidlightergray"}`}
            onClick={() => setAction("add")}
          >
            Add Margin
          </button>
          <button
            className={`py-2 px-4 ${action === "remove"
              ? "border-b-2 border-primary2normal text-primary2light"
              : "text-liquidlightergray"}`}
            onClick={() => setAction("remove")}
          >
            Remove Margin
          </button>
        </div>

        {/* Amount Input with MAX button */}
        <h2 className="text-body font-semibold text-liquidlightergray">
          {position.symbol}
        </h2>
        <div className="my-5">
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

        {/* Error message */}
        {error && (
          <div className="mb-3 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Confirm Button */}
        <button
          className="w-full py-2 px-4 bg-primary2normal hover:bg-primary2dark text-backgrounddark font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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