import { useEffect, useRef } from "react";

export default function ChartSettings({ open, candleType, setCandleType, onClose, dropdown }) {
  const boxRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;
  const chartTypes = [
    { value: "candle_solid", label: "Solid Candle", icon: "/assets/candle_solid.svg" },
    { value: "candle_stroke", label: "Outline Candle", icon: "/assets/candle_stroke.svg" },
    { value: "ohlc", label: "bars", icon: "/assets/ohlc.svg" },
    { value: "area", label: "Area", icon: "/assets/area.svg" },
  ];

  const handleSelect = (value) => {
    setCandleType(value);
    onClose(); // Close dropdown when a chart type is selected
  };

  const content = (
    <div
      ref={boxRef}
      className="w-72 rounded-md border border-primary2darker bg-backgroundmid shadow-lg z-20 p-3 space-y-2"
    >
      {/* Candle Type as vertical icon list */}
      <div>
        <div className="flex flex-col gap-1">
          {chartTypes.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`flex items-center px-2 py-2 rounded transition border w-full
                ${candleType === opt.value
                  ? "border-primary2normal"
                  : "border-transparent hover:border-[#00B7C950]"
                }`}
            >
              <img src={opt.icon} alt={opt.label} className="w-6 h-6 mr-3" />
              <span className="text-body" style={{ color: candleType === opt.value ? "var(--color-primary2liquidwhite)" : "var(--color-liquidmidgray)" }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
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