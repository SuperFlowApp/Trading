import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { selectedPairStore } from '../../Zustandstore/userOrderStore'
import { KLineChartPro } from '@klinecharts/pro';
import './klinecharts-pro.min.css';
import { useZustandStore } from "../../Zustandstore/useStore"; // import your store

// --- REST helper with range support ---
const REST_URL = (pair, interval, opts = {}) => {
  const { startTime, endTime, limit = 1000 } = opts;
  const u = new URL('https://api.binance.com/api/v3/klines');
  u.searchParams.set('symbol', `${pair.toUpperCase()}USDT`);
  u.searchParams.set('interval', interval);
  u.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 1000)));
  if (startTime) u.searchParams.set('startTime', String(startTime));
  if (endTime) u.searchParams.set('endTime', String(endTime));
  return u.toString();
};

const WS_URL = (pair, interval) =>
  `wss://stream.binance.com:9443/ws/${pair.toLowerCase()}usdt@kline_${interval}`;

const INTERVAL_MS = {
  '1m': 60_000, '5m': 300_000, '15m': 900_000, '30m': 1_800_000,
  '1h': 3_600_000, '2h': 7_200_000, '4h': 14_400_000, '6h': 21_600_000,
  '8h': 28_800_000, '12h': 43_200_000, '1d': 86_400_000,
  '3d': 259_200_000, '1w': 604_800_000, '1M': 2_592_000_000,
};

const mapK = d => ({
  timestamp: d[0], open: +d[1], high: +d[2], low: +d[3], close: +d[4], volume: +d[5],
});

