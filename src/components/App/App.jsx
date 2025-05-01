// src/components/App/App.jsx
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
import Photos from "../../Pages/Photos";
import Invoices from "../../Pages/Invoices";
import Materials from "../../Pages/Materials";
import PhotosAfter from "../../Pages/PhotosAfter";
import CompanyInvoices from "../../Pages/CompanyInvoices";
import Workers from "../../Pages/Workers";
import WorkerProfile from "../../Pages/WorkerProfile";
import Calendar from "../../Pages/Calendar";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication */}
        <Route path="/" element={<Login />} />

        {/* Orders */}
        <Route path="/home" element={<Orders />} />

        {/* Job details with nested tabs */}
        <Route path="/job/:id" element={<JobDetails />}>
          <Route index element={<Photos />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="materials" element={<Materials />} />
          <Route path="photos-after" element={<PhotosAfter />} />
          <Route path="company-invoices" element={<CompanyInvoices />} />
        </Route>

        {/* Workers */}
        <Route path="/workers" element={<Workers />} />
        <Route path="/worker/:workerId" element={<WorkerProfile />} />

        {/* Calendar */}
        <Route path="/calendar" element={<Calendar />} />

        {/* Fallback to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
