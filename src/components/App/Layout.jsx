import React, { useContext } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "./App";
import styles from "./App.module.css";

export default function Layout() {
  const { logout } = useContext(AppContext);
  const navigate = useNavigate();

  return (
    <>
      <nav className={styles.nav}>
        <Link to="/home" className={styles.navLink}>
          Home
        </Link>
        <Link to="/workers" className={styles.navLink}>
          Workers
        </Link>
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
