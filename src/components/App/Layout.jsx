import React, { useContext } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "./App";
import styles from "./App.module.css";

export default function Layout() {
  const { user, logout } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      <nav className={styles.nav}>
        <Link to="/home" className={styles.navLink}>
          Home
        </Link>

        {user?.role === "admin" && (
          <Link to="/orders" className={styles.navLink}>
            Orders
          </Link>
        )}

        {user?.role === "admin" && (
          <Link to="/workers" className={styles.navLink}>
            Workers
          </Link>
        )}

        <Link to="/calendar" className={styles.navLink}>
          Calendar
        </Link>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <main className={styles.content}>
        <Outlet />
      </main>
    </>
  );
}
