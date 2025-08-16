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
      className={`border-b-[1px] border-primary2darker relative flex justify-between items-center text-body ${className}`}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab}
          className={`w-full pb-1 text-title transition-colors
            ${active === tab
              ? "text-liquidwhite "
              : "text-liquidlightergray   hover:text-liquidwhite"}
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
        className="absolute bottom-0 left-0 h-[1px] bg-primary2normal transition-all duration-300"
        style={{
          width: `${100 / tabs.length}%`,
          transform: `translateX(${idx * 100}%)`,
          marginBottom: "-1px", // slider line sits on top of border
        }}
      />
    </div>
  );
};

export default Tab;