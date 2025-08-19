import { useState, useMemo, useRef } from 'react';
import KlineChartProPanel from './KlineChart';
import IndicatorSettings from './IndicatorSettings';
import IndicatorsIcon from '/assets/Indicators.svg';
import SettingsIcon from '/assets/Candles.svg';
import TimezoneIcon from '/assets/TimeZone.svg';
import ScreenshotIcon from '/assets/Screenshot.svg';
import FullscreenIcon from '/assets/FullScreen.svg';

import ChartSettings from './ChartSettings';

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

const COMMON_TIMEZONES = (() => {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const list = [
    local,
    'UTC',
    'America/New_York',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];
  return [...new Set(list)].filter(Boolean);
})();

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

  // timezone state
  const [timeZone, setTimeZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [showTZMenu, setShowTZMenu] = useState(false);

  // indicator settings modal
  const [showIndicatorSettings, setShowIndicatorSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    candle_type: 'candle_solid',
    grid_show: true,
    reverse_coordinate: false,
    price_axis_type: 'normal',
    last_price_show: true,
    high_price_show: false,
    low_price_show: false,
    indicator_last_value_show: true,
  });

  const chartApiRef = useRef(null);

  // Screenshot preview state
  const [screenshotUrl, setScreenshotUrl] = useState(null);

  return (
    <div className="w-full text-body min-h-[520px] bg-backgroundmid rounded-md flex flex-col">
      {/* Tools Panel */}
      <div className="flex items-center justify-between px-3 py-2 gap-3">
        <div className="flex w-full items-center gap-3 justify-between">

          {/* LeftSide */}
          <div className="flex">
            {/* Interval dropdown */}
            <select
              className="time-dropdown bg-transparent  rounded px-2 py-1"
              value={intervalValue}
              onChange={e => setIntervalValue(e.target.value)}
            >
              {intervals.map(opt => (
                <option key={opt.key} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Indicator settings button */}
            <div className="relative">
              <button
                className="px-2 text-liquidmidgray py-1 rounded hover:bg-[#00B7C91a] flex items-center gap-1"
                onClick={() => setShowIndicatorSettings(s => !s)}
                title="Open indicator settings"
              >
                <img src={IndicatorsIcon} alt="" className="w-4 h-4 mr-1" />
                Indicators
              </button>
              {showIndicatorSettings && (
                <div className="absolute left-0 mt-2 z-30">
                  <IndicatorSettings
                    open={true}
                    onClose={() => setShowIndicatorSettings(false)}
                    toggles={toggles}
                    onToggle={onToggle}
                    dropdown
                  />
                </div>
              )}
            </div>

            {/* Chart settings button */}
            <div className="relative">
              <button
                className="px-2 py-1 rounded  hover:bg-[#00B7C91a] flex items-center gap-1"
                onClick={() => setShowSettings(s => !s)}
                title="Chart settings"
              >
                <img src={SettingsIcon} alt="" className="w-4 h-4 mr-1" />
              </button>
              {showSettings && (
                <div className="absolute left-0 mt-2 z-30">
                  <ChartSettings
                    open={true}
                    settings={settings}
                    setSettings={setSettings}
                    onClose={() => setShowSettings(false)}
                    dropdown
                  />
                </div>
              )}
            </div>
          </div>

          {/* RightSide */}
          <div className="flex">

            {/* Timezone button + popover */}
            <div className="relative">
              <button
                onClick={() => setShowTZMenu(s => !s)}
                className="px-2 py-1 rounded  hover:bg-[#00B7C91a] flex items-center gap-1"
                title="Change chart timezone"
              >
                <img src={TimezoneIcon} alt="" className="w-4 h-4 mr-1" />
              </button>
              {showTZMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md  bg-[#04080a] shadow-lg z-20">
                  <div className="px-2 py-2 opacity-70">Select timezone</div>
                  <ul className="max-h-64 overflow-auto">
                    {COMMON_TIMEZONES.map(tz => (
                      <li key={tz}>
                        <button
                          onClick={() => { setTimeZone(tz); setShowTZMenu(false); }}
                          className={`w-full text-left px-3 py-2 hover:bg-[#00B7C91a] ${tz === timeZone ? 'opacity-100' : 'opacity-80'}`}
                        >
                          {tz}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Screenshot */}
            <button
              className="px-2 py-1 rounded  hover:bg-[#00B7C91a] flex items-center gap-1"
              onClick={async () => {
                if (chartApiRef.current?.screenshot) {
                  const url = await chartApiRef.current.screenshot();
                  if (url) setScreenshotUrl(url);
                }
              }}
              title="Save chart as image"
            >
              <img src={ScreenshotIcon} alt="" className="w-4 h-4 mr-1" />
            </button>

            {/* Fullscreen */}
            <button
              className="px-2 py-1 rounded  hover:bg-[#00B7C91a] flex items-center gap-1"
              onClick={() => chartApiRef.current?.fullscreen?.()}
              title="Toggle fullscreen"
            >
              <img src={FullscreenIcon} alt="" className="w-4 h-4 mr-1" />
            </button>
          </div>

        </div>
      </div>

      {/* Chart */}
      <div className="flex-1">
        <KlineChartProPanel
          ref={chartApiRef}
          interval={selectedInterval}
          indicatorToggles={toggles}
          timeZone={timeZone}
          candleType={settings.candle_type}
          chartSettings={settings}
        />
      </div>

      {/* Screenshot Preview Modal */}
      {screenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div
            className="bg-[#181c20] rounded-lg p-4 shadow-lg flex flex-col items-center"
            style={{
              resize: 'both',
              overflow: 'auto',
              minWidth: 320,
              minHeight: 240,
              maxWidth: '55vw',
            }}
          >
            <img
              src={screenshotUrl}
              alt="Chart preview"
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: '0.5rem',
                display: 'block',
              }}
            />
            <div className="flex gap-4 mt-4">
              <button
                className="px-4 py-2 rounded bg-[#00B7C9] text-white font-semibold"
                onClick={() => {
                  // Download the image
                  const a = document.createElement('a');
                  a.href = screenshotUrl;
                  a.download = `chart_${Date.now()}.png`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  setScreenshotUrl(null);
                }}
              >
                Save
              </button>
              <button
                className="px-4 py-2 rounded bg-gray-600 text-white"
                onClick={() => setScreenshotUrl(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
