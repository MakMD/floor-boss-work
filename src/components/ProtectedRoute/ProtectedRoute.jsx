import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "../App/App";

/**
 * Компонент для захисту маршрутів
 * @param {{allowedRoles: string[], children: React.ReactNode}} props
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useContext(AppContext);
  // Якщо неавторизований, перенаправляємо на логін
  if (!user) {
    return <Navigate to="/" replace />;
  }
  // Якщо роль не відповідає — перенаправляємо на головну сторінку
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }
  // Інакше — рендеримо дочірній компонент
  return children;
}
