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
  }

  async getHistoryKLineData(symbol, period, from, to) {
    const url = REST_URL(this.pair, period.text);
    const res = await fetch(url);
    const data = await res.json();
    this.history = data.map(k => ({
      timestamp: k[0],
      open: +k[1],
      high: +k[2],
      low: +k[3],
      close: +k[4],
      volume: +k[5],
    }));
    this.initWs(period.text);
    return this.history;
  }

  subscribe(symbol, period, callback) {
    this.subscribers.push(callback);
    // Only send history on subscribe
    if (this.history.length) {
      callback(this.history, true);
    }
  }

  unsubscribe() {
    this.subscribers = [];
    if (this.ws) this.ws.close();
  }

  initWs(interval) {
    if (this.ws) {
      this.ws.close();
    }
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
      // Send ONLY the latest bar, and as a single object, not array, and isHistory=false!
      this.subscribers.forEach(cb => cb(bar, false));
    };

    this.ws.onclose = () => setTimeout(() => this.initWs(interval), 1000);
    this.ws.onerror = () => this.ws.close();
  }
}


export default function KlineChartProPanel({ selectedPair }) {
  const { base } = useParams(); // e.g., { base: 'BTC' }
  const [interval, setInterval] = useState('5m');
  const [pair, setPair] = useState(selectedPair || base || 'BTC'); // Default to BTC if not set
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const feed = new BinanceFeed(pair);

    const symbol = `${pair.toUpperCase()}USDT`;

    feed.getHistoryKLineData(symbol, { text: interval }).then(() => {
      if (!isMounted) return;
      import('https://cdn.skypack.dev/@klinecharts/pro').then(kline => {
        if (!isMounted) return;
        chartInstanceRef.current?.dispose();

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

    return () => {
      isMounted = false;
      chartInstanceRef.current?.dispose();
      feed.unsubscribe();
    };
  }, [interval, pair]);

  // Example: update pair from infobar
  const handlePairChange = (newPair) => {
    setPair(newPair);
  };

  return (
    <div>
      {/* Example infobar for changing pair */}
      {/* <Infobar onPairChange={handlePairChange} /> */}
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
