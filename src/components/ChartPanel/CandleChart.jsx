// src/CandleChart.jsx

import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import LoadingSpinner from '../LoadingSpinner';
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
  const [showCandle, setShowCandle] = useState(true); // Default to candlestick chart
  const [showLine, setShowLine] = useState(false);    // Disable line chart by default
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let destroyed = false;

    async function fetchCandles() {
      try {
        setLoading(true);
        const res = await fetch(
          `https://fastify-serverless-function-rimj.onrender.com/api/ohlcv?symbol=${selectedPair}&timeframe=${timeframe}&limit=100`
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

        if (!destroyed) {
          setCandles(formatted);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch candles:', err);
        if (!destroyed) setLoading(false);
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
          // Hide built-in chart type toggle
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
          disabled={loading}
          style={{
            backgroundColor: '#02001B',
            color: '#8AABB2',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #565A93',
            fontSize: '12px',
            outline: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
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
          disabled={loading}
          style={{
            backgroundColor: '#02001B',
            color: '#8AABB2',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #565A93',
            fontSize: '12px',
            outline: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
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

      {loading ? (
        <LoadingSpinner 
          size="medium"
          message="Loading chart data..."
          height="450px"
          variant="chart"
        />
      ) : (
        <Chart
          key={`${showCandle}-${showLine}-${timeframe}`} // force re-init on toggle
          options={options}
          series={series}
          type={rootChartType}
          height={450}
        />
      )}
    </div>
  );
};

export default CandleChart;
