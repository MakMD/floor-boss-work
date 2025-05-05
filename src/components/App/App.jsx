// src/components/App/App.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  Outlet,
  useNavigate,
} from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";
import Login from "../../Pages/Login";
import Orders from "../../Pages/Orders";
import JobDetails from "../../Pages/JobDetails";
import WorkersTab from "../../Pages/WorkersTab";
import Photos from "../../Pages/Photos";
import Invoices from "../../Pages/Invoices";
import Materials from "../../Pages/Materials";
import PhotosAfter from "../../Pages/PhotosAfter";
import CompanyInvoices from "../../Pages/CompanyInvoices";
import Workers from "../../Pages/Workers";
import WorkerProfile from "../../Pages/WorkerProfile";
import Calendar from "../../Pages/Calendar";
import styles from "./App.module.css";

// --- Global State via React Context ---
export const AppContext = createContext(null);

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({ theme: "light" });

  useEffect(() => {
    const stored = localStorage.getItem("appUser");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("appUser", JSON.stringify(user));
    else localStorage.removeItem("appUser");
  }, [user]);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);
  const updateSettings = (newSettings) =>
    setSettings((prev) => ({ ...prev, ...newSettings }));

  return (
    <AppContext.Provider
      value={{ user, login, logout, settings, updateSettings }}
    >
      {children}
    </AppContext.Provider>
  );
}

function Layout() {
  const { logout } = useContext(AppContext);
  const navigate = useNavigate();
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
        <button
          className={styles.logoutBtn}
          onClick={() => {
            logout();
            navigate("/", { replace: true });
          }}
        >
          Logout
        </button>
      </nav>
      <main className={styles.content}>
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public login route */}
          <Route path="/" element={<Login />} />

          {/* Protected routes */}
          <Route element={<Layout />}>
            <Route
              path="home"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="job/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "worker"]}>
                  <JobDetails />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <ProtectedRoute allowedRoles={["admin", "worker"]}>
                    <Photos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="invoices"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Invoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="workers"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <WorkersTab />
                  </ProtectedRoute>
                }
              />
              <Route
                path="materials"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Materials />
                  </ProtectedRoute>
                }
              />
              <Route
                path="photos-after"
                element={
                  <ProtectedRoute allowedRoles={["admin", "worker"]}>
                    <PhotosAfter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="company-invoices"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CompanyInvoices />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route
              path="workers"
              element={
                <ProtectedRoute allowedRoles={["admin", "worker"]}>
                  <Workers />
                </ProtectedRoute>
              }
            />
            <Route
              path="workers/:workerId"
              element={
                <ProtectedRoute allowedRoles={["admin", "worker"]}>
                  <WorkerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="calendar"
              element={
                <ProtectedRoute allowedRoles={["admin", "worker"]}>
                  <Calendar />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirect unknown paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
