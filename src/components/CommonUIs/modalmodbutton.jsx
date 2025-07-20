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
    className={`flex items-center justify-center pb-1 border-b-[1px] border-primary2deactive hover:border-primary2 text-white/85 hover:text-white min-w-14 cursor-pointer transition-colors ${className}`}
    onClick={onClick}
    style={style}
    disabled={disabled}
  >
    {children}
  </button>
);

export default ModalModButton;