// src/Pages/JobDetails.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, NavLink, Outlet } from "react-router-dom";
import styles from "./JobDetails.module.css";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, addActivity } = useContext(AppContext);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Завантажуємо дані замовлення
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("*, job_workers(worker_id)")
        .eq("id", id)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setJob({
          ...data,
          workerStatus: data.worker_status || "not_started",
          adminStatus: data.admin_status || "pending",
        });
        if (user?.role === "worker" && data.worker_status === "not_started") {
          if (window.confirm("Бажаєте розпочати виконання цього завдання?")) {
            await updateField("worker_status", "in_progress");
          }
        }
      }
      setLoading(false);
    })();
  }, [id, user]);

  // Оновлення статусу
  const updateField = async (field, value) => {
    setLoading(true);
    const { error } = await supabase
      .from("jobs")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      alert("Не вдалося оновити статус: " + error.message);
    } else {
      setJob((prev) => ({
        ...prev,
        [field === "worker_status" ? "workerStatus" : "adminStatus"]: value,
      }));
      const actor = user?.name || user?.id;
      const msg =
        field === "worker_status"
          ? `User ${actor} set status "${value}" for order #${id}`
          : `Admin ${actor} ${
              value === "approved" ? "approved" : "rejected"
            } completion for order #${id}`;
      addActivity(msg);
    }
    setLoading(false);
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (error) return <p className={styles.error}>Error: {error}</p>;
  if (!job) return <p className={styles.error}>Job not found.</p>;

  // Визначаємо вкладки
  const tabs = [
    { path: "", label: "Photos" },
    ...(user.role === "admin" ? [{ path: "workers", label: "Workers" }] : []),
    { path: "invoices", label: "Invoices" },
    { path: "materials", label: "Materials" },
    { path: "photos-after", label: "After Photos" },
    { path: "company-invoices", label: "Company Invoices" },
  ];

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

        {user.role === "worker" && job.workerStatus === "in_progress" && (
          <button
            className={styles.actionBtn}
            onClick={() => updateField("worker_status", "done")}
          >
            Finish
          </button>
        )}

        {user.role === "admin" && job.workerStatus === "done" && (
          <>
            <button
              className={styles.actionBtn}
              onClick={() => updateField("admin_status", "approved")}
              disabled={job.adminStatus === "approved"}
            >
              {job.adminStatus === "approved"
                ? "Approved"
                : "Approve Completion"}
            </button>
            <button
              className={styles.rejectBtn}
              onClick={async () => {
                await updateField("admin_status", "rejected");
                await updateField("worker_status", "in_progress");
              }}
            >
              Reject Completion
            </button>
          </>
        )}

        {user.role === "admin" &&
          job.workerStatus === "done" &&
          job.adminStatus === "approved" && (
            <div className={`${styles.badge} ${styles.badgeDoneGreen}`}>
              Completed
            </div>
          )}
      </div>

      <div className={styles.tabs}>
        {tabs.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path} // відносний шлях
            end={path === ""} // активний тільки на exact index
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
