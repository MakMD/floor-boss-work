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
import styles from "./App.module.css";

import { routesConfig } from "../../config/routesConfig";

// --- Global State via React Context ---
export const AppContext = createContext(null);

function AppProvider({ children }) {
  // Ініціалізуємо user з localStorage, щоб уникнути редиректу перед прочитанням
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("appUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  // Ініціалізуємо settings з localStorage або дефолт
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem("appSettings");
      return stored ? JSON.parse(stored) : { theme: "light" };
    } catch {
      return { theme: "light" };
    }
  });

  // Синхронізуємо user у localStorage
  useEffect(() => {
    if (user) localStorage.setItem("appUser", JSON.stringify(user));
    else localStorage.removeItem("appUser");
  }, [user]);

  // Синхронізуємо settings у localStorage
  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
  }, [settings]);

  // Застосовуємо тему до <body> через data-атрибут
  useEffect(() => {
    document.body.dataset.theme = settings.theme;
  }, [settings.theme]);

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

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {routesConfig.map((route, i) => {
            // Public
            if (route.public) {
              return (
                <Route key={i} path={route.path} element={route.element} />
              );
            }
            // Protected + Layout
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
