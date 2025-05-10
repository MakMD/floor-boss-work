// src/components/App/Layout.jsx
import React, { useContext } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "./App";
import styles from "./App.module.css";

export default function Layout() {
  const { logout, user } = useContext(AppContext);
  const navigate = useNavigate();

  return (
    <>
      <nav className={styles.nav}>
        <Link to="/home" className={styles.navLink}>
          Home
        </Link>

        {/* тільки адмін бачить Orders */}
        {user?.role === "admin" && (
          <Link to="/orders" className={styles.navLink}>
            Order
          </Link>
        )}

        {/* тільки адмін бачить Workers */}
        {user?.role === "admin" && (
          <Link to="/workers" className={styles.navLink}>
            Workers
          </Link>
        )}

        <Link to="/calendar" className={styles.navLink}>
          Calendar
        </Link>
        <button
          className={styles.logoutBtn}
          onClick={() => {
            logout();
            navigate("/", { replace: true });
          }}
        >
          Logout
        </button>
      </nav>
      <main className={styles.content}>
        <Outlet />
      </main>
    </>
  );
}
