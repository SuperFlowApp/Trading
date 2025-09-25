import React, { useEffect, useRef, useState } from "react";
import {
    createChart,
    CrosshairMode,
} from "lightweight-charts";

const intervals = [
    "1m", "5m", "15m", "1h", "4h", "1d"
];

const defaultSymbol = "BTCUSDT";
const defaultInterval = "1m";

const chartStyle = {
    width: "100%",
    height: "535px",
};

const topbarStyle = {
    position: "fixed",
    inset: "0 0 auto 0",
    height: 44,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 12px",
    background: "rgba(255,255,255,0.02)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(6px)",
    zIndex: 10,
};

const inputStyle = {
    background: "#121722",
    color: "#d1d4dc",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: "6px 8px",
};

const pageStyle = {
    paddingTop: 44,
};

export default function TradingViewLightChart({ interval: intervalProp }) {
    const chartContainerRef = useRef();
    const chartRef = useRef();
    const candleSeriesRef = useRef();

    const [symbol, setSymbol] = useState(defaultSymbol);
    const [interval, setInterval] = useState(intervalProp || defaultInterval);
    const [limit, setLimit] = useState(500);
    const [startTime, setStartTime] = useState(""); // unix timestamp (seconds)
    const [endTime, setEndTime] = useState("");     // unix timestamp (seconds)

    // Chart setup
    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: "solid", color: "#181923" },
                textColor: "#d1d4dc",
            },
            grid: {
                vertLines: { color: "#1f2937" },
                horzLines: { color: "#1f2937" },
            },
            rightPriceScale: { borderVisible: false },
            timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false },
            crosshair: { mode: CrosshairMode.Normal },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
        });
        chartRef.current = chart;

        const candleSeries = chart.addCandlestickSeries({
            upColor: "#26a69a",
            downColor: "#ef5350",
            borderDownColor: "#ef5350",
            borderUpColor: "#26a69a",
            wickDownColor: "#ef5350",
            wickUpColor: "#26a69a",
        });
        candleSeriesRef.current = candleSeries;

        // Fetch actual data from your server on mount
        handleLoad();

        // Responsive resize
        const handleResize = () => {
            chart.applyOptions({
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
            });
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, []);

    // Load Binance data
    const loadBinance = async (sym, intv, lim, start, end) => {
        let url = `https://fastify-serverless-function-rimj.onrender.com/api/klines?symbol=${sym}&timeframe=${intv}&limit=${lim}`;
        if (start) url += `&start_time=${start}`;
        if (end) url += `&end_time=${end}`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Network response was not ok");
            const raw = await res.json();
            // console.log("API raw response:", raw);
            // Defensive: check if raw is array and has expected structure
            if (!Array.isArray(raw) || !raw.length || !raw[0].openTime) throw new Error("Invalid data format");
            const mapped = raw.map(k => ({
                time: k.openTime, // already in seconds
                open: +k.open,
                high: +k.high,
                low: +k.low,
                close: +k.close
            }));
            candleSeriesRef.current.setData(mapped);
            chartRef.current.timeScale().fitContent();
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(err);
        }
    };

    // Sync interval prop with local state
    useEffect(() => {
        if (intervalProp && intervalProp !== interval) {
            setInterval(intervalProp);
        }
    }, [intervalProp]);

    // UI handlers
    const handleLoad = () => {
        loadBinance(
            symbol.trim().toUpperCase(),
            interval,
            limit,
            startTime ? startTime : undefined,
            endTime ? endTime : undefined
        );
    };

    useEffect(() => {
        if (!chartRef.current || !candleSeriesRef.current) return;
        handleLoad();
    }, [interval, symbol, limit, startTime, endTime]);

    return (
        <div>
            <div style={topbarStyle}>
                <label style={{ opacity: 0.8, fontSize: 13 }}>Pair</label>
                <input
                    style={inputStyle}
                    value={symbol}
                    size={10}
                    onChange={e => setSymbol(e.target.value)}
                />
                <label style={{ opacity: 0.8, fontSize: 13 }}>Limit</label>
                <input
                    style={inputStyle}
                    type="number"
                    min={1}
                    max={1000}
                    value={limit}
                    onChange={e => setLimit(Number(e.target.value))}
                />
                <label style={{ opacity: 0.8, fontSize: 13 }}>Start Time (unix)</label>
                <input
                    style={inputStyle}
                    type="number"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    placeholder="unix seconds"
                />
                <label style={{ opacity: 0.8, fontSize: 13 }}>End Time (unix)</label>
                <input
                    style={inputStyle}
                    type="number"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    placeholder="unix seconds"
                />
                <button style={inputStyle} onClick={handleLoad}>Load</button>
                <div style={{ flex: 1 }} />
                <small>Lightweight Charts demo • resizes with window</small>
            </div>
            <div style={pageStyle}>
                <div ref={chartContainerRef} style={chartStyle} />
            </div>
        </div>
    );
}