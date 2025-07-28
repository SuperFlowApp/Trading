import { useState } from 'react';
import KlineChartProPanel from './KlineChart';

const intervals = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '8h', value: '8h' },
  { label: '1M', value: '1M' },
];

export default function ChartPanel() {
  const [interval, setInterval] = useState('5m');

  return (
    <div className="w-full min-h-[520px] bg-backgroundmid rounded-md flex flex-col">
      {/* Tools Panel */}
      <div className="w-full px-2 py-1 border-b border-backgroundlight flex items-center">
        {/* Custom interval dropdown */}
        <select
          className="bg-backgroundmid text-white border rounded px-2 py-1"
          value={interval}
          onChange={e => setInterval(e.target.value)}
        >
          {intervals.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
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