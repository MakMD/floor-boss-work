import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";

const menuItems = [
  { path: "/orders", label: "Замовлення", icon: "📋" },
  { path: "/calendar", label: "Календар", icon: "📅" },
  { path: "/workers", label: "Працівники", icon: "👷" },
];

export default function Sidebar() {
  return (
    <nav className={styles.sidebar}>
      <ul className={styles.menu}>
        {menuItems.map((item) => (
          <li key={item.path} className={styles.menuItem}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
