// src/components/App/App.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./Layout";
import { supabase } from "../../lib/supabase";

// Сторінки
import Home from "../../Pages/Home";
import Login from "../../Pages/Login";
import Dashboard from "../../components/Dashboard/Dashboard";
import ActiveWorkers from "../../Pages/ActiveWorkers";
import Workers from "../../Pages/Workers";
import WorkerProfile from "../../Pages/WorkerProfile";
import Orders from "../../Pages/Orders";
import JobDetails from "../../Pages/JobDetails";
import Materials from "../../Pages/Materials";
import Photos from "../../Pages/Photos";
import PhotosAfter from "../../Pages/PhotosAfter";
import Invoices from "../../Pages/Invoices";
import CompanyInvoices from "../../Pages/CompanyInvoices";
import Calendar from "../../Pages/Calendar";

export const AppContext = createContext(null);

// Єдиний захисний компонент
function ProtectedRoute({ allowedRoles, element }) {
  const { user } = useContext(AppContext);
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return element;
}

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({ theme: "light" });
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
    })();
  }, []);

  const login = (u) => setUser(u);
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  const updateSettings = (s) => setSettings((prev) => ({ ...prev, ...s }));
  const addActivity = (msg) =>
    setActivityLog((prev) => [
      ...prev,
      { message: msg, timestamp: Date.now() },
    ]);

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        settings,
        updateSettings,
        activityLog,
        addActivity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes under Layout */}
          <Route element={<Layout />}>
            <Route
              index
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "company", "user"]}
                  element={<Home />}
                />
              }
            />
            <Route
              path="home"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "company", "user"]}
                  element={<Home />}
                />
              }
            />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "company", "user"]}
                  element={<Dashboard />}
                />
              }
            />
            <Route
              path="workers/active"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "company"]}
                  element={<ActiveWorkers />}
                />
              }
            />
            <Route
              path="workers"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "company", "user"]}
                  element={<Workers />}
                />
              }
            />
            <Route
              path="workers/:id"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "company"]}
                  element={<WorkerProfile />}
                />
              }
            />
            <Route
              path="invoices"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "company"]}
                  element={<Invoices />}
                />
              }
            />
            <Route
              path="company-invoices"
              element={
                <ProtectedRoute
                  allowedRoles={["company"]}
                  element={<CompanyInvoices />}
                />
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "company", "user"]}
                  element={<Orders />}
                />
              }
            />

            {/* Вкладені маршрути для JobDetails */}
            <Route
              path="orders/:id"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "company", "user"]}
                  element={<JobDetails />}
                />
              }
            >
              {/* Index таб — Photos */}
              <Route
                index
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "company", "user"]}
                    element={<Photos />}
                  />
                }
              />
              {/* Materials */}
              <Route
                path="materials"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "company", "user"]}
                    element={<Materials />}
                  />
                }
              />
              {/* Before Photos */}
              <Route
                path="photos"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "company", "user"]}
                    element={<Photos />}
                  />
                }
              />
              {/* After Photos */}
              <Route
                path="photos-after"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "company", "user"]}
                    element={<PhotosAfter />}
                  />
                }
              />
              {/* Invoices */}
              <Route
                path="invoices"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "company", "user"]}
                    element={<Invoices />}
                  />
                }
              />
              {/* Company Invoices */}
              <Route
                path="company-invoices"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "company", "user"]}
                    element={<CompanyInvoices />}
                  />
                }
              />
              {/* Workers (Admin only) */}
              <Route
                path="workers"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin"]}
                    element={<Workers />}
                  />
                }
              />
            </Route>

            <Route
              path="calendar"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "company", "user"]}
                  element={<Calendar />}
                />
              }
            />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
