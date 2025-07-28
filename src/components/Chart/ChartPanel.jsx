import { useState } from 'react';
import KlineChartProPanel from './KlineChart';

// Use the same dropdown style as TifSelector
const intervals = [
  { key: '1', label: '1m', value: '1m' },
  { key: '2', label: '5m', value: '5m' },
  { key: '3', label: '30m', value: '30m' },
  { key: '4', label: '1h', value: '1h' },
  { key: '5', label: '4h', value: '4h' },
  { key: '6', label: '8h', value: '8h' },
  { key: '7', label: '1M', value: '1M' },
];

export default function ChartPanel() {
  const [interval, setInterval] = useState('5m');

  return (
    <div className="w-full min-h-[520px] bg-backgroundmid rounded-md flex flex-col">
      {/* Tools Panel */}
      <div className="w-full px-2 py-1 border-b border-backgroundlight flex items-center">
        {/* Stylized interval dropdown (same as TIF) */}
        <select
          className="custom-input-dropdown"
          value={interval}
          onChange={e => setInterval(e.target.value)}
          style={{ height: 28, width: 80 }}
        >
          {intervals.map(opt => (
            <option key={opt.key} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {/* Chart */}
      <div className="flex-1">
        <KlineChartProPanel interval={interval} />
      </div>
    </div>
  );
}