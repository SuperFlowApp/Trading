import { useState, useMemo } from 'react';
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

const SYSTEM_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const COMMON_TIMEZONES = [
  'Autodetect',
  'UTC',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function ChartPanel() {
  const [intervalValue, setIntervalValue] = useState('5m');
  const selectedInterval = useMemo(
    () => intervals.find(i => i.value === intervalValue) || intervals[1],
    [intervalValue]
  );
  // indicator toggles (using MAIN/SUB keys expected by the chart)
  const [toggles, setToggles] = useState({
    MAIN_MA: false,
    MAIN_EMA: false,
    MAIN_BOLL: false,
    SUB_RSI: false,
    SUB_MACD: false,
    SUB_VOL: false,
  });
  const onToggle = (name) => (e) =>
    setToggles((t) => ({ ...t, [name]: e.target.checked }));

  // timezone state: 'Autodetect' by default
  const [timeZone, setTimeZone] = useState('Autodetect');
  const [showTZMenu, setShowTZMenu] = useState(false);

  return (
    <div className="w-full min-h-[520px] bg-backgroundmid rounded-md flex flex-col">
      {/* Tools Panel */}
      <div className="flex items-center justify-between px-3 py-2 gap-3">
        {/* Interval dropdown */}
        <select
          className="time-dropdown text-body bg-transparent border border-[#00B7C950] rounded px-2 py-1"
          value={intervalValue}
          onChange={e => setIntervalValue(e.target.value)}
        >
          {intervals.map(opt => (
            <option key={opt.key} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Right-side tools */}
        <div className="flex items-center gap-3">

          {/* Indicator checkboxes */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm z-10">
            {[
              ['MAIN_MA','MA (Main)'],
              ['MAIN_EMA','EMA (Main)'],
              ['MAIN_BOLL','BOLL (Main)'],
              ['SUB_RSI','RSI'],
              ['SUB_MACD','MACD'],
              ['SUB_VOL','VOL'],
            ].map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={toggles[key]}
                  onChange={onToggle(key)}
                  className="accent-[#00B7C9]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {/* Timezone button + popover */}
          <div className="relative">
            <button
              onClick={() => setShowTZMenu(s => !s)}
              className="px-2 py-1 text-sm rounded border border-[#00B7C950] hover:bg-[#00B7C91a]"
              title="Change chart timezone"
            >
              TZ: {timeZone === 'Autodetect' ? SYSTEM_TZ : timeZone}
            </button>

            {showTZMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border border-[#00B7C950] bg-[#04080a] shadow-lg z-20">
                <div className="px-2 py-2 text-xs opacity-70">Select timezone</div>
                <ul className="max-h-64 overflow-auto text-sm">
                  {COMMON_TIMEZONES.map(tz => (
                    <li key={tz}>
                      <button
                        onClick={() => { setTimeZone(tz); setShowTZMenu(false); }}
                        className={`w-full text-left px-3 py-2 hover:bg-[#00B7C91a] ${tz === timeZone ? 'opacity-100' : 'opacity-80'}`}
                      >
                        {tz === 'Autodetect' ? `Autodetect (${SYSTEM_TZ})` : tz}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Chart */}
      <div className="flex-1">
        <KlineChartProPanel
          interval={selectedInterval}
          indicatorToggles={toggles}
          timeZone={timeZone === 'Autodetect' ? SYSTEM_TZ : timeZone}
        />
      </div>
    </div>
  );
}
