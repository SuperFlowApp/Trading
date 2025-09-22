import React from "react";
import { useMultiWebSocketGlobal } from "../contexts/MultiWebSocketContext"; // Use the context hook

const streams = [
  { key: "trades", name: "Trades" },
  { key: "orderbook", name: "Order Book" },
  { key: "markPrice", name: "Mark Price" },
  { key: "lastPrice", name: "Last Price" },
];

function statusDot(state) {
  const color =
    state === "open"
      ? "#34d399"
      : state === "connecting"
      ? "#fbbf24"
      : state === "closed"
      ? "#475569"
      : "#f87171";
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: "999px",
        background: color,
        display: "inline-block",
      }}
    />
  );
}

function InspectorPanel() {
  const {
    states,
    counters,
    errors,
    lastEventAt,
    logs,
    latencies,
    rates,
    ages,
    globalStatus,
    symbol,
    setSymbol,
    proto,
    setProto,
  } = useMultiWebSocketGlobal(); // Use global context instead of local hook

  return (
    <div className="wrap vstack" style={{ maxWidth: 1100, margin: "32px auto", padding: "0 16px" }}>
      <div className="hstack" style={{ justifyContent: "space-between", gap: 8 }}>
        <div>
          <div className="title" style={{ fontSize: 22, fontWeight: 800 }}>
            WebSocket Monitor
          </div>
        </div>
      </div>

      <div className="panel grid" style={{ background: "#111821", borderRadius: 14, padding: 16 }}>
        <div className="vstack">
          <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 10 }}>
            <div className="vstack">
              <label htmlFor="symbol" style={{ fontWeight: 600, color: "#93a3b8", fontSize: 12 }}>Symbol</label>
              <input id="symbol" value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="BTCUSDT" style={{ borderRadius: 12, border: "1px solid #2a3545", background: "#0f1520", color: "#e6eef7", padding: "10px 12px" }} />
            </div>
            <div className="vstack">
              <label htmlFor="proto" style={{ fontWeight: 600, color: "#93a3b8", fontSize: 12 }}>Protocol</label>
              <select id="proto" value={proto} onChange={e => setProto(e.target.value)} style={{ borderRadius: 12, border: "1px solid #2a3545", background: "#0f1520", color: "#e6eef7", padding: "10px 12px" }}>
                <option value="ws">ws</option>
                <option value="wss">wss</option>
              </select>
            </div>
          </div>
          <div className="hstack" style={{ flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            <span className="chip" style={{ background: "#1a2330", border: "1px solid #233044", borderRadius: 999, padding: "4px 10px", color: "#93a3b8", fontSize: 12 }}>{globalStatus}</span>
          </div>
          <div className="kpi" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginTop: 12 }}>
            <div className="card" style={{ background: "#0f1620", border: "1px solid #1f2b3b", borderRadius: 12, padding: "10px 12px" }}>
              <span className="sub" style={{ color: "#93a3b8" }}>Open Sockets</span>
              <b style={{ display: "block", fontSize: 18, marginTop: 4 }}>{Object.values(states).filter(st => st === "open").length}</b>
            </div>
            <div className="card" style={{ background: "#0f1620", border: "1px solid #1f2b3b", borderRadius: 12, padding: "10px 12px" }}>
              <span className="sub" style={{ color: "#93a3b8" }}>Msgs / 10s</span>
              <b style={{ display: "block", fontSize: 18, marginTop: 4 }}>{Object.values(rates).reduce((a, c) => a + c, 0)}</b>
            </div>
            <div className="card" style={{ background: "#0f1620", border: "1px solid #1f2b3b", borderRadius: 12, padding: "10px 12px" }}>
              <span className="sub" style={{ color: "#93a3b8" }}>Last Event Age</span>
              <b style={{ display: "block", fontSize: 18, marginTop: 4 }}>{lastEventAt ? `${Math.floor((Date.now() - lastEventAt) / 1000)}s` : "–"}</b>
            </div>
            <div className="card" style={{ background: "#0f1620", border: "1px solid #1f2b3b", borderRadius: 12, padding: "10px 12px" }}>
              <span className="sub" style={{ color: "#93a3b8" }}>Errors</span>
              <b style={{ display: "block", fontSize: 18, marginTop: 4 }}>{errors}</b>
            </div>
          </div>
        </div>
      </div>
      <div className="grid cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginTop: 16 }}>
        {streams.map((def) => (
          <div className="panel vstack" key={def.key} style={{ background: "#111821", borderRadius: 14, padding: 16 }}>
            <div className="hstack" style={{ justifyContent: "space-between" }}>
              <div className="status" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                {statusDot(states[def.key] || "closed")}
                {def.name}: <span style={{ fontFamily: "monospace" }}>{states[def.key] || "disconnected"}</span>
              </div>
            </div>
            <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 8 }}>
              <div>
                <span className="sub" style={{ color: "#93a3b8" }}>Messages</span>
                <b style={{ display: "block", fontSize: 16, marginTop: 4 }}>{counters[def.key]?.total || 0}</b>
              </div>
              <div>
                <span className="sub" style={{ color: "#93a3b8" }}>Rate (10s)</span>
                <b style={{ display: "block", fontSize: 16, marginTop: 4 }}>{rates[def.key] || 0}</b>
              </div>
              <div>
                <span className="sub" style={{ color: "#93a3b8" }}>Latency</span>
                <b style={{ display: "block", fontSize: 16, marginTop: 4 }}>{latencies[def.key] != null ? `${latencies[def.key]} ms` : "–"}</b>
              </div>
              <div>
                <span className="sub" style={{ color: "#93a3b8" }}>Last Event</span>
                <b style={{ display: "block", fontSize: 16, marginTop: 4 }}>{ages[def.key] || "–"}</b>
              </div>
            </div>
            <div className="vstack" style={{ marginTop: 8 }}>
              <span className="sub" style={{ color: "#93a3b8" }}>Last Payload</span>
              <pre style={{ background: "#0c121a", border: "1px solid #1a2533", borderRadius: 12, padding: 12, overflow: "auto", maxHeight: 180, fontFamily: "monospace" }}>
                {logs[def.key] || "(none)"}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InspectorPanel;