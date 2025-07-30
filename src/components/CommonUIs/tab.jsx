import React from "react";

/**
 * Tab component for sliding underline tabs.
 * @param {Object} props
 * @param {string[]} props.tabs - Array of tab keys (e.g. ['market', 'limit', 'scale'])
 * @param {string} props.active - The currently active tab key
 * @param {function} props.onChange - Callback when tab changes (tabKey) => void
 * @param {function} [props.renderLabel] - Optional: function(tabKey) => string/JSX for custom label
 * @param {string} [props.className] - Optional: extra classes for the container
 */
const Tab = ({ tabs, active, onChange, renderLabel, className = "" }) => {
  const idx = tabs.indexOf(active);
  return (
    <div
      className={`border-b-[2px] border-primary2deactive relative flex justify-between items-center text-sm ${className}`}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab}
          className={`w-full py-2 text-sm transition-colors
            ${active === tab
              ? "text-white "
              : "text-liquidwhite hover:text-white font-normal"}
          `}
          onClick={() => onChange(tab)}
          type="button"
          style={{
            transition: "color 0.2s, font-weight 0.2s",
          }}
        >
          {renderLabel ? renderLabel(tab) : tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-primary2 transition-all duration-300"
        style={{
          width: `${100 / tabs.length}%`,
          transform: `translateX(${idx * 100}%)`,
          marginBottom: "-2px", // slider line sits on top of border
        }}
      />
    </div>
  );
};

export default Tab;