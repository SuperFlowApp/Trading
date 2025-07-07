import { useEffect, useRef, useState } from 'react';
const getRestUrl = (interval) =>
  `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=500`;
const getWsUrl = (interval) =>
  `wss://stream.binance.com:9443/ws/btcusdt@kline_${interval}`;

const INTERVALS = ['1m', '5m', '15m', '1h', '4h']; // Add more as needed

const KlineChartProPanel = () => {
  const [interval, setInterval] = useState('5m');
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      const res = await fetch(getRestUrl(interval));
      const data = await res.json();
      const history = data.map((k) => ({
        timestamp: k[0],
        open: Number(k[1]),
        high: Number(k[2]),
        low: Number(k[3]),
        close: Number(k[4]),
        volume: Number(k[5]),
        turnover: Number(k[7]),
      }));
      class SimpleBinanceDatafeed {
        constructor() {
          this.subscribers = [];
          this.history = [];
          this.ws = null;
        }

        async getHistoryKLineData(symbol, period, from, to) {
          const binanceInterval = period.text; // Use selected timeframe
          const url = getRestUrl(binanceInterval);
          const res = await fetch(url);
          const data = await res.json();
          this.history = data.map(k => ({
            timestamp: k[0],
            open: +k[1],
            high: +k[2],
            low: +k[3],
            close: +k[4],
            volume: +k[5],
            turnover: +k[7],
          }));
          this.initWebSocket(binanceInterval);
          return this.history;
        }

        subscribe(symbol, period, callback) {
          this.subscribers.push(callback);
          if (this.history.length) callback(this.history, true);
        }

        unsubscribe(symbol, period) {
          this.subscribers = [];
          if (this.ws) this.ws.close();
        }

        initWebSocket(binanceInterval) {
          if (this.ws) this.ws.close();
          this.ws = new WebSocket(getWsUrl(binanceInterval));
          this.ws.onmessage = event => {
            const msg = JSON.parse(event.data);
            if (msg.k) {
              const k = msg.k;
              const bar = {
                timestamp: k.t, open: +k.o, high: +k.h,
                low: +k.l, close: +k.c, volume: +k.v,
                turnover: +k.q,
              };
              const h = this.history;
              if (h.length && h[h.length - 1].timestamp === bar.timestamp) {
                h[h.length - 1] = bar;
              } else {
                h.push(bar);
                if (h.length > 500) h.shift();
              }
              this.subscribers.forEach(cb => cb([bar], false));
            }
          };
        }
      }


      // 3. Only import and create chart after history is ready.
      import('https://cdn.skypack.dev/@klinecharts/pro').then((kline) => {
        if (!isMounted) return;
        if (chartInstanceRef.current) {
          chartInstanceRef.current.dispose();
        }
        chartInstanceRef.current = new kline.KLineChartPro({
          container: chartRef.current,
          locale: 'en-US',
          symbol: {
            shortName: 'BTC/USDT',
            ticker: 'BTCUSDT',
            priceCurrency: 'USDT',
            type: 'spot',
          },
          period: { multiplier: 1, timespan: 'minute', text: '5m' },
          datafeed: new SimpleBinanceDatafeed(history),
          styles: {
            grid: {
              show: true,
              horizontal: {
                show: true,
                size: 1,
                color: '#555',
                style: 'dashed',
                dashedValue: [2, 2],
              },
              vertical: {
                show: true,
                size: 1,
                color: '#555',
                style: 'dashed',
                dashedValue: [2, 2],
              },
            },
          },
          indicators: [{ name: 'MA' }],
        });
      });
    };

    fetchHistory(); // Only call chart code after data is loaded!

    return () => {
      isMounted = false;
      if (wsRef.current) wsRef.current.close();
      if (chartInstanceRef.current) chartInstanceRef.current.dispose();
    };
  }, [interval]); // ← NOTE: depends on interval!

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: '500px',
        background: 'transparent',
        '--klinecharts-pro-border-color': '#565A93', // Add this line
      }}
    />
  );
};

export default KlineChartProPanel;
