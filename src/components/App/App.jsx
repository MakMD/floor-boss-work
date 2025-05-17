import React, { createContext, useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";
import Layout from "./Layout";
import { routesConfig } from "../../config/routesConfig";
import { supabase } from "../../lib/supabase";

export const AppContext = createContext(null);

function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("appUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem("appSettings");
    return stored ? JSON.parse(stored) : { theme: "light" };
  });
  const [activityLog, setActivityLog] = useState([]);

  const login = (userData) => setUser(userData);
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  const updateSettings = (newSettings) =>
    setSettings((prev) => ({ ...prev, ...newSettings }));
  const addActivity = (message) =>
    setActivityLog((prev) => [...prev, { message, timestamp: Date.now() }]);

  useEffect(() => {
    async function restoreSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) console.error("Error restoring session:", error);
      if (session?.user) setUser(session.user);
    }
    restoreSession();
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("appUser", JSON.stringify(user));
    else localStorage.removeItem("appUser");
  }, [user]);

  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
  }, [settings]);

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
          {/* Public routes */}
          {routesConfig
            .filter((route) => route.public)
            .map((route, i) => (
              <Route key={i} path={route.path} element={route.element} />
            ))}

          {/* Private routes under Layout */}
          <Route element={<Layout />}>
            {routesConfig
              .filter((route) => !route.public)
              .flatMap((route, i) =>
                route.children ? (
                  route.children.map((child, j) => (
                    <Route
                      key={`${i}-${j}`}
                      path={child.path}
                      element={
                        <ProtectedRoute allowedRoles={child.allowedRoles}>
                          {child.element}
                        </ProtectedRoute>
                      }
                      {...(child.index ? { index: true } : {})}
                    />
                  ))
                ) : (
                  <Route
                    key={i}
                    path={route.path}
                    element={
                      <ProtectedRoute allowedRoles={route.allowedRoles}>
                        {route.element}
                      </ProtectedRoute>
                    }
                  />
                )
              )}
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
