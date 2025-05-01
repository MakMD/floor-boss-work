import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "../../Pages/Login";
import Orders from "../../Pages/Orders";
import JobDetails from "../../Pages/JobDetails";
import Materials from "../../Pages/Materials";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Orders />} />
        <Route path="/job/:id" element={<JobDetails />} />
        <Route path="/job/:id/materials" element={<Materials />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
