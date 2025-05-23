// src/components/App/App.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./Layout";
import { supabase } from "../../lib/supabase"; //

// Сторінки
import Home from "../../Pages/Home"; //
import Login from "../../Pages/Login"; //
import ActiveWorkers from "../../Pages/ActiveWorkers"; //
import Workers from "../../Pages/Workers"; //
import WorkerProfile from "../../Pages/WorkerProfile"; //
import Orders from "../../Pages/Orders"; //
import JobDetails from "../../Pages/JobDetails"; //
import Materials from "../../Pages/Materials"; //
import PhotosAfter from "../../Pages/PhotosAfter"; //
import Invoices from "../../Pages/Invoices"; //
import Calendar from "../../Pages/Calendar"; //
import JobOrderPhoto from "../../Pages/JobOrderPhoto"; //
import WorkerNotes from "../../Pages/WorkerNotes"; //
import PhotoGallery from "../../Pages/PhotoGallery"; //

export const AppContext = createContext(null);

function ProtectedRoute({ allowedRoles, element }) {
  const { user } = useContext(AppContext);
  if (!user) return <Navigate to="/login" replace />;

  const userRole = user.role;
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return element;
}

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({ theme: "light" });
  const [activityLog, setActivityLog] = useState([]);

  const fetchAndSetUserWithProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      return;
    }
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("workers")
        .select("role, name, id")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        console.error(
          "Error fetching user worker profile:",
          profileError.message
        );
        setUser({ ...authUser });
        return;
      }

      if (profileData) {
        setUser({ ...authUser, ...profileData });
      } else {
        console.warn("Worker profile not found for id:", authUser.id);
        setUser({ ...authUser });
      }
    } catch (e) {
      console.error("Error in fetchAndSetUserWithProfile:", e);
      setUser({ ...authUser });
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error.message);
        setUser(null);
        return;
      }
      await fetchAndSetUserWithProfile(session?.user || null);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await fetchAndSetUserWithProfile(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = (u) => setUser(u);
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    }
  };
  const updateSettings = (s) => setSettings((prev) => ({ ...prev, ...s }));
  const addActivity = (msg) =>
    setActivityLog((prev) => [
      ...prev,
      { message: msg, timestamp: Date.now() },
    ]);

  useEffect(() => {
    document.body.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

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
  const ADMIN_ROLE = "admin";
  const WORKER_ROLE = "worker";
  const ALL_AUTHENTICATED_ROLES = [ADMIN_ROLE, WORKER_ROLE];

  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route
              index
              element={
                <ProtectedRoute
                  allowedRoles={ALL_AUTHENTICATED_ROLES}
                  element={<Home />}
                />
              }
            />
            <Route
              path="home"
              element={
                <ProtectedRoute
                  allowedRoles={ALL_AUTHENTICATED_ROLES}
                  element={<Home />}
                />
              }
            />
            <Route
              path="workers/active"
              element={
                <ProtectedRoute
                  allowedRoles={[ADMIN_ROLE]}
                  element={<ActiveWorkers />}
                />
              }
            />
            <Route
              path="workers"
              element={
                <ProtectedRoute
                  allowedRoles={[ADMIN_ROLE]}
                  element={<Workers />}
                />
              }
            />
            <Route
              path="workers/:id"
              element={
                <ProtectedRoute
                  allowedRoles={[ADMIN_ROLE]}
                  element={<WorkerProfile />}
                />
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute
                  allowedRoles={[ADMIN_ROLE]}
                  element={<Orders />}
                />
              }
            />
            <Route
              path="orders/:id"
              element={
                <ProtectedRoute
                  allowedRoles={ALL_AUTHENTICATED_ROLES}
                  element={<JobDetails />}
                />
              }
            >
              <Route
                index
                element={
                  <ProtectedRoute
                    allowedRoles={ALL_AUTHENTICATED_ROLES}
                    element={<PhotosAfter />}
                  />
                }
              />
              <Route
                path="photos-after"
                element={
                  <ProtectedRoute
                    allowedRoles={ALL_AUTHENTICATED_ROLES}
                    element={<PhotosAfter />}
                  />
                }
              />
              <Route
                path="job-order-photo"
                element={
                  <ProtectedRoute
                    allowedRoles={[ADMIN_ROLE]}
                    element={<JobOrderPhoto />}
                  />
                }
              />
              <Route
                path="worker-notes"
                element={
                  <ProtectedRoute
                    allowedRoles={ALL_AUTHENTICATED_ROLES}
                    element={<WorkerNotes />}
                  />
                }
              />
              <Route
                path="materials"
                element={
                  <ProtectedRoute
                    allowedRoles={ALL_AUTHENTICATED_ROLES}
                    element={<Materials />}
                  />
                }
              />
              <Route
                path="invoices"
                element={
                  <ProtectedRoute
                    allowedRoles={ALL_AUTHENTICATED_ROLES}
                    element={<Invoices />}
                  />
                }
              />
              <Route
                path="workers"
                element={
                  <ProtectedRoute
                    allowedRoles={[ADMIN_ROLE]}
                    element={<ActiveWorkers />}
                  />
                }
              />
              {/* Маршрут photo-gallery НЕ МАЄ бути тут, якщо це окрема сторінка */}
            </Route>{" "}
            {/* Кінець orders/:id */}
            {/* ПРАВИЛЬНЕ МІСЦЕ для маршруту photo-gallery */}
            <Route
              path="photo-gallery"
              element={
                <ProtectedRoute
                  allowedRoles={[ADMIN_ROLE]}
                  element={<PhotoGallery />}
                />
              }
            />
            <Route
              path="calendar"
              element={
                <ProtectedRoute
                  allowedRoles={ALL_AUTHENTICATED_ROLES}
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
