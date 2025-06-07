// src/components/App/Layout.jsx
import React, { useContext, useState, useRef, useEffect } from "react"; // <-- Додано useRef та useEffect
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "./App";
import styles from "./App.module.css";
import {
  LayoutDashboard,
  LogOut,
  CalendarDays,
  Users,
  ClipboardPlus,
  Image as ImageIconLucide,
  Settings as SettingsIcon,
} from "lucide-react";

export default function Layout() {
  const { user, logout } = useContext(AppContext);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Створюємо ref для кнопки мобільного меню
  const mobileMenuButtonRef = useRef(null);

  // ЗМІНА: Додано useEffect для керування фокусом
  useEffect(() => {
    // Коли меню закривається, повертаємо фокус на кнопку, яка його відкрила.
    if (!isSidebarOpen) {
      // Невелика затримка, щоб дозволити DOM оновитися
      const timer = setTimeout(() => {
        mobileMenuButtonRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isSidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navLinks = [
    {
      to: "/admin-dashboard",
      text: "Admin Dashboard",
      roles: ["admin"],
      icon: <SettingsIcon size={18} strokeWidth={2.25} />,
    },
    {
      to: "/my-dashboard",
      text: "My Dashboard",
      roles: ["worker"],
      icon: <LayoutDashboard size={18} strokeWidth={2.25} />,
    },
    {
      to: "/orders",
      text: "New Order",
      roles: ["admin"],
      icon: <ClipboardPlus size={18} strokeWidth={2.25} />,
    },
    {
      to: "/workers",
      text: "Workers List",
      roles: ["admin"],
      icon: <Users size={18} strokeWidth={2.25} />,
    },
    {
      to: "/photo-gallery",
      text: "Photo Gallery",
      roles: ["admin"],
      icon: <ImageIconLucide size={18} strokeWidth={2.25} />,
    },
    {
      to: "/calendar",
      text: "Calendar",
      roles: ["admin", "worker"],
      icon: <CalendarDays size={18} strokeWidth={2.25} />,
    },
  ];

  return (
    <div className={styles.layoutContainer}>
      <button
        ref={mobileMenuButtonRef} // <-- Прив'язуємо ref до кнопки
        className={styles.mobileMenuButton}
        onClick={toggleSidebar}
        aria-label="Open menu"
      >
        ☰
      </button>

      <aside
        className={`${styles.sidebar} ${
          isSidebarOpen ? styles.sidebarOpen : ""
        }`}
        aria-hidden={!isSidebarOpen} // Спрощено для надійності
      >
        <button
          className={styles.sidebarCloseButton}
          onClick={toggleSidebar}
          aria-label="Close menu"
        >
          &times;
        </button>

        <div className={styles.sidebarHeader}>Flooring Boss</div>

        <nav className={styles.nav} aria-label="Main navigation">
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
                    onClick={() => setIsSidebarOpen(false)} // Просто закриваємо меню
                    end={
                      link.to === "/admin-dashboard" ||
                      link.to === "/my-dashboard"
                    }
                  >
                    {link.icon && (
                      <span className={styles.navLinkIcon}>{link.icon}</span>
                    )}
                    <span className={styles.navLinkText}>{link.text}</span>
                  </NavLink>
                );
              }
              return null;
            })}
          </div>
        </nav>
        {user && (
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut
              size={18}
              strokeWidth={2.25}
              className={styles.logoutIcon}
            />
            <span className={styles.logoutBtnText}>Logout</span>
          </button>
        )}
      </aside>

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}
