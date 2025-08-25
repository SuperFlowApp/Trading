import React, { useState } from "react";
import "./inputs.css";
import { Listbox } from "@headlessui/react";
import { Fragment } from "react";

// Input with a button on the right (for Price + Mid)
export const PriceFieldInput = ({
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
    <div className="flex items-center h-8 rounded-md border border-[var(--color-liquiddarkgray)] bg-transparent text-[var(--color-liquidwhite)]">
      {/* fixed label with vertical separator */}
      <div className="flex items-center justify-center w-[80px] text-body text-[var(--color-liquidlightergray)] bg-transparent">
        {label || placeholder}
      </div>

      <div className="w-px h-5 bg-[var(--color-liquiddarkgray)]" />

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={""}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent outline-none text-body h-full px-2 text-[var(--color-liquidwhite)]"
        {...inputProps}
      />

      <button
        type="button"
        className="h-full min-w-[60px] text-body font-semibold border-l border-[var(--color-liquiddarkgray)] bg-transparent text-[var(--color-liquidwhite)] hover:bg-[var(--color-backgroundlighter)]"
        onClick={onButtonClick}
        disabled={disabled}
        {...buttonProps}
      >
        {buttonLabel}
      </button>
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

  // Handler for focus: clear if value is "0" or "0.0"
  const handleFocus = (e) => {
    setFocused(true);
    if (value === "0" || value === "0.0") {
      // Call onChange with empty string to clear
      onChange({ target: { value: "" } });
    }
    if (inputProps.onFocus) inputProps.onFocus(e);
  };

  // Handler for blur: restore "0" if empty
  const handleBlur = (e) => {
    setFocused(false);
    if (value === "" || value === undefined) {
      onChange({ target: { value: "0" } });
    }
    if (inputProps.onBlur) inputProps.onBlur(e);
  };

  return (
    <div className="flex items-center h-8 rounded-md border border-[var(--color-liquiddarkgray)] bg-transparent text-[var(--color-liquidwhite)] relative">
      {/* fixed prefix (size label) */}
      <div className="flex items-center justify-center w-[80px] text-body text-[var(--color-liquidlightergray)] bg-transparent">
        {label || placeholder}
      </div>

      <div className="w-px h-5 bg-[var(--color-liquiddarkgray)]" />

      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={""}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="flex-1 bg-transparent outline-none text-body h-full px-2 text-[var(--color-liquidwhite)]"
        {...inputProps}
      />

      {/* Use MinimalDropDown instead of native select */}
      <div className="h-full flex items-center border-l border-[var(--color-liquiddarkgray)] bg-transparent px-0 w-[70px]">
        <MinimalDropDown
          options={options}
          selectedOption={selectedOption}
          onOptionChange={onOptionChange}
          className="min-w-[80px] bg-transparent"
          style={{ border: "none", boxShadow: "none", background: "transparent" }}
          {...dropdownProps}
        />
      </div>
    </div>
  );
};

// Username Input
export const UsernameInput = ({ value, onChange, placeholder = "Username" }) => (
  <div className="custom-input-wrapper input-icon-inside input-icon-inside--left">
    <span className="custom-input-icon-inside">
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
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="custom-input input-with-icon"
      autoComplete="username"
      style={{ paddingLeft: 36 }}
    />
  </div>
);

// Password Input
export const PasswordInput = ({ value, onChange, placeholder = "Password" }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="custom-input-wrapper input-icon-inside input-icon-inside--left">
      <span className="custom-input-icon-inside">
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
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="custom-input input-with-icon"
        autoComplete="current-password"
        style={{ paddingLeft: 36, paddingRight: 36 }}
      />
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
    <div
      className="percentage-input-wrapper"
      style={{ position: "relative", maxWidth: 80 }}
    >
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="percentage-input"
        {...inputProps}
      />
      <span className="percentage-symbol">%</span>
    </div>
  );
};

export const DropDown = ({
  options = [],
  selectedOption,
  onOptionChange,
  dropdownProps = {},
  className = "",
}) => (
  <select
    value={selectedOption}
    onChange={(e) => onOptionChange(e.target.value)}
    className="h-full bg-transparent text-body border p-1 rounded-md border-[var(--color-liquiddarkgray)] outline-none"
    {...dropdownProps}
  >
    {/* Render only options that are NOT currently selected */}
    {options
      .filter((opt) => opt.value !== selectedOption)
      .map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    {/* Optionally, render the selected option as hidden so the value is always valid */}
    {options
      .filter((opt) => opt.value === selectedOption)
      .map((opt) => (
        <option key={opt.value} value={opt.value} hidden>
          {opt.label}
        </option>
      ))}
  </select>
);

export const MinimalDropDown = ({
  options = [],
  selectedOption,
  onOptionChange,
  className = "",
  style = {},
  ...props
}) => {
  const selected = options.find((opt) => opt.value === selectedOption) || options[0];

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: "70px", ...style }}
    >
      <Listbox value={selectedOption} onChange={onOptionChange} {...props}>
        {({ open }) => (
          <>
            <Listbox.Button
              className="bg-transparent text-liquidlightergray hover:text-liquidwhite text-body px-2 py-1 cursor-pointer pr-6 text-left border-none outline-none flex items-center justify-between"
              style={{ width: "86px" }}
            >
              <span className="flex-1 text-left">{selected?.label}</span>
              <span
                className="ml-2  flex-shrink-0"
                style={{ fontSize: 14 }}
              >
                {open ? "⬏" : "⬎"}
              </span>
            </Listbox.Button>
            <Listbox.Options
              className="absolute z-10 bg-[var(--color-backgroundmid)] shadow-lg border border-[var(--color-liquiddarkgray)] ring-1 ring-black ring-opacity-5 focus:outline-none text-body"
              style={{ width: "70px" }}
            >
              {options
                .filter((opt) => opt.value !== selectedOption)
                .map((opt) => (
                  <Listbox.Option key={opt.value} value={opt.value} as={Fragment}>
                    {({ active }) => (
                      <li
                        className={`cursor-pointer select-none px-2 py-[2px] ${
                          active
                            ? "bg-[var(--color-primary2darker)] text-white"
                            : "text-[var(--color-liquidwhite)]"
                        }`}
                        style={{ listStyle: "none" }}
                      >
                        {opt.label}
                      </li>
                    )}
                  </Listbox.Option>
                ))}
            </Listbox.Options>
          </>
        )}
      </Listbox>
    </div>
  );
};