import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea
} from "recharts";

// Locations
const LOCATIONS = [
  { name: "Dhaka", lat: 23.8103, lon: 90.4125 },
  { name: "Chattogram", lat: 22.3569, lon: 91.7832 },
  { name: "Sylhet", lat: 24.8949, lon: 91.8687 },
];

// Weather code icons
const getWeatherIcon = (code, isDay = true) => {
  if ([0].includes(code)) return isDay ? "☀️" : "🌙";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67].includes(code)) return "🌧️";
  if ([71, 73, 75, 77].includes(code)) return "❄️";
  if ([80, 81, 82, 95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
};

export default function WeatherDashboard() {
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [events, setEvents] = useState([]);
  const [current, setCurrent] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [tab, setTab] = useState("current");
  const [darkMode, setDarkMode] = useState(false);

  // SSE EventSource
  useEffect(() => {
    let es;
    const connect = () => {
      const url = `http://127.0.0.1:8000/api/api/stream_weather/?lat=${location.lat}&lon=${location.lon}&interval=10`;
      es = new EventSource(url);

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setEvents((prev) => [data, ...prev].slice(0, 50));
          if (data.type === "weather") setCurrent(data);
        } catch (err) {
          console.warn("Invalid JSON:", e.data);
        }
      };

      es.onerror = () => {
        es.close();
        setTimeout(connect, 5000);
      };
    };

    connect();
    return () => es && es.close();
  }, [location]);

  // Forecast fetch
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia/Dhaka`;
        const res = await fetch(url);
        const data = await res.json();
        const days = data.daily.time.map((t, i) => ({
          date: t,
          temp_max: data.daily.temperature_2m_max[i],
          temp_min: data.daily.temperature_2m_min[i],
          weathercode: data.daily.weathercode[i],
        }));
        setForecastData(days.slice(0, 3));
      } catch (err) {
        console.error(err);
      }
    };
    fetchForecast();
  }, [location]);

  const formatTime = (ev) => {
    const t = ev.time || (ev.timestamp ? ev.timestamp * 1000 : null);
    return t ? new Date(t).toLocaleString() : "N/A";
  };

  const tempData = events
    .filter((ev) => ev.type === "weather")
    .map((ev) => ({
      time: ev.timestamp ? ev.timestamp * 1000 : Date.now(),
      temperature: ev.temperature,
      windspeed: ev.windspeed,
    }))
    .reverse();

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-b from-blue-100 to-blue-200 text-gray-900"} min-h-screen p-6 transition-colors duration-500`}>

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-4xl font-bold mb-3">🌦 Live Weather Dashboard</h2>
        <button
          className="px-5 py-2 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 transition"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </button>
      </div>

      {/* Location Selector */}
      <div className="text-center mb-6">
        <select
          className="px-3 py-2 rounded border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={location.name}
          onChange={(e) =>
            setLocation(LOCATIONS.find((loc) => loc.name === e.target.value))
          }
        >
          {LOCATIONS.map((loc) => (
            <option key={loc.name} value={loc.name}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="text-center mb-6 space-x-3">
        {["current", "forecast"].map((t) => (
          <button
            key={t}
            className={`px-4 py-2 rounded-full ${tab === t ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-white"} transition`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Current Weather Card */}
      {tab === "current" && current && (
        <div className="flex flex-col md:flex-row justify-around items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-6 transition-all duration-500">
          <span className="text-7xl animate-bounce mb-4 md:mb-0">
            {new Date().getHours() >= 6 && new Date().getHours() < 18 ? "☀️" : "🌙"}
          </span>
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-2xl font-bold">Temperature: {current.temperature} °C</h3>
            <h4 className="text-xl">Wind: {current.windspeed} km/h</h4>
            <p>Lat: {current.latitude || location.lat}, Lon: {current.longitude || location.lon}</p>
            <small className="text-sm text-gray-500 dark:text-gray-400">{formatTime(current)}</small>
          </div>
        </div>
      )}

      {/* Forecast Cards */}
      {tab === "forecast" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {forecastData.map((day, i) => {
            const isDay = true; // Always sun for simplicity
            return (
              <div
                key={i}
                className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-all duration-500 hover:scale-105"
              >
                <h4 className="font-bold mb-2">{new Date(day.date).toLocaleDateString()}</h4>
                <span className="text-5xl mb-2 animate-pulse">{isDay ? "☀️" : "🌙"}</span>
                <p className="mb-1">Max: {day.temp_max} °C</p>
                <p>Min: {day.temp_min} °C</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Graph */}
      <div className="h-80 mb-6 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg transition-all duration-500">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={tempData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF7F50" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#FF7F50" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" stroke={darkMode ? "#444" : "#eee"} />
            <XAxis
              dataKey="time"
              tick={{ fill: darkMode ? "#eee" : "#111", fontSize: 12 }}
              tickFormatter={(t) =>
                new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }
            />
            <YAxis
              yAxisId="left"
              label={{ value: "°C / km/h", angle: -90, position: "insideLeft", fill: darkMode ? "#eee" : "#111" }}
              tick={{ fill: darkMode ? "#eee" : "#111" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: darkMode ? "#333" : "#fff", color: darkMode ? "#eee" : "#111" }}
              labelFormatter={(t) => new Date(t).toLocaleString()}
            />
            <Legend verticalAlign="top" wrapperStyle={{ color: darkMode ? "#eee" : "#111" }} />

            {/* Day/Night background */}
            {tempData.map((d, i) => {
              if (i === tempData.length - 1) return null;
              const hour = new Date(d.time).getHours();
              const isDay = hour >= 6 && hour < 18;
              return (
                <ReferenceArea
                  key={i}
                  x1={d.time}
                  x2={tempData[i + 1].time}
                  y1={0}
                  y2="auto"
                  fill={isDay ? "#FFF9C4" : "#1e3a8a"}
                  fillOpacity={0.15}
                />
              );
            })}

            {/* Temperature Area with emoji icons */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              stroke="#FF7F50"
              fill="url(#tempGradient)"
              strokeWidth={2}
              name="Temperature °C"
              label={({ x, y, payload }) => {
                if (!payload) return null;
                const hour = new Date(payload.time).getHours();
                const icon = hour >= 6 && hour < 18 ? "☀️" : "🌙";
                return (
                  <text x={x} y={y - 10} fontSize={18} textAnchor="middle" className="animate-bounce">
                    {icon}
                  </text>
                );
              }}
            />

            {/* Wind Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="windspeed"
              stroke="#1E90FF"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name="Wind km/h"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
