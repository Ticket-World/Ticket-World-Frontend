// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import PerformancePage from "./pages/PerformancePage";
import BookingPage from "./pages/BookingPage";
import DiscountPage from "./pages/DiscountPage";
import PaymentPage from "./pages/PaymentPage";

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
          <Route path="/discount" element={<DiscountPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/booking/:performanceId" element={<BookingPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
