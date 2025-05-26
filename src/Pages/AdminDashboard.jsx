// src/Pages/AdminDashboard.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./AdminDashboard.module.css";
import { useToast } from "@chakra-ui/react";
import {
  Bell,
  Briefcase,
  Users,
  Image as ImageIconLucide,
  Calendar as CalendarIconLucide,
  Settings,
  PlayCircle,
  CheckCircle,
  Info as InfoIcon,
  Trash2, // <--- ДОДАНО PlayCircle, CheckCircle, InfoIcon, Trash2
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useContext(AppContext);
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("job_updates")
        .select(
          `
          id,
          created_at,
          message,
          job_id,
          jobs (address, client),
          worker_id,
          workers (name) 
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setNotifications(data || []);
    } catch (err) {
      const errorMsg = `Failed to load notifications: ${err.message}`;
      setError(errorMsg);
      toast({
        title: "Error Loading Notifications",
        description: errorMsg,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchNotifications();
    }
  }, [user]); // Перезавантажуємо, якщо змінився користувач або компонент завантажився

  const handleDeleteNotification = async (notificationId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this notification? This will only remove it from this list."
      )
    )
      return;

    // Оскільки ми не зберігаємо addActivity в БД, видалення з job_updates може бути нелогічним,
    // якщо addActivity мало б бути основним логом.
    // Якщо ж job_updates і є основним логом активності, то видалення має сенс.
    // Припустимо, що ми хочемо видалити запис з job_updates.
    try {
      const { error: deleteError } = await supabase
        .from("job_updates")
        .delete()
        .eq("id", notificationId);

      if (deleteError) throw deleteError;

      toast({
        title: "Notification Removed",
        description: `Notification #${notificationId} has been removed.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchNotifications(); // Оновлюємо список
    } catch (err) {
      toast({
        title: "Error Removing Notification",
        description: `Could not remove notification: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (user?.role !== "admin") {
    return (
      <p className={styles.accessDenied}>
        Access Denied. This dashboard is for administrators only.
      </p>
    );
  }

  return (
    <div className={styles.adminDashboardPage}>
      <header className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>
          <Settings size={28} className={styles.titleIcon} />
          Admin Dashboard
        </h1>
        {user && (
          <p className={styles.welcomeMessage}>
            Welcome, {user.name || user.email}!
          </p>
        )}
      </header>

      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <Link to="/orders" className={styles.actionCard}>
            <Briefcase size={32} />
            <span>Create New Order</span>
          </Link>
          <Link to="/workers" className={styles.actionCard}>
            <Users size={32} />
            <span>Manage Workers</span>
          </Link>
          <Link to="/calendar" className={styles.actionCard}>
            <CalendarIconLucide size={32} />
            <span>View Calendar</span>
          </Link>
          <Link to="/photo-gallery" className={styles.actionCard}>
            <ImageIconLucide size={32} />
            <span>Photo Gallery</span>
          </Link>
        </div>
      </section>

      <section className={styles.notificationsSection}>
        <h2 className={styles.sectionTitle}>
          <Bell size={24} className={styles.titleIcon} />
          Recent Activity
        </h2>
        {loadingNotifications && (
          <p className={styles.loadingMessage}>Loading notifications...</p>
        )}
        {error && <p className={styles.errorMessage}>{error}</p>}
        {!loadingNotifications && !error && notifications.length === 0 && (
          <p className={styles.noNotificationsMessage}>
            No recent activity to display.
          </p>
        )}
        {!loadingNotifications && !error && notifications.length > 0 && (
          <ul className={styles.notificationList}>
            {notifications.map((notification) => (
              <li key={notification.id} className={styles.notificationItem}>
                <div className={styles.notificationIcon}>
                  {notification.message.toLowerCase().includes("started") ? (
                    <PlayCircle size={20} className={styles.iconStarted} />
                  ) : notification.message.toLowerCase().includes("finished") ||
                    notification.message.toLowerCase().includes("completed") ||
                    notification.message.toLowerCase().includes("done") ? (
                    <CheckCircle size={20} className={styles.iconCompleted} />
                  ) : (
                    <InfoIcon size={20} className={styles.iconInfo} />
                  )}
                </div>
                <div className={styles.notificationContent}>
                  <p className={styles.notificationMessage}>
                    {/* Відображаємо ім'я працівника, якщо є, інакше worker_id */}
                    <strong>
                      {notification.workers?.name ||
                        `Worker ID: ${notification.worker_id?.substring(
                          0,
                          8
                        )}...`}
                    </strong>{" "}
                    {/* Решта повідомлення після імені працівника, якщо воно починається з "Worker ... " */}
                    {notification.message.replace(/^Worker [^ ]+ /, "")}
                    {notification.jobs && ( // Перевіряємо, чи є дані про замовлення
                      <Link
                        to={`/orders/${notification.job_id}`}
                        className={styles.jobLink}
                      >
                        (Order #{notification.job_id}:{" "}
                        {notification.jobs.client ||
                          notification.jobs.address ||
                          "Details N/A"}
                        )
                      </Link>
                    )}
                  </p>
                  <span className={styles.notificationMeta}>
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteNotification(notification.id)}
                  className={styles.deleteNotificationBtn}
                  title="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
