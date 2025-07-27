import React, { useState } from "react";
import "./inputs.css";

// Input with a button on the right (for Price + Mid)
export const InputWithButton = ({
  value,
  onChange,
  placeholder = "",
  buttonLabel = "",
  onButtonClick,
  disabled = false,
  inputProps = {},
  buttonProps = {},
  label = "",
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="custom-input-wrapper floating-label-wrapper">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={""}
        className="custom-input left-round"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...inputProps}
      />
      <button
        type="button"
        className="custom-input-btn right-round"
        onClick={onButtonClick}
        disabled={disabled}
        {...buttonProps}
      >
        {buttonLabel}
      </button>
      <label
        className={`floating-label${focused || value ? " floating-label--active" : ""}`}
      >
        {label || placeholder}
      </label>
    </div>
  );
};

// Input with dropdown (for Size selector)
export const InputWithDropDown = ({
  value,
  onChange,
  placeholder = "",
  options = [],
  selectedOption,
  onOptionChange,
  inputProps = {},
  dropdownProps = {},
  label = "",
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="custom-input-wrapper floating-label-wrapper">
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={""}
        className="custom-input left-round"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...inputProps}
      />
      <select
        value={selectedOption}
        onChange={e => onOptionChange(e.target.value)}
        className="custom-insidebox-dropdown right-round"
        {...dropdownProps}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <label
        className={`floating-label${focused || value ? " floating-label--active" : ""}`}
      >
        {label || placeholder}
      </label>
    </div>
  );
};

// Username Input
export const UsernameInput = ({ value, onChange, placeholder = "Username" }) => (
  <div className="custom-input-wrapper">
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="custom-input"
      autoComplete="username"
    />
    <span className="custom-input-icon">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" stroke="#6c7a89" strokeWidth="2" />
        <path
          d="M4 20c0-4 4-6 8-6s8 2 8 6"
          stroke="#6c7a89"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </span>
  </div>
);

// Password Input
export const PasswordInput = ({ value, onChange, placeholder = "Password" }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="custom-input-wrapper">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="custom-input"
        autoComplete="current-password"
      />
      {/* Password icon on the left */}
      <span className="custom-input-icon">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <rect
            x="6"
            y="10"
            width="12"
            height="8"
            rx="2"
            stroke="#6c7a89"
            strokeWidth="2"
          />
          <path
            d="M9 10V8a3 3 0 1 1 6 0v2"
            stroke="#6c7a89"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="12" cy="14" r="1.5" fill="#6c7a89" />
        </svg>
      </span>
      {/* Eye icon on the right */}
      <button
        type="button"
        className="custom-input-eye"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          // Eye open icon
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path
              d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
              stroke="#6c7a89"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="12" cy="12" r="3" stroke="#6c7a89" strokeWidth="2" />
          </svg>
        ) : (
          // Eye closed icon
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path
              d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
              stroke="#6c7a89"
              strokeWidth="2"
              fill="none"
            />
            <path d="M4 4l16 16" stroke="#6c7a89" strokeWidth="2" />
          </svg>
        )}
      </button>
    </div>
  );
};

// Native percentage input for slider value
export const PercentageInput = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  inputProps = {},
}) => {
  return (
    <div className="percentage-input-wrapper" style={{ position: "relative", maxWidth: 80 }}>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="custom-input percentage-input"
        style={{ paddingRight: 24 }}
        {...inputProps}
      />
      <span className="percentage-symbol">%</span>
    </div>
  );
};