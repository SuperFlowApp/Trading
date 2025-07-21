import React from "react";

/**
 * ModalModButton - A common styled button for Margin, Leverage, Position controls.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button label/content
 * @param {function} props.onClick - Click handler
 * @param {string} [props.className] - Extra classes
 * @param {object} [props.style] - Inline styles
 * @param {boolean} [props.disabled] - Disabled state
 */
const ModalModButton = ({ children, onClick, className = "", style = {}, disabled = false }) => (
  <button
    type="button"
    className={`flex items-center justify-center bg-backgroundlight rounded-md p-1 border-[1px] border-transparent hover:border-primary2 hover:border-[1px] text-white/85 hover:text-white min-w-[80px] cursor-pointer transition-colors ${className}`}
    onClick={onClick}
    style={style}
    disabled={disabled}
  >
    {children}
  </button>
);

export default ModalModButton;