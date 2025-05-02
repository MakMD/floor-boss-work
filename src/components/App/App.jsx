// src/components/App/App.jsx
import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  Outlet,
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
import styles from "./App.module.css";

// Layout for protected routes
function Layout() {
  return (
    <>
      <nav className={styles.nav}>
        <Link to="/home" className={styles.navLink}>
          Home
        </Link>
        <Link to="/workers" className={styles.navLink}>
          Workers
        </Link>
        <Link to="/calendar" className={styles.navLink}>
          Calendar
        </Link>
      </nav>
      <main className={styles.content}>
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public login route */}
        <Route path="/" element={<Login />} />

        {/* Protected routes wrapped in Layout */}
        <Route element={<Layout />}>
          {" "}
          {/* no path, wraps nested */}
          <Route path="home" element={<Orders />} />
          <Route path="job/:id" element={<JobDetails />}>
            <Route index element={<Photos />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="materials" element={<Materials />} />
            <Route path="photos-after" element={<PhotosAfter />} />
            <Route path="company-invoices" element={<CompanyInvoices />} />
          </Route>
          <Route path="workers" element={<Workers />} />
          <Route path="workers/:workerId" element={<WorkerProfile />} />
          <Route path="calendar" element={<Calendar />} />
        </Route>

        {/* Redirect any unknown path to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
