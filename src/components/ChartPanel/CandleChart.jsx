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

const timeframes = [
  '1m', '5m', '10m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '3d', '1w', '1M'
];

const chartTypes = [
  { label: 'Candlestick', value: 'candlestick' },
  { label: 'Line Chart', value: 'line' },
  { label: 'Area Chart', value: 'area' },
  { label: 'Column Chart', value: 'bar' },
  { label: 'Range Area Chart', value: 'rangeArea' }
];

const CandleChart = ({ selectedPair }) => {
  const [timeframe, setTimeframe] = useState('1m');
  const [chartType, setChartType] = useState('candlestick');
  const [candles, setCandles] = useState([]);
  const [volume, setVolume] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let destroyed = false;

    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(
          `https://fastify-serverless-function-rimj.onrender.com/api/ohlcv?symbol=${selectedPair}&timeframe=${timeframe}&limit=100`
        );
        const data = await res.json();

        const candleData = data.map(d => ({
          x: d.timestamp,
          y: [
            parseFloat(d.open),
            parseFloat(d.high),
            parseFloat(d.low),
            parseFloat(d.close)
          ]
        }));

        const volumeData = data.map(d => ({
          x: d.timestamp,
          y: parseFloat(d.volume)
        }));

        if (!destroyed) {
          setCandles(candleData);
          setVolume(volumeData);
          setLoading(false);
        }
      } catch (err) {
        if (!destroyed) setLoading(false);
        console.error('Failed to fetch chart data:', err);
      }
    }

    fetchData();
    return () => { destroyed = true; };
  }, [selectedPair, timeframe]);

  const commonXaxis = {
    type: 'datetime',
    labels: { style: { colors: '#aaa' } },
    axisBorder: { color: '#333' },
    axisTicks: { color: '#333' }
  };

  // Prepare data for different chart types
  const getMainChartSeries = () => {
    if (chartType === 'candlestick') {
      return [{ name: 'Candles', data: candles }];
    }
    if (chartType === 'line') {
      return [{
        name: 'Close',
        data: candles.map(c => ({ x: c.x, y: c.y[3] }))
      }];
    }
    if (chartType === 'area') {
      return [{
        name: 'Close',
        data: candles.map(c => ({ x: c.x, y: c.y[3] }))
      }];
    }
    if (chartType === 'bar' || chartType === 'column') {
      return [{
        name: 'Close',
        data: candles.map(c => ({ x: c.x, y: c.y[3] }))
      }];
    }
    if (chartType === 'rangeArea') {
      return [{
        name: 'Range',
        data: candles.map(c => ({ x: c.x, y: [c.y[2], c.y[1]] })) // [low, high]
      }];
    }
    return [];
  };

  // Chart options based on type
  const getMainChartOptions = () => {
    let base = {
      chart: {
        type: chartType === 'column' ? 'bar' : chartType,
        height: 350,
        id: 'main',
        background: 'transparent',
        toolbar: {
          autoSelected: 'zoom',
          tools: { pan: true, zoom: true, zoomin: true, zoomout: true, reset: true },
          show: true,
        }
      },
      xaxis: commonXaxis,
      yaxis: {
        tooltip: { enabled: true },
        labels: { style: { colors: '#aaa' } }
      },
      grid: { borderColor: '#2c2c2c', strokeDashArray: 3 },
      tooltip: {
        theme: 'dark',
        x: { format: 'dd MMM HH:mm' },
        y: {
          formatter: (val) => typeof val === 'number' ? `$${val.toFixed(2)}` : ''
        }
      },
      legend: { show: false }
    };

    if (chartType === 'candlestick') {
      base.plotOptions = {
        candlestick: {
          colors: { upward: '#2D9DA8', downward: '#F59DEF' }
        }
      };
    }
    if (chartType === 'area') {
      base.colors = ['#2D9DA8'];
      base.fill = { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2 } };
    }
    if (chartType === 'line') {
      base.colors = ['#2D9DA8'];
    }
    if (chartType === 'bar' || chartType === 'column') {
      base.colors = ['#2D9DA8'];
      base.plotOptions = { bar: { columnWidth: '60%' } };
    }
    if (chartType === 'rangeArea') {
      base.colors = ['#F59DEF'];
      base.fill = { type: 'solid', opacity: 0.3 };
      base.stroke = { curve: 'smooth', width: 2 };
    }
    return base;
  };

  return (
    <div className="chart-container" style={{ background: 'transparent', borderRadius: 8, padding: 8 }}>
      <div style={{ marginBottom: 8, display: 'flex', gap: 10 }}>
        <select
          value={timeframe}
          onChange={e => setTimeframe(e.target.value)}
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
          {timeframes.map(tf => (
            <option key={tf} value={tf} style={{ color: '#fff' }}>
              {tf}
            </option>
          ))}
        </select>
        <select
          value={chartType}
          onChange={e => setChartType(e.target.value)}
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
          {chartTypes.map(type => (
            <option key={type.value} value={type.value} style={{ color: '#fff' }}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner
          size="medium"
          message="Loading chart data..."
          height="500px"
          variant="chart"
        />
      ) : (
        <div>
          {/* Top: Main Chart */}
          <Chart
            options={getMainChartOptions()}
            series={getMainChartSeries()}
            type={chartType === 'column' ? 'bar' : chartType}
            height={350}
          />

          {/* Bottom: Volume Chart */}
          <Chart
            options={{
              chart: {
                type: 'bar',
                height: 120,
                id: 'volume',
                background: 'transparent',
                toolbar: { show: false },
                zoom: { enabled: false }
              },
              xaxis: commonXaxis,
              yaxis: {
                show: true,
                labels: { style: { colors: '#aaa' } }
              },
              colors: ['#2D9DA8'],
              grid: { borderColor: '#2c2c2c', strokeDashArray: 3 },
              tooltip: {
                theme: 'dark',
                x: { format: 'dd MMM HH:mm' },
                y: {
                  formatter: (val) => typeof val === 'number' ? val.toFixed(0) : ''
                }
              },
              legend: { show: false }
            }}
            series={[{ name: 'Volume', data: volume }]}
            type="bar"
            height={120}
          />
        </div>
      )}
    </div>
  );
};

export default CandleChart;
