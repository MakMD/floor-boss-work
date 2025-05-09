// src/components/App/App.jsx
import React, { createContext, useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";
import Layout from "./Layout";

import { routesConfig } from "../../config/routesConfig";

// --- Global State via React Context ---
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
  // Новий стан для логу активності
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
  // Функція для додавання записів в лог
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
          {routesConfig.map((route, i) => {
            if (route.public) {
              return (
                <Route key={i} path={route.path} element={route.element} />
              );
            }
            return (
              <Route key={i} element={<Layout />}>
                {route.children.map((r, j) => {
                  const Wrapper = ({ children }) => (
                    <ProtectedRoute allowedRoles={r.allowedRoles}>
                      {children}
                    </ProtectedRoute>
                  );
                  if (!r.children) {
                    return (
                      <Route
                        key={`${i}-${j}`}
                        path={r.path}
                        element={<Wrapper>{r.element}</Wrapper>}
                      />
                    );
                  }
                  return (
                    <Route
                      key={`${i}-${j}`}
                      path={r.path}
                      element={<Wrapper>{r.element}</Wrapper>}
                    >
                      {r.children.map((c, k) => (
                        <Route
                          key={`${i}-${j}-${k}`}
                          index={!!c.index}
                          path={c.path}
                          element={
                            <ProtectedRoute allowedRoles={c.allowedRoles}>
                              {c.element}
                            </ProtectedRoute>
                          }
                        />
                      ))}
                    </Route>
                  );
                })}
              </Route>
            );
          })}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
