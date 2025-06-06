// src/Pages/AdminDashboard.jsx
import React, { useState, useEffect, useMemo, useContext } from "react";
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
  Trash2,
  Search,
} from "lucide-react";

const INITIAL_ITEMS_COUNT = 4;
const INCREMENT_COUNT = 4; // Кількість елементів для додавання при кліці

export default function AdminDashboard() {
  const { user } = useContext(AppContext);
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  // ЗМІНА: Замість showAll, використовуємо лічильник видимих елементів
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS_COUNT);

  useEffect(() => {
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
            jobs (address, client, work_order_number),
            worker_id,
            workers (name)
          `
          )
          .order("created_at", { ascending: false });

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

    if (user?.role === "admin") {
      fetchNotifications();
    }
  }, [user, toast]);

  const handleDeleteNotification = async (notificationId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this notification? This will only remove it from this list."
      )
    )
      return;

    try {
      const { error: deleteError } = await supabase
        .from("job_updates")
        .delete()
        .eq("id", notificationId);

      if (deleteError) throw deleteError;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      toast({
        title: "Notification Removed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
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

  const filteredNotifications = useMemo(() => {
    if (!searchTerm.trim()) {
      return notifications;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return notifications.filter((notification) => {
      const address = notification.jobs?.address?.toLowerCase() || "";
      const workOrder =
        notification.jobs?.work_order_number?.toLowerCase() || "";
      const workerName = notification.workers?.name?.toLowerCase() || "";
      const clientName = notification.jobs?.client?.toLowerCase() || "";
      const message = notification.message?.toLowerCase() || "";

      return (
        address.includes(lowercasedTerm) ||
        workOrder.includes(lowercasedTerm) ||
        workerName.includes(lowercasedTerm) ||
        clientName.includes(lowercasedTerm) ||
        message.includes(lowercasedTerm)
      );
    });
  }, [searchTerm, notifications]);

  // ЗМІНА: При зміні пошукового запиту скидаємо лічильник до початкового
  useEffect(() => {
    setVisibleCount(INITIAL_ITEMS_COUNT);
  }, [searchTerm]);

  const displayedNotifications = useMemo(() => {
    return filteredNotifications.slice(0, visibleCount);
  }, [filteredNotifications, visibleCount]);

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

        <div className={styles.searchBarContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {loadingNotifications && (
          <p className={styles.loadingMessage}>Loading notifications...</p>
        )}
        {error && <p className={styles.errorMessage}>{error}</p>}
        {!loadingNotifications && !error && notifications.length === 0 && (
          <p className={styles.noNotificationsMessage}>
            No recent activity to display.
          </p>
        )}
        {!loadingNotifications &&
          !error &&
          filteredNotifications.length > 0 &&
          displayedNotifications.length === 0 && (
            <p className={styles.noResults}>No results match your search.</p>
          )}

        {!loadingNotifications &&
          !error &&
          displayedNotifications.length > 0 && (
            <ul className={styles.notificationList}>
              {displayedNotifications.map((notification) => (
                <li key={notification.id} className={styles.notificationItem}>
                  <div className={styles.notificationIcon}>
                    {notification.message.toLowerCase().includes("started") ? (
                      <PlayCircle size={20} />
                    ) : notification.message
                        .toLowerCase()
                        .includes("finished") ||
                      notification.message
                        .toLowerCase()
                        .includes("completed") ||
                      notification.message.toLowerCase().includes("done") ? (
                      <CheckCircle size={20} />
                    ) : (
                      <InfoIcon size={20} />
                    )}
                  </div>
                  <div className={styles.notificationContent}>
                    <p className={styles.notificationMessage}>
                      <strong>
                        {notification.workers?.name ||
                          `Worker ID: ${notification.worker_id?.substring(
                            0,
                            8
                          )}...`}
                      </strong>{" "}
                      {notification.message.replace(/^Worker [^ ]+ /, "")}
                      {notification.jobs && (
                        <Link
                          to={`/orders/${notification.job_id}`}
                          className={styles.jobLink}
                        >
                          (Order #{notification.job_id})
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

        {/* ЗМІНА: Оновлена логіка кнопок пагінації */}
        <div className={styles.paginationControls}>
          {visibleCount > INITIAL_ITEMS_COUNT && (
            <button
              className={styles.showMoreBtn}
              onClick={() => setVisibleCount(INITIAL_ITEMS_COUNT)}
            >
              Collapse
            </button>
          )}
          {visibleCount < filteredNotifications.length && (
            <button
              className={styles.showMoreBtn}
              onClick={() =>
                setVisibleCount((prevCount) => prevCount + INCREMENT_COUNT)
              }
            >
              Show More
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
