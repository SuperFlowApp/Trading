import { useState, useEffect, useRef } from "react";

const streams = [
  { key: "trades", path: (s) => `/ws/trades/${s}` },
  { key: "orderbook", path: (s) => `/ws/orderbook/${s}` },
  { key: "markPrice", path: (s) => `/ws/mark-price/${s}` },
  { key: "lastPrice", path: (s) => `/ws/last-price/${s}` },
];

const defaultDomain = "superflow.exchange/dev-demo";
const defaultSymbol = "BTCUSDT";
const defaultProto = "wss";

export function useMultiWebSocket({ symbol: initialSymbol = defaultSymbol, proto: initialProto = defaultProto, domain = defaultDomain }) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [proto, setProto] = useState(initialProto);

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

  // Helper to build URL
  const buildUrl = (streamKey) => {
    let url = `${proto}://${domain.replace(/^wss?:\/\//, "")}`;
    const def = streams.find((x) => x.key === streamKey);
    return url + def.path(symbol);
  };

  // Connect socket
  const openSocket = (key) => {
    setStates((prev) => ({ ...prev, [key]: "connecting" }));
    const url = buildUrl(key);
    let retries = 0;
    const ws = new window.WebSocket(url);
    socketsRef.current[key] = ws;

    ws.onopen = () => {
      setStates((prev) => ({ ...prev, [key]: "open" }));
      retries = 0;
    };
    ws.onmessage = (ev) => {
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
        [key]: ((counters[key]?.window || []).length + 1),
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
    ws.onerror = () => {
      setErrors((e) => e + 1);
      setStates((prev) => ({ ...prev, [key]: "error" }));
    };
    ws.onclose = () => {
      setStates((prev) => ({ ...prev, [key]: "closed" }));
      if (document.visibilityState !== "hidden") {
        const delay = Math.min(15000, 500 * Math.pow(2, retries++));
        setTimeout(() => {
          if (socketsRef.current[key] === ws) openSocket(key);
        }, delay);
      }
    };
  };

  // Connect all streams on mount and whenever domain/symbol/proto changes
  useEffect(() => {
    streams.forEach((s) => openSocket(s.key));
    // Cleanup: close sockets on unmount
    return () => {
      Object.values(socketsRef.current).forEach((ws) => {
        try { ws.close(); } catch {}
      });
      socketsRef.current = {};
    };
    // eslint-disable-next-line
  }, [domain, symbol, proto]);

  useEffect(() => {
    const interval = setInterval(() => {
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
    payloads, // raw data for each stream
    symbol,
    setSymbol,
    proto,
    setProto,
  };
}