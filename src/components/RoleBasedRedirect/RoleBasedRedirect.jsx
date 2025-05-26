// src/components/RoleBasedRedirect/RoleBasedRedirect.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "../App/App"; // Шлях до AppContext

export default function RoleBasedRedirect() {
  const { user } = useContext(AppContext);

  // Якщо користувач ще завантажується (наприклад, при першому вході), можна показати лоадер
  // if (user === undefined) {
  //   return <p>Loading user session...</p>; // Або ваш компонент лоадера
  // }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin-dashboard" replace />;
  } else if (user.role === "worker") {
    return <Navigate to="/my-dashboard" replace />;
  } else {
    console.warn(
      `Unknown user role for redirection: ${user.role}, navigating to login.`
    );
    return <Navigate to="/login" replace />;
  }
}
