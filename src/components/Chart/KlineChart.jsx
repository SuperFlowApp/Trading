import { useEffect, useRef, useState } from 'react';
import { selectedPairStore } from '../../Zustandstore/userOrderStore'
import { KLineChartPro } from '@klinecharts/pro';
import './klinecharts-pro.min.css';

const REST_URL = (pair, interval) =>
  `https://api.binance.com/api/v3/klines?symbol=${pair.toUpperCase()}USDT&interval=${interval}&limit=500`;
const WS_URL = (pair, interval) =>
  `wss://stream.binance.com:9443/ws/${pair.toLowerCase()}usdt@kline_${interval}`;



class BinanceFeed {
  constructor(pair) {
    this.pair = pair;
    this.subscribers = [];
    this.history = [];
    this.ws = null;
    this.shouldReconnect = true;
  }


  // Call this on React cleanup to stop everything
  destroy() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.subscribers = [];
  }

  initWs(interval) {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }
    this.shouldReconnect = true;
    this.ws = new WebSocket(WS_URL(this.pair, interval));
    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (!msg.k) return;
      const k = msg.k;
      const bar = {
        timestamp: k.t,
        open: +k.o,
        high: +k.h,
        low: +k.l,
        close: +k.c,
        volume: +k.v
      };

      // Update local history
      const h = this.history;
      if (h.length && h[h.length - 1].timestamp === bar.timestamp) {
        h[h.length - 1] = bar;
      } else {
        h.push(bar);
        if (h.length > 500) h.shift();
      }
      // Only call function subscribers
      this.subscribers.forEach(cb => {
        if (typeof cb === 'function') cb(bar, false);
      });
    };

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        setTimeout(() => this.initWs(interval), 1000);
      }
    };
    this.ws.onerror = () => {
      if (this.ws) this.ws.close();
    };
  }

  async getHistoryKLineData(symbol, period, from, to) {
    const res = await fetch(REST_URL(this.pair, period.text));
    const data = await res.json();
    this.history = data.map(d => ({
      timestamp: d[0],
      open: +d[1],
      high: +d[2],
      low: +d[3],
      close: +d[4],
      volume: +d[5],
    }));
    this.initWs(period.text);
    // return full bar array
    return this.history;
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
}
export default function KlineChartProPanel({ interval }) {
  const selectedPairBase = selectedPairStore(s => s.selectedPair);
  const [pair, setPair] = useState(selectedPairBase);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Update pair when Zustand state changes
  useEffect(() => {
    setPair(selectedPairBase);
  }, [selectedPairBase]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      // 1. Wait for your font to be loaded before creating the chart
      if (document.fonts?.ready) {
        await document.fonts.ready;
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

        chartInstanceRef.current = new KLineChartPro({
          container: chartRef.current,
          locale: 'en-US',
          formatter: {
            formatDate: (timestamp, format, type) => {
              const options = (type === 'time')
                ? { hour: '2-digit', minute: '2-digit', hour12: false }
                : { year: 'numeric', month: '2-digit', day: '2-digit' };
              return new Date(timestamp).toLocaleString('en-US', options);
            }
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
              type: 'candle_solid', // or your preferred type
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
          // disable default indicators (remove MA on load)
          mainIndicators: [],   // nothing on the main candle pane
          subIndicators: [],    // no sub-pane indicators
          // Only one indicators line if you want MA
          // indicators: [{ name: 'MA' }],
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

  }, [interval, pair]);

  return (
    <div className="bg-backgroundmid rounded-md ">
      <div
        ref={chartRef}
        style={{
          width: '100%',
          height: '500px',
          background: 'transparent',
        }}
      />
    </div>
  );
}