// src/Pages/JobDetails.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, NavLink, Outlet } from "react-router-dom";
import styles from "./JobDetails.module.css";
import { AppContext } from "../components/App/App";

const JOBS_API = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, addActivity } = useContext(AppContext);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Завантажуємо дані замовлення
  useEffect(() => {
    async function fetchJob() {
      try {
        setLoading(true);
        const res = await fetch(`${JOBS_API}/${id}`);
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setJob({
          ...data,
          workerStatus: data.workerStatus || "not_started",
          adminStatus: data.adminStatus || "pending",
        });

        // Питаємо працівника про початок виконання
        if (
          user?.role === "worker" &&
          (!data.workerStatus || data.workerStatus === "not_started")
        ) {
          const ok = window.confirm(
            "Бажаєте розпочати виконання цього завдання?"
          );
          if (ok) await updateField("workerStatus", "in_progress");
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [id, user]);

  // Оновити певне поле в замовленні
  const updateField = async (field, value) => {
    try {
      const res = await fetch(`${JOBS_API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Не вдалося оновити статус");
      setJob((prev) => ({ ...prev, [field]: value }));
      // Лог активності тільки для workerStatus
      if (field === "workerStatus") {
        addActivity(
          `User ${
            user?.name || user?.id
          } set status "${value}" for order #${id}`
        );
      }
      // Лог адміністраторських дій
      if (field === "adminStatus") {
        addActivity(
          `Admin ${user?.name || user?.id} ${
            value === "approved" ? "approved" : "rejected"
          } completion for order #${id}`
        );
      }
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!job) return <p className={styles.error}>Job not found.</p>;

  // Конфіг табів — робітник не бачить вкладку Workers
  let tabs = [
    { path: "", label: "Photos" },
    { path: "workers", label: "Workers" },
    { path: "invoices", label: "Invoices" },
    { path: "materials", label: "Materials" },
    { path: "photos-after", label: "After Photos" },
    { path: "company-invoices", label: "Company Invoices" },
  ];
  if (user?.role === "worker") {
    tabs = tabs.filter((t) => t.path !== "workers");
  }

  return (
    <div className={styles.jobDetails}>
      <div className={styles.btnContainer}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <button className={styles.logoutBtn} onClick={() => navigate("/")}>
          Logout
        </button>
      </div>

      <h1 className={styles.title}>Order #{job.id}</h1>

      {/* Статуси */}
      <div className={styles.statusContainer}>
        <div
          className={`${styles.badge} ${
            job.workerStatus === "not_started"
              ? styles.badgeNotStarted
              : job.workerStatus === "in_progress"
              ? styles.badgeInProgress
              : styles.badgeDoneGrey
          }`}
        >
          {job.workerStatus === "not_started"
            ? "Not Started"
            : job.workerStatus === "in_progress"
            ? "In Progress"
            : "Done"}
        </div>

        {/* Кнопка Finish для робітника */}
        {user?.role === "worker" && job.workerStatus === "in_progress" && (
          <button
            className={styles.actionBtn}
            onClick={() => updateField("workerStatus", "done")}
          >
            Finish
          </button>
        )}

        {/* Адмін бачить кнопки Approve і Reject лише коли статус робітника = done */}
        {user?.role === "admin" && job.workerStatus === "done" && (
          <>
            <button
              className={styles.actionBtn}
              onClick={() => updateField("adminStatus", "approved")}
              disabled={job.adminStatus === "approved"}
            >
              {job.adminStatus === "approved"
                ? "Approved"
                : "Approve Completion"}
            </button>
            <button
              className={styles.rejectBtn}
              onClick={async () => {
                // відкидаємо та повертаємо до in_progress
                await updateField("adminStatus", "rejected");
                await updateField("workerStatus", "in_progress");
              }}
            >
              Reject Completion
            </button>
          </>
        )}

        {/* Показати зелений Completed після підтвердження адміністратором */}
        {user?.role === "admin" &&
          job.workerStatus === "done" &&
          job.adminStatus === "approved" && (
            <div className={`${styles.badge} ${styles.badgeDoneGreen}`}>
              Completed
            </div>
          )}
      </div>

      {/* Таби */}
      <div className={styles.tabs}>
        {tabs.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === ""}
            className={({ isActive }) =>
              isActive ? styles.activeTab : styles.tab
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