class BinanceFeed {
  constructor(pair) {
    this.pair = pair;
    this.subscribers = [];
    this.history = [];
    this.ws = null;
    this.shouldReconnect = true;
    this.loading = false;
    this.currInterval = null;
  }
  destroy() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.subscribers = [];
  }
  async getHistoryKLineData(symbol, period, from, to) {
    const interval = period.text;
    const initialLoad = !from && !to;
    this.currInterval = interval;

    let url;
    if (from && to) {
      const step = INTERVAL_MS[interval] || 60_000;
      const need = Math.ceil((to - from) / step) + 2;
      url = REST_URL(this.pair, interval, {
        startTime: from,
        endTime: to - 1,
        limit: Math.min(1000, Math.max(need, 100)),
      });
    } else {
      url = REST_URL(this.pair, interval, { limit: 500 });
    }

    this.loading = true;
    const res = await fetch(url);
    const json = await res.json();
    this.loading = false;

    const chunk = Array.isArray(json) ? json.map(mapK) : [];

    // Merge chunk into cache (dedupe by timestamp)
    if (chunk.length) {
      if (!this.history.length) {
        this.history = chunk;
      } else {
        const have = new Set(this.history.map(b => b.timestamp));
        const add = chunk.filter(b => !have.has(b.timestamp));
        if (add.length) {
          this.history = [...this.history, ...add].sort((a, b) => a.timestamp - b.timestamp);
          // optional soft cap to keep memory in check
          const MAX = 10000;
          if (this.history.length > MAX) {
            this.history = this.history.slice(this.history.length - MAX);
          }
        }
      }
    }
    // Start WS after the first page for this interval
    if (initialLoad && (!this.ws || this.currInterval !== interval)) {
      this.initWs(interval);
    }

    // Return only the chunk requested
    return chunk;
  }

  // subscribe with correct signature
  subscribe(symbol, period, callback) {
    // send full history first
    if (this.history.length > 0) {
      callback(this.history, true);
    }
    // then attach WS updates
    this.subscribers.push(callback);
  }

  unsubscribe(symbol, period) {
    // close WS and clear subscribers
    this.destroy();
  }

  initWs(interval) {
    if (this.ws) { this.ws.onclose = null; this.ws.close(); }
    this.shouldReconnect = true;
    this.ws = new WebSocket(WS_URL(this.pair, interval));

    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      const k = msg?.k; if (!k) return;
      const bar = { timestamp: k.t, open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v };

      // upsert the latest bar (no 500-cap here; let history grow)
      const h = this.history;
      if (h.length && h[h.length - 1].timestamp === bar.timestamp) {
        h[h.length - 1] = bar;
      } else if (!h.length || bar.timestamp > h[h.length - 1].timestamp) {
        h.push(bar);
      } else {
        // rare: out-of-order — merge by timestamp
        const i = h.findIndex(b => b.timestamp === bar.timestamp);
        if (i >= 0) h[i] = bar;
      }

      this.subscribers.forEach(cb => { if (typeof cb === 'function') cb(bar, false); });
    };

    this.ws.onclose = () => { if (this.shouldReconnect) setTimeout(() => this.initWs(interval), 1000); };
    this.ws.onerror = () => { if (this.ws) this.ws.close(); };
  }
}
function KlineChartProPanel({
  interval,
  indicatorToggles,
  timeZone,
  candleType = 'candle_stroke',
  chartSettings, // ← new
}, ref) {
  const selectedPairBase = selectedPairStore(s => s.selectedPair);
  const [pair, setPair] = useState(selectedPairBase);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const tzRef = useRef(timeZone);

  // expose a tiny API: screenshot + fullscreen
  useImperativeHandle(ref, () => ({
    screenshot: async (opts = {}) => {
      const chart = chartInstanceRef.current;
      if (!chart) return;

      // 1) Try v10+ object signature (may return string or Promise)
      let url;
      if (typeof chart.getConvertPictureUrl === 'function') {
        try {
          url = chart.getConvertPictureUrl({
            includeOverlay: true,
            includeTooltip: true,
            type: 'png',
            backgroundColor: '#00000000',
            pixelRatio: window.devicePixelRatio || 1,
          });
          if (url && typeof url.then === 'function') url = await url;
        } catch { }
      }

      // 2) Try older positional signature (includeOverlay, type, bg)
      if (!url && typeof chart.getConvertPictureUrl === 'function') {
        try {
          url = chart.getConvertPictureUrl(true, 'image/png', '#00000000');
        } catch { }
      }

      // 3) Other historical helpers
      if (!url && typeof chart.getImageUrl === 'function') {
        try { url = chart.getImageUrl(); } catch { }
      }
      if (!url && typeof chart.getScreenshot === 'function') {
        try { url = chart.getScreenshot(); } catch { }
      }

      // 4) DOM fallback: stitch layered canvases into one
      if (!url) {
        const container = chartRef.current;
        const canvases = container?.querySelectorAll?.('canvas');
        if (canvases && canvases.length > 0) {
          try {
            const mergedCanvas = document.createElement('canvas');
            const ctx = mergedCanvas.getContext('2d');
            if (!ctx) throw new Error('Failed to create canvas context');

            // Set size
            const { width, height } = canvases[0];
            mergedCanvas.width = width;
            mergedCanvas.height = height;

            // Draw each canvas in order
            canvases.forEach((canvas) => {
              ctx.drawImage(canvas, 0, 0);
            });

            // Convert to data URL
            url = mergedCanvas.toDataURL('image/png');
          } catch (err) {
            console.error('Failed to capture chart screenshot:', err);
          }
        }
      }

      if (!url) {
        console.warn('Screenshot failed: no export method available on this build.');
        return null;
      }
      // Instead of downloading, return the URL so the parent can preview/save
      return url;
    },
    fullscreen: () => {
      const el = chartRef.current;
      if (!el) return;
      const doc = document;
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        (doc.exitFullscreen || doc.webkitExitFullscreen)?.();
      } else {
        (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
      }
    },
    toggleLeftMenu: (force) => {
      const root = chartRef.current;
      if (!root) return;
      const left =
        root.querySelector('[data-klinecharts-pro="left-toolbar"]') ||
        root.querySelector('.klinecharts-pro-left-toolbar') ||
        root.querySelector('.left-toolbar') ||
        root.querySelector('.klinecharts-pro__toolbar--left');
      if (!left) return;
      if (typeof force === 'boolean') {
        left.classList.toggle('kc-hidden', !force);
      } else {
        left.classList.toggle('kc-hidden');
      }
    },
  }));

  const red = useZustandStore((s) => s.red);
  const green = useZustandStore((s) => s.green);

  // Update pair when Zustand state changes
  useEffect(() => {
    setPair(selectedPairBase);
  }, [selectedPairBase]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Clear chart container to force full re-mount
      if (chartRef.current) {
        chartRef.current.innerHTML = '';
      }

      const feed = new BinanceFeed(pair);
      const symbol = `${pair.toUpperCase()}USDT`;

      feed.getHistoryKLineData(symbol, interval).then(() => {
        if (!isMounted) return;

        if (chartRef.current) {
          chartRef.current.innerHTML = '';
        }

        const getCssVar = (name, fallback) =>
          getComputedStyle(document.documentElement).getPropertyValue(name)?.trim() || fallback;

        const upColor = getCssVar('--color-green', '#00B7C9');   // Bullish
        const downColor = getCssVar('--color-red', '#F59DEF');       // Bearish
        const noChangeColor = getCssVar('--color-liquidlightergray', '#888888');

        const upBorderColor = upColor;
        const downBorderColor = downColor;
        const noChangeBorderColor = noChangeColor;

        const upWickColor = upColor;
        const downWickColor = downColor;
        const noChangeWickColor = noChangeColor;

        const formatWithTZ = (timestamp, type) => {
          const tz = tzRef.current || 'UTC';
          const options =
            type === 'time'
              ? { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }
              : { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz };
          return new Date(timestamp).toLocaleString('en-US', options);

        };

        // ✅ Build indicator arrays from all toggles
        const mainIndicators = [];
        if (indicatorToggles?.MAIN_MA) mainIndicators.push('MA');
        if (indicatorToggles?.MAIN_EMA) mainIndicators.push('EMA');
        if (indicatorToggles?.MAIN_SMA) mainIndicators.push('SMA');
        if (indicatorToggles?.MAIN_BOLL) mainIndicators.push('BOLL');
        if (indicatorToggles?.MAIN_SAR) mainIndicators.push('SAR');
        if (indicatorToggles?.MAIN_BBI) mainIndicators.push('BBI');

        const subIndicators = [];
        if (indicatorToggles?.SUB_MA) subIndicators.push('MA');
        if (indicatorToggles?.SUB_EMA) subIndicators.push('EMA');
        if (indicatorToggles?.SUB_VOL) subIndicators.push('VOL');
        if (indicatorToggles?.SUB_MACD) subIndicators.push('MACD');
        if (indicatorToggles?.SUB_BOLL) subIndicators.push('BOLL');
        if (indicatorToggles?.SUB_KDJ) subIndicators.push('KDJ');
        if (indicatorToggles?.SUB_RSI) subIndicators.push('RSI');
        if (indicatorToggles?.SUB_BIAS) subIndicators.push('BIAS');
        if (indicatorToggles?.SUB_BRAR) subIndicators.push('BRAR');
        if (indicatorToggles?.SUB_CCI) subIndicators.push('CCI');
        if (indicatorToggles?.SUB_DMI) subIndicators.push('DMI');
        if (indicatorToggles?.SUB_CR) subIndicators.push('CR');
        if (indicatorToggles?.SUB_PSY) subIndicators.push('PSY');
        if (indicatorToggles?.SUB_DMA) subIndicators.push('DMA');
        if (indicatorToggles?.SUB_TRIX) subIndicators.push('TRIX');
        if (indicatorToggles?.SUB_OBV) subIndicators.push('OBV');
        if (indicatorToggles?.SUB_VR) subIndicators.push('VR');
        if (indicatorToggles?.SUB_WR) subIndicators.push('WR');
        if (indicatorToggles?.SUB_MTM) subIndicators.push('MTM');
        if (indicatorToggles?.SUB_EMV) subIndicators.push('EMV');
        if (indicatorToggles?.SUB_SAR) subIndicators.push('SAR');
        if (indicatorToggles?.SUB_SMA) subIndicators.push('SMA');
        if (indicatorToggles?.SUB_ROC) subIndicators.push('ROC');
        if (indicatorToggles?.SUB_PVT) subIndicators.push('PVT');
        if (indicatorToggles?.SUB_BBI) subIndicators.push('BBI');
        if (indicatorToggles?.SUB_AO) subIndicators.push('AO');

        chartInstanceRef.current = new KLineChartPro({
          container: chartRef.current,
          locale: 'en-US',
          formatter: {
            formatDate: (timestamp, _format, type) => formatWithTZ(timestamp, type),

          },
          periods: [
            { multiplier: 1, timespan: 'minute', text: '1m' },
            { multiplier: 5, timespan: 'minute', text: '5m' },
            { multiplier: 15, timespan: 'minute', text: '15m' },
            { multiplier: 30, timespan: 'minute', text: '30m' },
            { multiplier: 1, timespan: 'hour', text: '1h' },
            { multiplier: 2, timespan: 'hour', text: '2h' },
            { multiplier: 4, timespan: 'hour', text: '4h' },
            { multiplier: 6, timespan: 'hour', text: '6h' },
            { multiplier: 8, timespan: 'hour', text: '8h' },
            { multiplier: 12, timespan: 'hour', text: '12h' },
            { multiplier: 1, timespan: 'day', text: '1d' },
            { multiplier: 3, timespan: 'day', text: '3d' },
            { multiplier: 1, timespan: 'week', text: '1w' },
            { multiplier: 1, timespan: 'month', text: '1M' },
          ],
          period: interval, // Use the selected interval object
          datafeed: feed,
          symbol: {
            shortName: `${pair.toUpperCase()}/USDT`,
            ticker: symbol,
            priceCurrency: 'USDT',
            type: 'spot',
          },
          styles: {
            grid: {
              show: true,
              horizontal: {
                show: true,
                size: 1,
                color: '#555',
                style: 'dashed',
                dashedValue: [2, 2]
              },
              vertical: {
                show: true,
                size: 1,
                color: '#555',
                style: '',
                dashedValue: [2, 2]
              }
            },
            candle: {
              type: candleType, // ← set from prop on load
              bar: {
                // Choose your rule: 'current_open' or 'previous_close'
                compareRule: 'current_open',

                // Set your desired colors:
                upColor,
                downColor,
                noChangeColor,

                upBorderColor,
                downBorderColor,
                noChangeBorderColor,

                upWickColor,
                downWickColor,
                noChangeWickColor,
              },
              priceMark: {
                last: {
                  line: {
                    size: 1,                // line thickness
                    style: 'dashed',         // line style: 'solid', 'dashed', etc.
                  },
                  text: {
                    color: '#374151',
                    fontFamily: "'Sofia Sans Condensed', Arial, sans-serif",
                  }
                }
              },

            },
            fontFamily: "'Sofia Sans Condensed', Arial, sans-serif",
          },
          mainIndicators,
          subIndicators,
        });

        // 2. Immediately set canvas text fonts (including price mark)
        const chart = chartInstanceRef.current;
        const s = chart.getStyles();              // 1) start from current styles
        const FONT = "'Sofia Sans Condensed', Arial, sans-serif";

        /* x/y axis */
        // Hide axis baseline lines (styles)
        s.xAxis = {
          ...(s.xAxis ?? {}),
          axisLine: { ...(s.xAxis?.axisLine ?? {}), show: false }, // v9/v10
          line: { ...(s.xAxis?.line ?? {}), show: false }, // fallback for some builds
          tickLine: { ...(s.xAxis?.tickLine ?? {}), show: false }, // optional
        };

        s.yAxis = {
          ...(s.yAxis ?? {}),
          axisLine: { ...(s.yAxis?.axisLine ?? {}), show: false },
          line: { ...(s.yAxis?.line ?? {}), show: false },
          tickLine: { ...(s.yAxis?.tickLine ?? {}), show: false }, // optional
        };

        /* axis tick label fonts (date & value) */
        s.xAxis = s.xAxis ?? {};
        s.xAxis.tickText = {
          ...(s.xAxis.tickText ?? {}),
          family: FONT,
          size: 12,
          color: '#D1D5DB',
        };

        s.yAxis = s.yAxis ?? {};
        s.yAxis.tickText = {
          ...(s.yAxis.tickText ?? {}),
          family: FONT,
          size: 12,
          color: '#D1D5DB',
        };
        /* crosshair */
        s.crosshair = s.crosshair ?? {};
        s.crosshair.horizontal = {
          ...(s.crosshair.horizontal ?? {}),
          text: { ...(s.crosshair.horizontal?.text ?? {}), family: FONT, size: 12 }
        };
        s.crosshair.vertical = {
          ...(s.crosshair.vertical ?? {}),
          text: { ...(s.crosshair.vertical?.text ?? {}), family: FONT, size: 12 }
        };

        /* candle.priceMark (keep dashed line + font) */
        s.candle = s.candle ?? {};
        s.candle.priceMark = {
          ...(s.candle.priceMark ?? {}),
          last: {
            ...(s.candle.priceMark?.last ?? {}),
            line: { ...(s.candle.priceMark?.last?.line ?? {}), style: 'dashed', size: 1 },
            text: {
              ...(s.candle.priceMark?.last?.text ?? {}),
              family: FONT,
              size: 12,
              color: '#000000',
              weight: 800, // Set the font weight to bold
            },
          },
        };

        /* candle.tooltip (the “Time / Open / High / Low / Close / Volume” row) */
        s.candle.tooltip = {
          ...(s.candle.tooltip ?? {}),
          showRule: 'always',
          showType: 'standard',
          // v10+:
          title: { ...(s.candle.tooltip?.title ?? {}), family: FONT, size: 13, color: '#9CA3AF' },
          legend: {
            ...(s.candle.tooltip?.legend ?? {}),
            family: FONT, size: 12, color: '#E5E7EB',
            template: [
              { title: { text: 'Time', color: '#9CA3AF' }, value: { text: '{time}', color: '#F3F4F6' } },
              { title: { text: 'Open', color: '#9CA3AF' }, value: { text: '{open}', color: '#F3F4F6' } },
              { title: { text: 'High', color: '#9CA3AF' }, value: { text: '{high}', color: '#34D399' } },
              { title: { text: 'Low', color: '#9CA3AF' }, value: { text: '{low}', color: '#F87171' } },
              { title: { text: 'Close', color: '#9CA3AF' }, value: { text: '{close}', color: '#F3F4F6' } },
              { title: { text: 'Vol', color: '#9CA3AF' }, value: { text: '{volume}', color: '#F3F4F6' } },
            ],
          },
          // v9 fallback (ignored by v10+; harmless to include):
          text: { ...(s.candle.tooltip?.text ?? {}), family: FONT, size: 12, color: '#E5E7EB' },
        };

        /* (optional) indicator tooltip if your build renders OHLC through it */
        s.indicator = s.indicator ?? {};
        s.indicator.tooltip = {
          ...(s.indicator.tooltip ?? {}),
          title: { ...(s.indicator.tooltip?.title ?? {}), family: FONT, size: 12, color: '#9CA3AF' },
          legend: { ...(s.indicator.tooltip?.legend ?? {}), family: FONT, size: 12, color: '#E5E7EB' },
          text: { ...(s.indicator.tooltip?.text ?? {}), family: FONT, size: 12, color: '#E5E7EB' },
        };

        /* finally apply once */
        chart.setStyles(s);

        // GRID lines across the pane
        chart.setStyles({
          grid: {
            show: true,
            horizontal: {
              show: true,
              size: 1,                            // Line thickness
              style: 'solid',                    // 'solid' | 'dashed'
              dashedValue: [3, 3],                // Dash pattern when dashed
              color: '#00505c50',      // Horizontal grid line color
            },
            vertical: {
              show: true,
              size: 1,
              style: 'solid',
              dashedValue: [2, 2],
              color: '00505c50',      // Vertical grid line color
            },
          },
        });

        // CROSSHAIR lines (mouse-follow)
        chart.setStyles({
          crosshair: {
            horizontal: {
              line: {
                color: '#ffffff3d',                 // Horizontal crosshair line color
                size: 1,                          // Line thickness
                style: 'dashed',                  // 'solid' | 'dashed'
                dashedValue: [2, 2],              // Dash pattern
              },
              // Optional: Small price label box
              text: {
                color: '#E5E7EB',
                family: "'Sofia Sans Condensed', Arial, sans-serif",
                size: 12,
                paddingLeft: 6, paddingRight: 6, paddingTop: 3, paddingBottom: 3,
                borderRadius: 4, borderSize: 1, borderColor: '#1F2937',
                backgroundColor: 'rgba(2,0,27,0.85)',
              },
            },
            vertical: {
              line: {
                color: '#ffffff3d',                 // Vertical crosshair line color
                size: 1,
                style: 'dashed',
                dashedValue: [2, 2],
              },
              // Optional: Small time label box
              text: {
                color: '#E5E7EB',
                family: "'Sofia Sans Condensed', Arial, sans-serif",
                size: 12,
                paddingLeft: 6, paddingRight: 6, paddingTop: 3, paddingBottom: 3,
                borderRadius: 4, borderSize: 1, borderColor: '#1F2937',
                backgroundColor: 'rgba(2,0,27,0.85)',
              },
            },
          },
        });
      });

      feed.subscribe(() => { });

      return () => {
        isMounted = false;
        if (
          chartInstanceRef.current &&
          typeof chartInstanceRef.current.dispose === 'function'
        ) {
          chartInstanceRef.current.dispose();
          chartInstanceRef.current = null;
        }
        feed.destroy();
      };
    })();

  }, [interval, pair, red, green, indicatorToggles]);
  // Apply timezone changes without rebuilding the chart
  useEffect(() => {
    tzRef.current = timeZone;
    const chart = chartInstanceRef.current;
    if (!chart) return;
    // If your build has a native API:
    if (typeof chart.setTimezone === 'function') {
      chart.setTimezone(timeZone);
      return;
    }
    // Otherwise, nudge a lightweight redraw so formatter runs again:
    try {
      const s = chart.getStyles();
      chart.setStyles(s);
    } catch { }
  }, [timeZone]);
  // Allow changing candleType without remounting the chart
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;
    chart.setStyles({ candle: { type: candleType } });
  }, [candleType]);
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || !chartSettings) return;

    const {
      grid_show,
      reverse_coordinate,
      price_axis_type,
      last_price_show,
      high_price_show,
      low_price_show,
      indicator_last_value_show,
    } = chartSettings;

    const patch = {
      grid: { show: !!grid_show },
      yAxis: {
        reverse: !!reverse_coordinate,
        type: price_axis_type || 'normal',
      },
      candle: {
        priceMark: {
          last: { ...(chart.getStyles()?.candle?.priceMark?.last || {}), show: !!last_price_show },
          high: { ...(chart.getStyles()?.candle?.priceMark?.high || {}), show: !!high_price_show },
          low: { ...(chart.getStyles()?.candle?.priceMark?.low || {}), show: !!low_price_show },
        },
      },
      indicator: {
        lastValueMark: { show: !!indicator_last_value_show },
      },
    };

    chart.setStyles(patch);
  }, [chartSettings]);
  return (
    <div className="bg-backgroundmid rounded-md h-full">
      <div
        ref={chartRef}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
        }}
      />
    </div>
  );
}
export default forwardRef(KlineChartProPanel);