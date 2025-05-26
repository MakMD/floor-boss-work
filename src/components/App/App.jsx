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
import ErrorBoundary from "./ErrorBoundary";

// Сторінки
// import Home from "../../Pages/Home"; // ВИДАЛЕНО
import Login from "../../Pages/Login";
import ActiveWorkers from "../../Pages/ActiveWorkers";
import Workers from "../../Pages/Workers";
import WorkerProfile from "../../Pages/WorkerProfile";
import Orders from "../../Pages/Orders";
import JobDetails from "../../Pages/JobDetails";
import Materials from "../../Pages/Materials";
import PhotosAfter from "../../Pages/PhotosAfter";
import Invoices from "../../Pages/Invoices";
import Calendar from "../../Pages/Calendar";
import JobOrderPhoto from "../../Pages/JobOrderPhoto";
import WorkerNotes from "../../Pages/WorkerNotes";
import PhotoGallery from "../../Pages/PhotoGallery";
import WorkerDashboard from "../../Pages/WorkerDashboard";
import AdminDashboard from "../../Pages/AdminDashboard"; // ДОДАНО (створимо файл пізніше)
import RoleBasedRedirect from "../RoleBasedRedirect/RoleBasedRedirect"; // ДОДАНО

export const AppContext = createContext(null);

function ProtectedRoute({ allowedRoles, element }) {
  const { user } = useContext(AppContext);
  // Додамо перевірку на випадок, якщо user ще не завантажений
  if (user === undefined) {
    // Припускаємо, що початковий стан user може бути undefined
    return <p>Loading session...</p>; // Або індикатор завантаження
  }
  if (!user) return <Navigate to="/login" replace />;

  const userRole = user.role;
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />; // Перенаправлення на кореневий шлях, який обробить RoleBasedRedirect
  }
  return element;
}

function AppProvider({ children }) {
  const [user, setUser] = useState(undefined); // Початковий стан undefined для індикації завантаження
  const [settings, setSettings] = useState({ theme: "light" });

  /* const [activityLog, setActivityLog] = useState([]); */ // Залишаємо закоментованим

  const fetchAndSetUserWithProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      return;
    }
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("workers")
        .select("id, name, role")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        console.error(
          "Error fetching user worker profile:",
          profileError.message
        );
        setUser({ ...authUser, role: null, name: authUser.email || "User" });
        return;
      }

      if (profileData) {
        setUser({ ...authUser, ...profileData });
      } else {
        console.warn(
          "Worker profile not found for id:",
          authUser.id,
          "Using default role/name."
        );
        setUser({ ...authUser, role: null, name: authUser.email || "User" });
      }
    } catch (e) {
      console.error("Error in fetchAndSetUserWithProfile:", e);
      setUser({ ...authUser, role: null, name: authUser.email || "User" });
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
        setUser(null); // Явно встановлюємо null у випадку помилки сесії
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
    // setUser(null); // onAuthStateChange має це обробити
  };
  const updateSettings = (s) => setSettings((prev) => ({ ...prev, ...s }));

  const addActivity = async (activityData) => {
    // Залишаємо функцію, хоч і не використовуємо поки що збереження в БД
    if (!user || !activityData || !activityData.message) {
      console.warn(
        "Skipping activity log (local): missing user or essential activity data.",
        { user, activityData }
      );
      return;
    }
    console.log("Local Activity Log (not saved to DB):", activityData);
  };

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
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route
                index
                element={
                  <ProtectedRoute
                    allowedRoles={ALL_AUTHENTICATED_ROLES}
                    element={<RoleBasedRedirect />}
                  />
                }
              />
              {/* Маршрут /home видалено */}
              <Route
                path="admin-dashboard"
                element={
                  <ProtectedRoute
                    allowedRoles={[ADMIN_ROLE]}
                    element={<AdminDashboard />} // Створимо цей компонент наступним
                  />
                }
              />
              <Route
                path="my-dashboard"
                element={
                  <ProtectedRoute
                    allowedRoles={[WORKER_ROLE]}
                    element={<WorkerDashboard />}
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
              </Route>
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </ErrorBoundary>
    </AppProvider>
  );
}
