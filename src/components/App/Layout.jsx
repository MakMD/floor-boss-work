// src/components/App/Layout.jsx
import React, { useContext, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "./App";
import styles from "./App.module.css";

export default function Layout() {
  const { user, logout } = useContext(AppContext);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navLinks = [
    // Посилання "Home" може бути різним або вести на різний компонент для адміна і воркера
    // Якщо "/home" - це загальна сторінка, яка адаптується під роль:
    { to: "/home", text: "Home", roles: ["admin", "worker"] },

    // Нове посилання для кабінету працівника
    { to: "/my-dashboard", text: "My Dashboard", roles: ["worker"] },

    // Посилання тільки для адміна
    { to: "/orders", text: "New Order", roles: ["admin"] },
    { to: "/workers", text: "Workers List", roles: ["admin"] },
    { to: "/photo-gallery", text: "Photo Gallery", roles: ["admin"] },

    // Спільне посилання
    { to: "/calendar", text: "Calendar", roles: ["admin", "worker"] },
  ];

  // Сортуємо для кращого порядку, якщо потрібно
  // const sortedNavLinks = navLinks.sort(...);

  return (
    <div className={styles.layoutContainer}>
      <button className={styles.mobileMenuButton} onClick={toggleSidebar}>
        ☰
      </button>

      <aside
        className={`${styles.sidebar} ${
          isSidebarOpen ? styles.sidebarOpen : ""
        }`}
      >
        <button className={styles.sidebarCloseButton} onClick={toggleSidebar}>
          &times;
        </button>

        <div className={styles.sidebarHeader}>Flooring Boss</div>

        <nav className={styles.nav}>
          <div className={styles.navMenu}>
            {navLinks.map((link) => {
              if (user && user.role && link.roles.includes(user.role)) {
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      isActive
                        ? `${styles.navLink} ${styles.activeNavLink}`
                        : styles.navLink
                    }
                    onClick={() => setIsSidebarOpen(false)}
                    end={link.to === "/home" || link.to === "/my-dashboard"} // `end` для коректного підсвічування "головних" сторінок
                  >
                    {link.text}
                  </NavLink>
                );
              }
              return null;
            })}
          </div>
        </nav>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}
