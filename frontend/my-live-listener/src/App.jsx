import React from "react";
import WeatherDashboard from "./WeatherDashboard";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <h1 className="text-center text-3xl font-bold py-6 text-gray-900 dark:text-white">Live Weather Dashboard</h1>
      <WeatherDashboard />
    </div>
  );
}
