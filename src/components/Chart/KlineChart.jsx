import { useEffect, useRef, useState } from 'react';
import useUserInputStore from '../../Zustandstore/userInputStore.js'; 
import { KLineChartPro } from "@klinecharts/pro";
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
      // Only close if already OPEN
      if (this.ws.readyState === 1) {
        this.ws.close();
      }
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
      // Only close if already OPEN
      if (this.ws.readyState === 1) {
        this.ws.close();
      }
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

export default function KlineChartProPanel({ interval = '5m' }) {
  const selectedPairBase = useUserInputStore(s => s.selectedPair);
  const [pair, setPair] = useState(selectedPairBase);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Update pair when Zustand state changes
  useEffect(() => {
    setPair(selectedPairBase);
  }, [selectedPairBase]);

  useEffect(() => {
    let isMounted = true;
    const feed = new BinanceFeed(pair);

    const symbol = `${pair.toUpperCase()}USDT`;

    feed.getHistoryKLineData(symbol, { text: interval }).then(() => {
      if (!isMounted) return;

      // Clear the chart container before creating a new chart
      if (chartRef.current) {
        chartRef.current.innerHTML = '';
      }

      // Suppress KLineChartPro welcome message
      const originalConsoleLog = console.log;
      console.log = function () {};

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
          { multiplier: 30, timespan: 'minute', text: '30m' },
          { multiplier: 1, timespan: 'hour', text: '1h' },
          { multiplier: 4, timespan: 'hour', text: '4h' },
          { multiplier: 8, timespan: 'hour', text: '8h' },
          { multiplier: 1, timespan: 'month', text: '1M' },
        ],
        period: { text: interval }, // use prop
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
            horizontal: { show: true, size: 1, color: '#555', style: 'dashed', dashedValue: [2, 2] },
            vertical: { show: true, size: 1, color: '#555', style: 'dashed', dashedValue: [2, 2] },
          },
        },
        indicators: [{ name: 'MA' }],
      });

      // Restore console.log
      console.log = originalConsoleLog;
    });

    // No need to subscribe to live updates for lastPrice
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