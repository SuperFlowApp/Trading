export default function ChartSettings({ open, candleType, setCandleType, onClose, dropdown }) {
  if (!open) return null;
  const chartTypes = [
    { value: "candle_solid", label: "Solid Candle" },
    { value: "candle_stroke", label: "Outline Candle" },
    { value: "ohlc", label: "OHLC" },
    { value: "area", label: "Area" },
  ];

  const content = (
    <div className="w-72 rounded-md border border-primary2darker bg-backgroundmid shadow-lg z-20 p-3 space-y-2">
      {/* Candle Type as radio buttons */}
      <div>
        <span className="text-sm block mb-1">Candle type</span>
        <div className="flex flex-col gap-1">
          {chartTypes.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="candleType"
                value={opt.value}
                checked={candleType === opt.value}
                onChange={() => setCandleType(opt.value)}
                className="accent-[#00B7C9]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
      <button
        className="mt-2 px-2 py-1 text-xs rounded border border-[#00B7C950] hover:bg-[#00B7C91a] w-full"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );

  if (dropdown) return content;
  // fallback to modal if not dropdown
  return (
    <div className="absolute right-0 mt-2 w-72 rounded-md border border-[#00B7C950] bg-[#04080a] z-20 space-y-2">
      {content}
    </div>
  );
}