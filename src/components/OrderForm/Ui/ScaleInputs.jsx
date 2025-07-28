import React, { useState } from "react";
import "../../CommonUIs/inputs/inputs.css";

const InputWithLabel = ({
  value,
  onChange,
  placeholder = "",
  label = "",
  inputProps = {},
  type = "text",
  disabled = false,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="custom-input-wrapper floating-label-wrapper">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={""}
        className="custom-input all-round"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        {...inputProps}
      />
      <label
        className={`floating-label${
          focused || value ? " floating-label--active" : ""
        }`}
      >
        {label || placeholder}
      </label>
    </div>
  );
};

const ScaleInputs = ({
  scaleValue1,
  setScaleValue1,
  scaleValue2,
  setScaleValue2,
  isScaleTab,
}) => {
  if (!isScaleTab) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      <InputWithLabel
        value={scaleValue1}
        onChange={(e) => setScaleValue1(e.target.value)}
        label="Scale Start"
      />
      <InputWithLabel
        value={scaleValue2}
        onChange={(e) => setScaleValue2(e.target.value)}
        label="Scale End"
      />
    </div>
  );
};

export default ScaleInputs;