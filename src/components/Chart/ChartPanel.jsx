import React, { useState } from "react";
import TradingViewLightChart from './TradingViewLightChart';

const intervals = [
  "1m", "5m", "15m", "1h", "4h", "1d"
];

export default function ChartPanel({ interval: intervalProp }) {
  const defaultInterval = "1m";
  const [interval, setInterval] = useState(intervalProp || defaultInterval);
  const candleType = 'candle_solid';

  return (
    <div className="w-full h-[583px] bg-backgroundmid border-[1px] border-backgroundlighthover rounded-md flex flex-col">
      <div style={{ display: "flex", gap: 8, padding: 12 }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>Interval:</span>
        {intervals.map(i => (
          <button
            key={i}
            style={{
              padding: "2px 8px",
              borderRadius: 6,
              background: interval === i ? "#26a69a" : "#181923",
              color: interval === i ? "#000000" : "#d1d4dc",
              fontWeight: interval === i ? "bold" : "normal",
              cursor: "pointer",
            }}
            onClick={() => setInterval(i)}
          >
            {i}
          </button>
        ))}
      </div>
      <TradingViewLightChart
        interval={interval}
        candleType={candleType}
      />
    </div>
  );
}
