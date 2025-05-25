// src/components/App/Layout.jsx
import React, { useContext, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "./App";
import styles from "./App.module.css"; // Використовуємо App.module.css для узгодженості
// Layout.module.css може бути видалений або його стилі перенесені, якщо він не використовується для іншого

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
    // Посилання "Home" тепер тільки для адміна
    { to: "/home", text: "Home", roles: ["admin"] },

    // Посилання для кабінету працівника
    { to: "/my-dashboard", text: "My Dashboard", roles: ["worker"] },

    // Посилання тільки для адміна
    { to: "/orders", text: "New Order", roles: ["admin"] },
    { to: "/workers", text: "Workers List", roles: ["admin"] },
    { to: "/photo-gallery", text: "Photo Gallery", roles: ["admin"] },

    // Спільне посилання
    { to: "/calendar", text: "Calendar", roles: ["admin", "worker"] },
  ];

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
              // Перевіряємо, чи користувач існує, чи має роль, і чи ця роль дозволена для посилання
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
                    onClick={() => setIsSidebarOpen(false)} // Закриваємо сайдбар при кліку на посилання
                    // `end` для `/home` та `/my-dashboard` щоб вони були активні тільки при точному співпадінні шляху
                    end={link.to === "/home" || link.to === "/my-dashboard"}
                  >
                    {link.text}
                  </NavLink>
                );
              }
              return null;
            })}
          </div>
        </nav>
        {user && ( // Показуємо кнопку Logout тільки якщо користувач залогінений
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        )}
      </aside>

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}
