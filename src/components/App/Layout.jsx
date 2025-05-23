// src/components/App/Layout.jsx
import React, { useContext, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "./App";
import styles from "./App.module.css"; // Продовжуємо використовувати App.module.css для Layout

export default function Layout() {
  const { user, logout } = useContext(AppContext);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Стан для мобільного сайдбару

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navLinks = [
    { to: "/home", text: "Home", roles: ["admin", "worker"] },
    { to: "/orders", text: "New Order", roles: ["admin"] },
    { to: "/workers", text: "Workers List", roles: ["admin"] },
    { to: "/calendar", text: "Calendar", roles: ["admin", "worker"] },
    { to: "/photo-gallery", text: "Photo Gallery", roles: ["admin"] },
    // Додайте інші глобальні посилання сюди, якщо потрібно
  ];

  return (
    <div className={styles.layoutContainer}>
      {/* Кнопка "бургер" для мобільних пристроїв */}
      <button className={styles.mobileMenuButton} onClick={toggleSidebar}>
        ☰ {/* Можна замінити на іконку */}
      </button>

      <aside
        className={`${styles.sidebar} ${
          isSidebarOpen ? styles.sidebarOpen : ""
        }`}
      >
        {/* Кнопка закриття сайдбару на мобільних */}
        <button className={styles.sidebarCloseButton} onClick={toggleSidebar}>
          &times; {/* Можна замінити на іконку */}
        </button>

        <div className={styles.sidebarHeader}>Flooring Boss</div>

        <nav className={styles.nav}>
          <div className={styles.navMenu}>
            {navLinks.map((link) => {
              // Перевіряємо, чи user існує і чи його роль включена в дозволені ролі для посилання
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
                    onClick={() => setIsSidebarOpen(false)} // Закриваємо сайдбар при кліку на посилання на мобільних
                    end
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
