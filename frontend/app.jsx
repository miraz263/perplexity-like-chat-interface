import { useEffect, useState } from "react";

function App() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const evtSource = new EventSource("http://127.0.0.1:8000/api/stream/");
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs((prev) => [...prev, data]);
    };
    return () => evtSource.close();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Perplexity-like Chat</h1>
      <div className="mt-4 border p-2 rounded bg-gray-100">
        {logs.map((log, idx) => (
          <pre key={idx}>{JSON.stringify(log, null, 2)}</pre>
        ))}
      </div>
    </div>
  );
}

export default App;
