// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import PerformancePage from "./pages/PerformancePage";

function App() {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/performance/:performanceId"
            element={<PerformancePage />}
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
