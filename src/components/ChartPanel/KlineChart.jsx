import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom'; // Add this import

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
    this.ws.onerror = () => this.ws.close();
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


// ...existing imports and BinanceFeed...

export default function KlineChartProPanel({ selectedPair }) {
  const { base } = useParams();
  const [interval] = useState('5m');
  const [pair, setPair] = useState(selectedPair || base || 'BTC');
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // NEW: State for last price
  const [lastPrice, setLastPrice] = useState(null);

  useEffect(() => {
    setPair(selectedPair || base || 'BTC');
  }, [selectedPair, base]);

  useEffect(() => {
    let isMounted = true;
    const feed = new BinanceFeed(pair);

    const symbol = `${pair.toUpperCase()}USDT`;

    feed.getHistoryKLineData(symbol, { text: interval }).then(() => {
      if (!isMounted) return;
      import('https://cdn.skypack.dev/@klinecharts/pro').then(kline => {
        if (!isMounted) return;

        // Clear the chart container before creating a new chart
        if (chartRef.current) {
          chartRef.current.innerHTML = '';
        }

        chartInstanceRef.current = new kline.KLineChartPro({
          container: chartRef.current,
          locale: 'en-US',
          symbol: {
            shortName: `${pair.toUpperCase()}/USDT`,
            ticker: symbol,
            priceCurrency: 'USDT',
            type: 'spot',
          },
          period: { multiplier: 1, timespan: 'minute', text: interval },
          datafeed: feed,
          styles: {
            grid: {
              show: true,
              horizontal: { show: true, size: 1, color: '#555', style: 'dashed', dashedValue: [2, 2] },
              vertical: { show: true, size: 1, color: '#555', style: 'dashed', dashedValue: [2, 2] },
            },
          },
          indicators: [{ name: 'MA' }],
        });
      });
    });

    // Subscribe to live updates and update lastPrice
    const handleBar = (bar, isHistory) => {
      if (!isHistory) setLastPrice(bar.close);
    };
    feed.subscribe(handleBar);

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
    <div>
      <div>
        <strong>Last live price:</strong>{' '}
        {lastPrice !== null ? lastPrice : 'Waiting for update...'}
      </div>
      <div
        ref={chartRef}
        style={{
          width: '100%',
          height: '500px',
          background: 'transparent',
          '--klinecharts-pro-border-color': 'transparent',
        }}
      />
    </div>
  );
}