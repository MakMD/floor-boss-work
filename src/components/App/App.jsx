import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./Layout";
import { supabase } from "../../lib/supabase";
import ErrorBoundary from "./ErrorBoundary";
import { routesConfig } from "../../config/routesConfig";

export const AppContext = createContext(null);

function ProtectedRoute({ allowedRoles, element }) {
  const { user } = useContext(AppContext);
  if (user === undefined) {
    return <p>Loading session...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const userRole = user.role;
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return element;
}

const renderRoutes = (routes) => {
  return routes.map((route) => {
    const { path, element, children, index, isPublic, isLayout, allowedRoles } =
      route;

    const routeElement = isPublic ? (
      element
    ) : (
      <ProtectedRoute allowedRoles={allowedRoles} element={element} />
    );

    if (isLayout) {
      return (
        <Route key="layout" element={<Layout />}>
          {renderRoutes(children)}
        </Route>
      );
    }

    return (
      <Route
        key={path || (index ? "index" : "404")}
        index={index}
        path={path}
        element={routeElement}
      >
        {children && renderRoutes(children)}
      </Route>
    );
  });
};

function AppProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [settings, setSettings] = useState({ theme: "light" });

  // ЗМІНА: Обертаємо функцію в useCallback для стабільності
  const fetchAndSetUserWithProfile = useCallback(async (authUser) => {
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
        throw profileError;
      }

      if (profileData) {
        setUser({ ...authUser, ...profileData });
      } else {
        console.warn(`No worker profile found for user ID: ${authUser.id}`);
        setUser({ ...authUser, role: null, name: authUser.email || "User" });
      }
    } catch (e) {
      console.error("Error fetching user worker profile:", e.message);
      // У випадку будь-якої помилки (RLS тощо), ми все одно встановлюємо користувача,
      // але з роллю null, щоб вийти зі стану "Loading session..."
      setUser({ ...authUser, role: null, name: authUser.email || "User" });
    }
  }, []); // Пустий масив залежностей, оскільки setUser стабільний

  // ЗМІНА: Додаємо fetchAndSetUserWithProfile в масив залежностей
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      fetchAndSetUserWithProfile(session?.user ?? null);
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchAndSetUserWithProfile(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchAndSetUserWithProfile]);

  const logout = async () => {
    await supabase.auth.signOut();
  };
  const updateSettings = (s) => setSettings((prev) => ({ ...prev, ...s }));

  const addActivity = useCallback(
    async (activityData) => {
      if (!user || !activityData || !activityData.action_type) {
        console.warn(
          "Skipping activity log to DB: missing user or action_type.",
          { user, activityData }
        );
        return;
      }
      try {
        const { error } = await supabase.from("job_updates").insert([
          {
            job_id: activityData.jobId,
            worker_id: user.id,
            action_type: activityData.action_type,
            details: activityData.details || null,
          },
        ]);
        if (error) {
          throw error;
        }
      } catch (err) {
        console.error("Failed to save activity log to DB:", err.message);
      }
    },
    [user]
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  return (
    <AppContext.Provider
      value={{
        user,
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
  return (
    <AppProvider>
      <ErrorBoundary>
        <Router>
          <Routes>{renderRoutes(routesConfig)}</Routes>
        </Router>
      </ErrorBoundary>
    </AppProvider>
  );
}
