import React from "react";
import ApiListener from "./ApiListener";

export default function App() {
  return (
    <div style={{ fontFamily: "Arial" }}>
      <h1 style={{ textAlign: "center", marginTop: "20px" }}>
        Live Backend Listener Dashboard
      </h1>
      <p style={{ textAlign: "center", marginBottom: "20px" }}>
        Displays JSON messages received from backend (SSE-only)
      </p>

      <ApiListener endpoint="http://127.0.0.1:8000/api/stream_campaign/" />
    </div>
  );
}
