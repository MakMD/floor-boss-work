import React from "react";
import {
  HashRouter as Router,
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
        {/* Index route for HashRouter */}
        <Route index element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="home" element={<Home />} />
        <Route path="job/:id" element={<JobDetails />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
