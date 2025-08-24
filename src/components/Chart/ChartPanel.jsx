import { useState, useMemo, useRef, useEffect } from 'react';
import KlineChartProPanel from './KlineChart';
import IndicatorSettings from './IndicatorSettings';
import IndicatorsIcon from '/assets/Indicators.svg';
import TimezoneIcon from '/assets/TimeZone.svg';
import ScreenshotIcon from '/assets/Screenshot.svg';
import FullscreenIcon from '/assets/FullScreen.svg';


// Chart settings imports
import ChartSettings from './ChartSettings';
import { useZustandStore } from '../../Zustandstore/useStore';
import CandleSolidIcon from '/assets/candle_solid.svg';
import CandleStrokeIcon from '/assets/candle_stroke.svg';
import OHLCIcon from '/assets/ohlc.svg';
import AreaIcon from '/assets/area.svg';

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

  // Add this line to define the missing state variable
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);

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
  const chartSettings = useZustandStore(s => s.chartSettings);
  const setChartSettings = useZustandStore(s => s.setChartSettings);
  const [candleType, setCandleType] = useState('candle_solid'); // Only for style, not in chartSettings

  const chartApiRef = useRef(null);

  // Screenshot preview state
  const [screenshotUrl, setScreenshotUrl] = useState(null);

  // Map chart type to icon
  const chartTypeIcons = {
    candle_solid: CandleSolidIcon,
    candle_stroke: CandleStrokeIcon,
    ohlc: OHLCIcon,
    area: AreaIcon,
  };

  // Chart options (moved from SettingsDropdown -> only chart, not style)
  const [showChartMenu, setShowChartMenu] = useState(false);
  const handleChartSettingChange = (key) => {
    setChartSettings({ [key]: !chartSettings[key] });
  };

  // Close on outside click (Timezone + "..." Chart Settings)
  const tzWrapRef = useRef(null);
  const chartMenuWrapRef = useRef(null);
  const intervalDropdownRef = useRef(null);

  useEffect(() => {
    if (!showTZMenu && !showChartMenu && !showIntervalDropdown) return;
    function handleClickOutside(e) {
      if (showTZMenu && tzWrapRef.current && !tzWrapRef.current.contains(e.target)) {
        setShowTZMenu(false);
      }
      if (showChartMenu && chartMenuWrapRef.current && !chartMenuWrapRef.current.contains(e.target)) {
        setShowChartMenu(false);
      }
      if (showIntervalDropdown && intervalDropdownRef.current && !intervalDropdownRef.current.contains(e.target)) {
        setShowIntervalDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTZMenu, showChartMenu, showIntervalDropdown]);

  const chartSettingsList = useMemo(() => {
    return Object.entries(chartSettings)
      .filter(([key]) => !['red', 'green', 'fontSize'].includes(key))
      .map(([key, value]) =>
        key === 'price_axis_type' ? (
          <li key={key} className="flex items-center justify-between mb-2">
            <span className="text-liquidmidgray text-body select-none">Price Axis</span>
            <select
              className="bg-backgroundlight border border-[#00B7C950] rounded px-2 py-1 text-body focus:outline-none"
              value={chartSettings.price_axis_type}
              onChange={e => setChartSettings({ price_axis_type: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="log">Log</option>
              <option value="percentage">Percentage</option>
            </select>
          </li>
        ) : (
          <li key={key} className="flex items-center justify-between mb-2">
            <span className="text-liquidmidgray text-body select-none">
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <input
              type="checkbox"
              checked={!!chartSettings[key]}
              onChange={() => handleChartSettingChange(key)}
              className="accent-liquidwhite"
            />
          </li>
        )
      );
  }, [chartSettings, setChartSettings]);

  return (
    <div className="w-full text-body min-h-[520px] bg-backgroundmid rounded-md flex flex-col">
      {/* Tools Panel */}
      <div className="flex items-center justify-between px-3 py-2 gap-3">
        <div className="flex w-full items-center gap-3 justify-between">
          {/* LeftSide */}
          <div className="flex">
            {/* Interval selector with 3 static + 1 dropdown */}
            <div className="flex items-center gap-1 relative">
              {[0, 1, 2].map(i => (
                <button
                  key={intervals[i].key}
                  className={`px-2 py-1 rounded transition-colors duration-100 text-body ${
                    intervalValue === intervals[i].value
                      ? "text-primary2light bg-[#00B7C91a]"
                      : "text-liquidmidgray hover:text-primary2normal"
                  }`}
                  onClick={() => setIntervalValue(intervals[i].value)}
                  type="button"
                >
                  {intervals[i].label}
                </button>
              ))}
              {/* 4th button: dropdown for other intervals */}
              <div className="relative" ref={intervalDropdownRef}>
                <button
                  className={`px-2 py-1 rounded transition-colors duration-100 text-body flex items-center gap-1 ${
                    ![intervals[0].value, intervals[1].value, intervals[2].value].includes(intervalValue)
                      ? "text-primary2light bg-[#00B7C91a]"
                      : "text-liquidmidgray hover:text-primary2normal"
                  }`}
                  onClick={() => setShowIntervalDropdown(s => !s)}
                  type="button"
                  aria-label="Select interval"
                >
                  {/* Always show the 4th option label if a value from dropdown is selected, otherwise show "More" */}
                  {![intervals[0].value, intervals[1].value, intervals[2].value].includes(intervalValue)
                    ? intervals.find(i => i.value === intervalValue)?.label
                    : "More"
                  }
                  <svg className="ml-1 w-3 h-3" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
                {/* Dropdown menu */}
                {showIntervalDropdown && (
                  <div className="absolute left-0 mt-2 w-24 bg-backgroundmid rounded shadow-lg border border-[#00B7C950] z-30">
                    <ul className="py-1">
                      {intervals.slice(3).map(opt => (
                        <li key={opt.key}>
                          <button
                            className={`w-full text-left px-3 py-2 rounded text-body ${
                              intervalValue === opt.value
                                ? "text-primary2light bg-[#00B7C91a]"
                                : "text-liquidmidgray hover:text-primary2normal"
                            }`}
                            onClick={() => {
                              setIntervalValue(opt.value);
                              setShowIntervalDropdown(false);
                            }}
                            type="button"
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Indicator settings button */}
            <div className="relative">
              <button
                className="px-2 text-liquidmidgray py-1 rounded hover:bg-[#00B7C91a] flex items-center gap-1"
                onClick={() => setShowIndicatorSettings(s => !s)}
                title="Open indicator settings"
              >
                <img src={IndicatorsIcon} alt="" className="w-[20px] mr-1" />
                
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

            {/* Chart settings button (candle type) */}
            <div className="relative">
              <button
                className="px-2 py-1 rounded hover:bg-[#00B7C91a] flex items-center gap-1"
                onClick={() => setShowSettings(s => !s)}
                title="Chart settings"
              >
                <img
                  src={chartTypeIcons[candleType] || CandleSolidIcon}
                  alt=""
                  className="w-[20px] mr-1"
                />
              </button>
              {showSettings && (
                <div className="absolute left-0 mt-2 z-30">
                  <ChartSettings
                    open={showSettings}
                    candleType={candleType}
                    setCandleType={setCandleType}
                    onClose={() => setShowSettings(false)}
                    dropdown
                  />
                </div>
              )}
            </div>
          </div>

          {/* RightSide */}
          <div className="flex">

            {/* Timezone button + popover (styled + outside click close) */}
            <div className="relative" ref={tzWrapRef}>
              <button
                onClick={() => setShowTZMenu(s => !s)}
                className="px-2 py-1 rounded hover:bg-[#00B7C91a] flex items-center gap-1"
                title="Change chart timezone"
              >
                <img src={TimezoneIcon} alt="" className="w-[20px] mr-1" />
              </button>
              {showTZMenu && (
                <div className="absolute right-0 mt-2  bg-backgroundmid rounded shadow-lg p-4 border border-[#00B7C950] z-30">
                  <div className="font-body mb-2 opacity-90">Select timezone</div>
                  <ul className=" overflow-auto">
                    {COMMON_TIMEZONES.map(tz => (
                      <li key={tz}>
                        <button
                          onClick={() => { setTimeZone(tz); setShowTZMenu(false); }}
                          className={`w-full text-left px-3 py-2 rounded hover:bg-[#00B7C91a] ${tz === timeZone ? 'opacity-100' : 'opacity-80'}`}
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
              <img src={ScreenshotIcon} alt="" className="w-[20px] mr-1" />
            </button>


            {/* Fullscreen */}
            <button
              className="px-2 py-1 rounded  hover:bg-[#00B7C91a] flex items-center gap-1"
              onClick={() => chartApiRef.current?.fullscreen?.()}
              title="Toggle fullscreen"
            >
              <img src={FullscreenIcon} alt="" className="w-[20px] mr-1" />
            </button>

            {/* Chart options "..." menu (styled + outside click close) */}
            <div className="relative" ref={chartMenuWrapRef}>
              <button
                className="px-2 py-1 rounded hover:bg-[#00B7C91a] flex items-center justify-center w-8"
                onClick={() => setShowChartMenu(s => !s)}
                title="Chart settings"
                aria-label="More chart settings"
              >
                <svg
                  className="w-[20px] h-[20px] text-liquidmidgray"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="5" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="12" cy="19" r="1.8" />
                </svg>
              </button>
              {showChartMenu && (
                <div className="absolute right-0 mt-2 w-[320px] max-w-[95vw] bg-backgroundmid rounded shadow-lg p-4 border border-[#00B7C950] z-30">
                  <div className="font-body mb-2">Chart Settings</div>
                  <ul className="space-y-1">
                    {chartSettingsList}
                  </ul>
                </div>
              )}
            </div>
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
          candleType={candleType}
          chartSettings={chartSettings}
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
