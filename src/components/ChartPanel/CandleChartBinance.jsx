// src/CandleChart.jsx

import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import './chart-styles.css';
import ReconnectingWebSocket from 'reconnecting-websocket'; // Add this at the top (install with: npm i reconnecting-websocket)

const getTimeframeMs = (tf) => {
  const map = {
    '1m': 60_000,
    '5m': 5 * 60_000,
    '10m': 10 * 60_000,
    '15m': 15 * 60_000,
    '30m': 30 * 60_000,
    '1h': 60 * 60_000,
    '2h': 2 * 60 * 60_000,
    '4h': 4 * 60 * 60_000,
    '6h': 6 * 60 * 60_000,
    '12h': 12 * 60 * 60_000,
    '1d': 24 * 60 * 60_000,
    '3d': 3 * 24 * 60 * 60_000,
    '1w': 7 * 24 * 60 * 60_000,
    '1M': 30 * 24 * 60 * 60_000,
  };
  return map[tf] || 60_000;
};

const CandleChart = ({ selectedPair }) => {
  const [timeframe, setTimeframe] = useState('1m');
  const [candles, setCandles] = useState([]);
  const [showCandle, setShowCandle] = useState(true);
  const [showLine, setShowLine] = useState(false);

  // --- Add this block to compute dynamic y-axis range ---
  const visibleCandles = candles.slice(-20); // last 20 candles for more responsive scaling
  let minY = null, maxY = null;
  if (visibleCandles.length > 0) {
    // Use only low (c.y[2]) and high (c.y[1]) for min/max
    minY = Math.min(...visibleCandles.map(c => c.y[1]));
    maxY = Math.max(...visibleCandles.map(c => c.y[1]));
    // Add margin
    const margin = (maxY - minY) * 1 || 1;
    minY -= margin;
    maxY += margin;
  }
  // ------------------------------------------------------

  useEffect(() => {
    let ws;
    let destroyed = false;

    // Helper to convert timeframe to Binance interval
    const tfMap = {
      '1m': '1m', '5m': '5m', '10m': '10m', '15m': '15m', '30m': '30m',
      '1h': '1h', '2h': '2h', '4h': '4h', '6h': '6h', '12h': '12h',
      '1d': '1d', '3d': '3d', '1w': '1w', '1M': '1M'
    };

    // Format symbol for Binance (e.g., BTCUSDT)
    const symbol = selectedPair.replace('/', '').toLowerCase();

    // Fetch historical candles for initial load (Binance REST API)
    async function fetchInitialCandles() {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${tfMap[timeframe]}&limit=100`
        );
        const data = await res.json();
        const formatted = data.map((candle) => ({
          x: candle[0],
          y: [
            parseFloat(candle[1]),
            parseFloat(candle[2]),
            parseFloat(candle[3]),
            parseFloat(candle[4]),
          ],
        }));
        if (!destroyed) setCandles(formatted);
      } catch (err) {
        console.error('Failed to fetch candles:', err);
      }
    }

    fetchInitialCandles();

    // Subscribe to live updates via WebSocket
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_${tfMap[timeframe]}`;
    ws = new ReconnectingWebSocket(wsUrl);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.k) {
        const k = msg.k;
        const newCandle = {
          x: k.t,
          y: [
            parseFloat(k.o),
            parseFloat(k.h),
            parseFloat(k.l),
            parseFloat(k.c),
          ],
        };
        // Update last candle if same timestamp, else append
        setCandles((prev) => {
          if (!prev.length) return [newCandle];
          if (prev[prev.length - 1].x === newCandle.x) {
            return [...prev.slice(0, -1), newCandle];
          }
          if (newCandle.x > prev[prev.length - 1].x) {
            // Keep only last 100
            return [...prev.slice(-99), newCandle];
          }
          return prev;
        });
      }
    };

    return () => {
      destroyed = true;
      if (ws) ws.close();
    };
  }, [timeframe, selectedPair]);

  const lineSeries = candles.map((c) => ({
    x: c.x,
    y: c.y[3],
  }));

  const series = [
    ...(showCandle ? [{ name: 'candles', type: 'candlestick', data: candles }] : []),
    ...(showLine ? [{ name: 'line', type: 'line', data: lineSeries }] : []),
    ...(!showCandle && !showLine && timeframe === 'bar' ? [{ name: 'bar', type: 'bar', data: candles }] : []),
    ...(!showCandle && !showLine && timeframe !== 'bar' ? [{ name: 'area', type: 'area', data: lineSeries }] : []),
  ];

  const rootChartType =
    showCandle && !showLine ? 'candlestick' :
      !showCandle && showLine ? 'line' :
        !showCandle && !showLine && timeframe === 'bar' ? 'bar' :
          'area';
  const tooltipShared = showCandle && !showLine ? false : true;

  const options = {
    chart: {
      height: 350,
      type: rootChartType,
      background: 'transparent',
      animations: { enabled: false },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
          customIcons: []
        },
        autoSelected: 'zoom',
      },
    },
    colors: ['#2D9DA8', '#F59DEF'],
    stroke: { width: [1, 2], curve: 'smooth' },
    xaxis: {
      type: 'datetime',
      labels: { datetimeUTC: false, style: { colors: '#aaa' } },
      axisBorder: { color: '#333' },
      axisTicks: { color: '#333' },
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        formatter: (val) => val.toFixed(2),
        style: { colors: '#aaa' },
      },
      min: minY, // <-- dynamic min
      max: maxY, // <-- dynamic max
    },
    tooltip: {
      shared: tooltipShared,
      theme: 'dark',
      x: { format: 'dd MMM HH:mm' },
      y: {
        formatter: (val) => {
          if (typeof val === 'number') return `$${val.toFixed(2)}`;
          return '';
        },
      },
    },
    plotOptions: {
      candlestick: {
        colors: { upward: '#2D9DA8', downward: '#F59DEF' },
      },
    },
    grid: { borderColor: '#2c2c2c', strokeDashArray: 3 },
    legend: {
      show: false, // Disable the legend
    },
  };

  const timeframes = ['1m', '5m', '10m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '3d', '1w', '1M'];

  return (
    <div id="chart" className=" chart-style relative pt-[6px]">
      <div style={{ marginBottom: '8px', display: 'flex', gap: '10px' }}>
        {/* Timeframe Selector */}
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          style={{
            backgroundColor: '#02001B',
            color: '#8AABB2',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #565A93',
            fontSize: '12px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {timeframes.map((tf) => (
            <option key={tf} value={tf} style={{ color: '#fff' }}>
              {tf}
            </option>
          ))}
        </select>

        {/* Chart Type Selector */}
        <select
          value={`${showCandle}-${showLine}`}
          onChange={(e) => {
            const [candle, line] = e.target.value.split('-').map((v) => v === 'true');
            setShowCandle(candle);
            setShowLine(line);
          }}
          style={{
            backgroundColor: '#02001B',
            color: '#8AABB2',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #565A93',
            fontSize: '12px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="true-false" style={{ color: '#fff' }}>
            Candlestick Only
          </option>
          <option value="false-true" style={{ color: '#fff' }}>
            Line Only
          </option>
          <option value="true-true" style={{ color: '#fff' }}>
            Candlestick & Line
          </option>
          <option value="false-false" style={{ color: '#fff' }}>
            Area Chart
          </option>
          
        </select>
      </div>

      <Chart
        key={`${showCandle}-${showLine}-${timeframe}`} // force re-init on toggle
        options={options}
        series={series}
        type={rootChartType}
        height={450}
      />
    </div>
  );
};

export default CandleChart;
