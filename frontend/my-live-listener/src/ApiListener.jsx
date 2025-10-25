import React, { useEffect, useRef, useState } from "react";

export default function ApiListener({ endpoint }) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const esRef = useRef(null);
  const containerRef = useRef(null);

  const pushEvent = (obj) => {
    const timestamp = new Date().toISOString();
    setEvents((prev) => {
      const next = [...prev, { id: prev.length + 1, ts: timestamp, payload: obj }];
      if (next.length > 200) next.splice(0, next.length - 200); // keep last 200
      return next;
    });
  };

  const parseLine = (raw) => {
    if (!raw) return null;
    let trimmed = raw.trim();
    if (trimmed.startsWith("data:")) trimmed = trimmed.slice(5).trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      return { raw: trimmed };
    }
  };

  const startSSE = (url) => {
    if (esRef.current) esRef.current.close();

    try {
      const es = new EventSource(url);
      esRef.current = es;
      setConnected(false);
      setError(null);

      es.onopen = () => setConnected(true);
      es.onerror = () => {
        setConnected(false);
        setError("SSE connection error. Check backend.");
        try { es.close(); } catch {}
      };
      es.onmessage = (e) => pushEvent(parseLine("data: " + e.data));
    } catch (err) {
      setError("Failed to start SSE: " + String(err));
    }
  };

  useEffect(() => {
    if (!endpoint) {
      setError("No endpoint provided");
      return;
    }
    startSSE(endpoint);
    return () => {
      if (esRef.current) esRef.current.close();
    };
  }, [endpoint]);

  // Auto-scroll on new events
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  const last = events.length ? events[events.length - 1].payload : null;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Live Backend Listener Dashboard</h2>
      <p>Displays JSON messages received from backend (SSE-only)</p>
      <p><b>Endpoint:</b> {endpoint}</p>
      <p><b>Connected:</b> {connected ? "Yes" : "No"}</p>
      <p><b>Events:</b> {events.length}</p>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <h3>Live Events</h3>
      <div
        ref={containerRef}
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        {events.map((e) => (
          <div
            key={e.id}
            style={{
              borderBottom: "1px solid #eee",
              marginBottom: "5px",
              paddingBottom: "5px",
            }}
          >
            <b>{new Date(e.ts).toLocaleString()}</b>
            <div style={{ marginTop: "5px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {e.payload.status && (
                <span
                  style={{
                    backgroundColor: "#ffd700",
                    color: "#000",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.85em",
                  }}
                >
                  {e.payload.status}
                </span>
              )}
              {e.payload.source && (
                <span
                  style={{
                    backgroundColor: "#87ceeb",
                    color: "#000",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.85em",
                  }}
                >
                  {e.payload.source}
                </span>
              )}
              {e.payload.audience && (
                <span
                  style={{
                    backgroundColor: "#90ee90",
                    color: "#000",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.85em",
                  }}
                >
                  {e.payload.audience}
                </span>
              )}
              {e.payload.channel && (
                <span
                  style={{
                    backgroundColor: "#ffb6c1",
                    color: "#000",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.85em",
                  }}
                >
                  {e.payload.channel}
                </span>
              )}
            </div>
            <pre style={{ marginTop: "5px" }}>{JSON.stringify(e.payload, null, 2)}</pre>
          </div>
        ))}
      </div>

      <h3>Last Message</h3>
      {last ? (
        <pre>{JSON.stringify(last, null, 2)}</pre>
      ) : (
        <p>No message yet.</p>
      )}
    </div>
  );
}
