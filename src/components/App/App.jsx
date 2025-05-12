// src/components/App/App.jsx
import React, { createContext, useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";
import Layout from "./Layout";
import { routesConfig } from "../../config/routesConfig";

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

  useEffect(() => {
    if (user) localStorage.setItem("appUser", JSON.stringify(user));
    else localStorage.removeItem("appUser");
  }, [user]);

  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    document.body.dataset.theme = settings.theme;
  }, [settings.theme]);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);
  const updateSettings = (newSettings) =>
    setSettings((prev) => ({ ...prev, ...newSettings }));
  const addActivity = (message) =>
    setActivityLog((prev) => [...prev, { message, timestamp: Date.now() }]);

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
            .map((route, idx) => (
              <Route key={idx} path={route.path} element={route.element} />
            ))}

          {/* Protected routes under Layout */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin", "worker"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            {routesConfig
              .find((route) => route.layout)
              .children.map((r, i) => {
                // No nested children
                if (!r.children) {
                  return (
                    <Route
                      key={i}
                      path={r.path}
                      element={
                        <ProtectedRoute allowedRoles={r.allowedRoles}>
                          {r.element}
                        </ProtectedRoute>
                      }
                    />
                  );
                }
                // Route with nested paths: add wildcard to parent path
                return (
                  <Route
                    key={i}
                    path={`${r.path}/*`}
                    element={
                      <ProtectedRoute allowedRoles={r.allowedRoles}>
                        {r.element}
                      </ProtectedRoute>
                    }
                  >
                    {r.children.map((c, j) =>
                      c.index ? (
                        <Route
                          key={j}
                          index
                          element={
                            <ProtectedRoute allowedRoles={c.allowedRoles}>
                              {c.element}
                            </ProtectedRoute>
                          }
                        />
                      ) : (
                        <Route
                          key={j}
                          path={c.path}
                          element={
                            <ProtectedRoute allowedRoles={c.allowedRoles}>
                              {c.element}
                            </ProtectedRoute>
                          }
                        />
                      )
                    )}
                  </Route>
                );
              })}
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
