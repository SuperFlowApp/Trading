import React from "react";

export default function ChartSettings({ open, settings, setSettings, onClose, dropdown }) {
  if (!open) return null;
  if (dropdown) {
    return (
      <div className="w-72 rounded-md border border-[#00B7C950] bg-[#04080a] shadow-lg z-20 p-3 space-y-2">
        <div className="text-xs opacity-70">Chart Settings</div>

        {/* Candle Type */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Candle type</span>
          <select
            className="bg-transparent border border-[#00B7C950] rounded px-2 py-1 text-sm"
            value={settings.candle_type}
            onChange={e => setSettings(s => ({ ...s, candle_type: e.target.value }))}
          >
            <option value="candle_solid">candle_solid</option>
            <option value="candle_stroke">candle_stroke</option>
            <option value="ohlc">ohlc</option>
            <option value="area">area</option>
          </select>
        </div>

        {/* Price axis type */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Price axis</span>
          <select
            className="bg-transparent border border-[#00B7C950] rounded px-2 py-1 text-sm"
            value={settings.price_axis_type}
            onChange={e => setSettings(s => ({ ...s, price_axis_type: e.target.value }))}
          >
            <option value="normal">normal</option>
            <option value="log">log</option>
            <option value="percentage">percentage</option>
          </select>
        </div>

        {/* Toggles */}
        {[
          ['grid_show', 'Grid'],
          ['reverse_coordinate', 'Reverse coordinate'],
          ['last_price_show', 'Last price label'],
          ['high_price_show', 'High price label'],
          ['low_price_show', 'Low price label'],
          ['indicator_last_value_show', 'Indicator last value'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center justify-between text-sm">
            <span>{label}</span>
            <input
              type="checkbox"
              className="accent-[#00B7C9]"
              checked={!!settings[key]}
              onChange={e => setSettings(s => ({ ...s, [key]: e.target.checked }))}
            />
          </label>
        ))}

        {/* Optional: Close button */}
        <button
          className="mt-2 px-2 py-1 text-xs rounded border border-[#00B7C950] hover:bg-[#00B7C91a] w-full"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    );
  }
  // fallback to modal if not dropdown
  return (
    <div className="absolute right-0 mt-2 w-72 rounded-md border border-[#00B7C950] bg-[#04080a] shadow-lg z-20 p-3 space-y-2">
      <div className="text-xs opacity-70">Chart Settings</div>

      {/* Candle Type */}
      <div className="flex items-center justify-between">
        <span className="text-sm">Candle type</span>
        <select
          className="bg-transparent border border-[#00B7C950] rounded px-2 py-1 text-sm"
          value={settings.candle_type}
          onChange={e => setSettings(s => ({ ...s, candle_type: e.target.value }))}
        >
          <option value="candle_solid">candle_solid</option>
          <option value="candle_stroke">candle_stroke</option>
          <option value="ohlc">ohlc</option>
          <option value="area">area</option>
        </select>
      </div>

      {/* Price axis type */}
      <div className="flex items-center justify-between">
        <span className="text-sm">Price axis</span>
        <select
          className="bg-transparent border border-[#00B7C950] rounded px-2 py-1 text-sm"
          value={settings.price_axis_type}
          onChange={e => setSettings(s => ({ ...s, price_axis_type: e.target.value }))}
        >
          <option value="normal">normal</option>
          <option value="log">log</option>
          <option value="percentage">percentage</option>
        </select>
      </div>

      {/* Toggles */}
      {[
        ['grid_show', 'Grid'],
        ['reverse_coordinate', 'Reverse coordinate'],
        ['last_price_show', 'Last price label'],
        ['high_price_show', 'High price label'],
        ['low_price_show', 'Low price label'],
        ['indicator_last_value_show', 'Indicator last value'],
      ].map(([key, label]) => (
        <label key={key} className="flex items-center justify-between text-sm">
          <span>{label}</span>
          <input
            type="checkbox"
            className="accent-[#00B7C9]"
            checked={!!settings[key]}
            onChange={e => setSettings(s => ({ ...s, [key]: e.target.checked }))}
          />
        </label>
      ))}

      {/* Optional: Close button */}
      <button
        className="mt-2 px-2 py-1 text-xs rounded border border-[#00B7C950] hover:bg-[#00B7C91a] w-full"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}