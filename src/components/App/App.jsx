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
import ErrorBoundary from "./ErrorBoundary"; // <--- НОВИЙ ІМПОРТ

// Сторінки
import Home from "../../Pages/Home";
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

export const AppContext = createContext(null);

function ProtectedRoute({ allowedRoles, element }) {
  const { user } = useContext(AppContext);
  if (!user) return <Navigate to="/login" replace />;

  const userRole = user.role;
  if (!userRole || !allowedRoles.includes(userRole)) {
    // Якщо роль не відповідає — перенаправляємо на головну сторінку або логін,
    // залежно від логіки (тут /home, але можна змінити на /login якщо це доцільніше для неавторизованих ролей)
    return <Navigate to="/" replace />; // Або "/login"
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
        .select("id, name, role") // Додано id, name, role для повноти профілю
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        console.error(
          "Error fetching user worker profile:",
          profileError.message
        );
        // Встановлюємо користувача з даними сесії, навіть якщо профіль не знайдено
        setUser({ ...authUser, role: null, name: authUser.email }); // Запасний варіант
        return;
      }

      if (profileData) {
        setUser({ ...authUser, ...profileData });
      } else {
        // Це може статися, якщо користувач є в auth.users, але немає відповідного запису в 'workers'
        console.warn(
          "Worker profile not found for id:",
          authUser.id,
          "Using default role/name."
        );
        setUser({ ...authUser, role: null, name: authUser.email }); // Або інша логіка за замовчуванням
      }
    } catch (e) {
      console.error("Error in fetchAndSetUserWithProfile:", e);
      setUser({ ...authUser, role: null, name: authUser.email }); // Запасний варіант при будь-якій помилці
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

  const login = (u) => setUser(u); // Ця функція login тепер встановлює дані з таблиці workers
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    }
    // setUser(null); // onAuthStateChange має спрацювати і встановити user в null
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
      <ErrorBoundary>
        {" "}
        {/* <--- ІНТЕГРАЦІЯ ERRORBOUNDARY */}
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
                    element={<ActiveWorkers />} // Цей маршрут може потребувати jobId з URL
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
                {/* Вкладені маршрути для JobDetails */}
                <Route
                  index // За замовчуванням показуємо PhotosAfter
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
                      allowedRoles={ALL_AUTHENTICATED_ROLES} // Дозволено всім аутентифікованим для перегляду
                      element={<Invoices />}
                    />
                  }
                />
                <Route
                  path="workers" // Призначені працівники для конкретного замовлення
                  element={
                    <ProtectedRoute
                      allowedRoles={[ADMIN_ROLE]} // Тільки адмін може керувати працівниками на замовленні
                      element={<ActiveWorkers />} // Тут ActiveWorkers отримує jobId з URL (через JobDetails)
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
              {/* Будь-які інші маршрути, що не знайдені, можна перенаправити на /home або /login */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Route>
          </Routes>
        </Router>
      </ErrorBoundary>{" "}
      {/* <--- КІНЕЦЬ ІНТЕГРАЦІЇ ERRORBOUNDARY */}
    </AppProvider>
  );
}
