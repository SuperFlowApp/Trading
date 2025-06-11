// src/CandleChart.jsx

import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import './chart-styles.css';

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
  const [showLine, setShowLine] = useState(true);

  useEffect(() => {
    let destroyed = false;


    async function fetchCandles() {
      try {
        const res = await fetch( 
          `https://trading-eta-ten.vercel.app/api/ohlcv?symbol=${selectedPair}&timeframe=${timeframe}&limit=100`
        );
        const data = await res.json();

        const formatted = data.map((candle) => ({
          x: candle.timestamp,
          y: [
            parseFloat(candle.open),
            parseFloat(candle.high),
            parseFloat(candle.low),
            parseFloat(candle.close),
          ],
        }));

        if (!destroyed) setCandles(formatted);
      } catch (err) {
        console.error('Failed to fetch candles:', err);
      }
    }

    fetchCandles();

    return () => {
      destroyed = true;
    };
  }, [timeframe, selectedPair]);

  const lineSeries = candles.map((c) => ({
    x: c.x,
    y: c.y[3],
  }));

  const series = [
    ...(showCandle ? [{ name: 'candles', type: 'candlestick', data: candles }] : []),
    ...(showLine ? [{ name: 'line', type: 'line', data: lineSeries }] : []),
  ];

  const rootChartType =
    showCandle && !showLine ? 'candlestick' :
      !showCandle && showLine ? 'line' :
        'line';
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
          // Hide built-in chart type toggle
          customIcons: []
        },
        autoSelected: 'zoom',
      },

    },
    colors: ['#2D9DA8', '#ff000090'],
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
        colors: { upward: '#2D9DA8', downward: '#F5CB9D' },
      },
    },
    grid: { borderColor: '#2c2c2c', strokeDashArray: 3 },
  };

  const timeframes = ['1m', '5m', '10m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '3d', '1w', '1M'];

  return (
    <div id="chart" className="chart-style relative pt-[6px]">
      <div style={{ marginBottom: '8px', display: 'flex', gap: '10px' }}>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          style={{
            backgroundColor: '#111',
            color: '#ccc',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #2D9DA8',
            fontSize: '12px',
            outline: 'none',
          }}
        >
          {timeframes.map((tf) => (
            <option key={tf} value={tf} style={{ color: '#fff' }}>
              {tf}
            </option>
          ))}
        </select>

        {/* Chart type toggles */}
        <label className="hidden-label" style={{ color: '#ccc', fontSize: '12px' }}>
          <input
            type="checkbox"
            checked={showCandle}
            onChange={() => setShowCandle(!showCandle)}
            style={{ marginRight: '4px' }}
          />
          Candlestick
        </label>

        <label className="hidden-label" style={{ color: '#ccc', fontSize: '12px' }}>
          <input
            type="checkbox"
            checked={showLine}
            onChange={() => setShowLine(!showLine)}
            style={{ marginRight: '4px' }}
          />
          Line
        </label>
      </div>

      <Chart
        key={`${showCandle}-${showLine}-${timeframe}`} // force re-init on toggle
        options={options}
        series={series}
        type={rootChartType}
        height={350}
      />

    </div>
  );
};

export default CandleChart;
