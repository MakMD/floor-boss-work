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
        {/* Public Login Page */}
        <Route path="/" element={<Login />} />
        {/* Main dashboard displaying available jobs by date */}
        <Route path="/home" element={<Home />} />
        {/* Job details page with tabs for photos and invoices */}
        <Route path="/job/:id" element={<JobDetails />} />
        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
