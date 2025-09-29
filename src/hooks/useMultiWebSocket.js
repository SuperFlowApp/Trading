import { useState, useEffect, useRef } from "react";

const streams = [
  { key: "trades", path: (s) => `/ws/trades/${s}` },
  { key: "orderbook", path: (s) => `/ws/orderbook/${s}` },
  { key: "markPrice", path: (s) => `/ws/mark-price/${s}` },
  { key: "lastPrice", path: (s) => `/ws/last-price/${s}` },
  // Add kline stream, default timeframe '1m'
  { key: "kline", path: (s, tf = "1m") => `/ws/klines/${s}/${tf}` },
];

const defaultDomain = "dev.superflow.exchange";
const defaultSymbol = "BTCUSDT";
const defaultProto = "wss";

export function useMultiWebSocket({
  symbol: initialSymbol = defaultSymbol,
  proto: initialProto = defaultProto,
  domain = defaultDomain,
  timeframe: initialTimeframe = "1m",
}) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [proto, setProto] = useState(initialProto);
  const [timeframe, setTimeframe] = useState(initialTimeframe);

  const [states, setStates] = useState({});
  const [counters, setCounters] = useState({});
  const [errors, setErrors] = useState(0);
  const [lastEventAt, setLastEventAt] = useState(null);
  const [logs, setLogs] = useState({});
  const [latencies, setLatencies] = useState({});
  const [rates, setRates] = useState({});
  const [ages, setAges] = useState({});
  const [globalStatus, setGlobalStatus] = useState("Idle");
  const [payloads, setPayloads] = useState({}); // For sharing raw data

  const socketsRef = useRef({});
  const mountedRef = useRef(true);
  const connectionAttemptsRef = useRef({});
  
  // Helper to build URL (support kline timeframe)
  const buildUrl = (streamKey) => {
    let url = `${proto}://${domain.replace(/^wss?:\/\//, "")}`;
    const def = streams.find((x) => x.key === streamKey);
    if (def.key === "kline") {
      return url + def.path(symbol, timeframe);
    }
    return url + def.path(symbol);
  };

  // Connect socket with improved error handling
  const openSocket = (key) => {
    if (!mountedRef.current) return;
    
    // Initialize connection attempts counter
    if (!connectionAttemptsRef.current[key]) {
      connectionAttemptsRef.current[key] = 0;
    }
    
    // Update state to show connecting
    setStates((prev) => ({ ...prev, [key]: "connecting" }));
    
    // Close existing socket if it exists
    if (socketsRef.current[key]) {
      try {
        socketsRef.current[key].close();
      } catch (e) {
        console.error(`Error closing socket for ${key}:`, e);
      }
    }
    
    const url = buildUrl(key);
    let retries = 0;
    
    try {
      const ws = new window.WebSocket(url);
      socketsRef.current[key] = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setStates((prev) => ({ ...prev, [key]: "open" }));
        connectionAttemptsRef.current[key] = 0; // Reset attempts on success
        retries = 0;
      };
      
      ws.onmessage = (ev) => {
        if (!mountedRef.current) return;
        setCounters((prev) => ({
          ...prev,
          [key]: {
            total: (prev[key]?.total || 0) + 1,
            lastTs: Date.now(),
            window: [
              ...(prev[key]?.window || []),
              Date.now(),
            ].filter((t) => Date.now() - t <= 10000),
          },
        }));
        setRates((prev) => ({
          ...prev,
          [key]: ((prev[key]?.window || []).length + 1),
        }));
        setLastEventAt(Date.now());
        let lat = null;
        try {
          const o = JSON.parse(ev.data);
          const t = Number(o.E || o.T || o.eventTime || 0);
          if (t) lat = Math.max(0, Date.now() - t);
          setPayloads((prev) => ({ ...prev, [key]: o }));
        } catch {
          setPayloads((prev) => ({ ...prev, [key]: ev.data }));
        }
        setLatencies((prev) => ({ ...prev, [key]: lat }));
        try {
          setLogs((prev) => ({
            ...prev,
            [key]: JSON.stringify(JSON.parse(ev.data), null, 2),
          }));
        } catch {
          setLogs((prev) => ({
            ...prev,
            [key]: String(ev.data).slice(0, 4000),
          }));
        }
      };
      
      ws.onerror = (e) => {
        if (!mountedRef.current) return;
        connectionAttemptsRef.current[key]++;
        setErrors((e) => e + 1);
        setStates((prev) => ({ ...prev, [key]: "error" }));
        console.error(`WebSocket error for ${key}:`, e);
      };
      
      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStates((prev) => ({ ...prev, [key]: "closed" }));
        if (document.visibilityState !== "hidden" && mountedRef.current) {
          const delay = Math.min(15000, 500 * Math.pow(2, retries++));
          setTimeout(() => {
            if (mountedRef.current && socketsRef.current[key] === ws) {
              openSocket(key);
            }
          }, delay);
        }
      };
    } catch (err) {
      console.error(`Error creating WebSocket for ${key}:`, err);
      connectionAttemptsRef.current[key]++;
      setErrors((e) => e + 1);
      setStates((prev) => ({ ...prev, [key]: "error" }));
      
      // Try again after a delay
      if (document.visibilityState !== "hidden" && mountedRef.current) {
        const delay = Math.min(15000, 500 * Math.pow(2, retries++));
        setTimeout(() => {
          if (mountedRef.current) openSocket(key);
        }, delay);
      }
    }
  };

  // Connect all streams on mount and whenever domain/symbol/proto/timeframe changes
  useEffect(() => {
    mountedRef.current = true;
    
    // Clear previous payloads when symbol changes to prevent showing stale data
    setPayloads({});
    
    // Reset connection attempts when configuration changes
    connectionAttemptsRef.current = {};
    
    // Open sockets for all streams with the new configuration
    streams.forEach((s) => openSocket(s.key));
    
    // Cleanup: close sockets on unmount or config change
    return () => {
      mountedRef.current = false;
      Object.values(socketsRef.current).forEach((ws) => {
        try { 
          ws.close(); 
        } catch (e) {
          console.error("Error closing socket:", e);
        }
      });
      socketsRef.current = {};
    };
  }, [domain, symbol, proto, timeframe]);

  // Update age and status counters
  useEffect(() => {
    const interval = setInterval(() => {
      if (!mountedRef.current) return;
      
      const now = Date.now();
      const newAges = {};
      streams.forEach(({ key }) => {
        const last = counters[key]?.lastTs || 0;
        newAges[key] = last ? `${Math.floor((now - last) / 1000)}s` : "–";
      });
      setAges(newAges);
      setGlobalStatus(
        Object.values(states).filter((st) => st === "open").length ? "Live" : "Idle"
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, [counters, states]);

  return {
    states,
    counters,
    errors,
    lastEventAt,
    logs,
    latencies,
    rates,
    ages,
    globalStatus,
    payloads,
    symbol,
    setSymbol,
    proto,
    setProto,
    timeframe,
    setTimeframe,
  };
}