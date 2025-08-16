import { useState } from 'react';
import KlineChartProPanel from './KlineChart';

const intervals = [
  { key: '1', label: '1m', value: '1m', multiplier: 1, timespan: 'minute', text: '1m' },
  { key: '2', label: '5m', value: '5m', multiplier: 5, timespan: 'minute', text: '5m' },
  { key: '3', label: '15m', value: '15m', multiplier: 15, timespan: 'minute', text: '15m' },
  { key: '4', label: '30m', value: '30m', multiplier: 30, timespan: 'minute', text: '30m' },
  { key: '5', label: '1h', value: '1h', multiplier: 1, timespan: 'hour', text: '1h' },
  { key: '6', label: '2h', value: '2h', multiplier: 2, timespan: 'hour', text: '2h' },
  { key: '7', label: '4h', value: '4h', multiplier: 4, timespan: 'hour', text: '4h' },
  { key: '8', label: '6h', value: '6h', multiplier: 6, timespan: 'hour', text: '6h' },
  { key: '9', label: '8h', value: '8h', multiplier: 8, timespan: 'hour', text: '8h' },
  { key: '10', label: '12h', value: '12h', multiplier: 12, timespan: 'hour', text: '12h' },
  { key: '11', label: '1d', value: '1d', multiplier: 1, timespan: 'day', text: '1d' },
  { key: '12', label: '3d', value: '3d', multiplier: 3, timespan: 'day', text: '3d' },
  { key: '13', label: '1w', value: '1w', multiplier: 1, timespan: 'week', text: '1w' },
  { key: '14', label: '1M', value: '1M', multiplier: 1, timespan: 'month', text: '1M' },
];

export default function ChartPanel() {
  const [intervalValue, setIntervalValue] = useState('5m');
  const selectedInterval = intervals.find(i => i.value === intervalValue);

  return (
    <div className="w-full min-h-[520px] bg-backgroundmid rounded-md flex flex-col">
      {/* Tools Panel */}
      <div className="flex justify-end">
        <select
          className="time-dropdown text-body"
          value={intervalValue}
          onChange={e => setIntervalValue(e.target.value)}
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
        <KlineChartProPanel interval={selectedInterval} />
      </div>
    </div>
  );
}