import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../components/App/App";
import styles from "./AdminDashboard.module.css";
import { useToast } from "@chakra-ui/react";
import { useAdminNotifications } from "../hooks/useAdminNotifications";
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

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const ActivityMessage = ({ notification }) => {
  const { action_type, details, message } = notification;

  if (!action_type) {
    return (
      <span className={styles.notificationMessageText}>
        {message || "Legacy update"}
      </span>
    );
  }

  switch (action_type) {
    case "STATUS_CHANGED":
      const changeEntries = Object.entries(details.changes || {});
      return (
        <span className={styles.notificationMessageText}>
          змінив статус
          {changeEntries.map(([field, value]) => (
            <span key={field}>
              {" "}
              <strong>{field.replace("_", " ")}</strong> на "
              <strong>{value}</strong>"
            </span>
          ))}
          .
        </span>
      );
    case "NOTE_ADDED":
      return (
        <span className={styles.notificationMessageText}>
          додав нову нотатку.
        </span>
      );
    default:
      return (
        <span className={styles.notificationMessageText}>
          {message || action_type.replace(/_/g, " ").toLowerCase()}
        </span>
      );
  }
};

export default function AdminDashboard() {
  const { user } = useContext(AppContext);
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const debouncedSearchTerm = useDebounce(inputValue, 500);

  const {
    notifications,
    loading,
    loadingMore,
    error,
    hasMore,
    setSearchTerm,
    fetchMore,
    deleteNotificationById,
  } = useAdminNotifications();

  useEffect(() => {
    setCurrentPage(0);
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setSearchTerm]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this notification?")) {
      try {
        await deleteNotificationById(id);
        toast({
          title: "Notification deleted",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        toast({
          title: "Error deleting notification",
          description: err.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    fetchMore(nextPage);
    setCurrentPage(nextPage);
  };

  if (user?.role !== "admin") {
    return <p className={styles.accessDenied}>Access Denied.</p>;
  }

  return (
    <div className={styles.adminDashboardPage}>
      <header className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>
          <Settings size={28} className={styles.titleIcon} />
          Admin Dashboard
        </h1>
        {user && <p className={styles.welcomeMessage}>Welcome, {user.name}!</p>}
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
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {loading && <p className={styles.loadingMessage}>Loading...</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}
        {!loading && notifications.length === 0 && (
          <p className={styles.noNotificationsMessage}>
            {debouncedSearchTerm
              ? "No results match your search."
              : "No recent activity."}
          </p>
        )}

        <ul className={styles.notificationList}>
          {notifications.map((notification) => (
            <li key={notification.id} className={styles.notificationItem}>
              <div className={styles.notificationIcon}>
                <InfoIcon size={20} />
              </div>
              <div className={styles.notificationContent}>
                <div className={styles.notificationMessage}>
                  <strong>{notification.workers?.name || "System"}</strong>
                  <ActivityMessage notification={notification} />
                  {notification.jobs && (
                    <Link
                      to={`/orders/${notification.job_id}`}
                      className={styles.jobLink}
                    >
                      (Order #{notification.job_id})
                    </Link>
                  )}
                </div>
                <span className={styles.notificationMeta}>
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleDelete(notification.id)}
                className={styles.deleteNotificationBtn}
                title="Delete notification"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.paginationControls}>
          {hasMore && (
            <button
              className={styles.showMoreBtn}
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
