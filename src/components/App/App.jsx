import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "../../Pages/Login";
import Home from "../../Pages/Home";
import JobDetails from "../../Pages/JobDetails";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public: Login */}
        <Route path="/" element={<Login />} />
        {/* Після успішного логіну перенаправлення має вести на /home */}
        <Route path="/home" element={<Home />} />
        <Route path="/job/:id" element={<JobDetails />} />
        {/* Все інше — на логін */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
