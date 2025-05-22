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

  // Оновлення статусу і створення job_update при старті
  const updateField = async (field, value) => {
    setLoading(true);
    const { error: jobErr } = await supabase
      .from("jobs")
      .update({ [field]: value })
      .eq("id", id);

    if (jobErr) {
      alert("Не вдалося оновити статус: " + jobErr.message);
    } else {
      setJob((prev) => ({
        ...prev,
        [field === "worker_status" ? "workerStatus" : "adminStatus"]: value,
      }));

      const actor = user?.name || user?.id;
      const msg =
        field === "worker_status"
          ? `Worker ${actor} set status "${value}" for order #${id}`
          : `Admin ${actor} ${
              value === "approved" ? "approved" : "rejected"
            } completion for order #${id}`;
      addActivity(msg);

      if (field === "worker_status" && value === "in_progress") {
        // запис у job_updates
        await supabase.from("job_updates").insert([
          {
            job_id: id,
            worker_id: user.id,
            message: `Worker ${actor} started order #${id}`,
          },
        ]);
      }
    }
    setLoading(false);
  };

  // Завантаження даних замовлення
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: fetchErr } = await supabase
        .from("jobs")
        .select("*, job_workers(worker_id)")
        .eq("id", id)
        .single();

      if (fetchErr) {
        setError(fetchErr.message);
      } else {
        setJob({
          ...data,
          workerStatus: data.worker_status || "not_started",
          adminStatus: data.admin_status || "pending",
        });
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (error) return <p className={styles.error}>Error: {error}</p>;
  if (!job) return <p className={styles.error}>Job not found.</p>;

  // Оновлений список вкладок (без before-Photos)
  const tabs = [
    ...(user.role === "admin"
      ? [{ path: "work-order-photos", label: "Work Order Photos" }]
      : []),
    ...(user.role === "admin" ? [{ path: "workers", label: "Workers" }] : []),
    { path: "materials", label: "Materials" },
    { path: "photos-after", label: "After Photos" },
    { path: "invoices", label: "Invoices" },
    { path: "company-invoices", label: "Company Invoices" },
    { path: "", label: "Notes" }, // якщо ви додасте Notes
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

        {user.role === "worker" && job.workerStatus === "not_started" && (
          <button
            className={styles.actionBtn}
            onClick={() => updateField("worker_status", "in_progress")}
          >
            Start
          </button>
        )}
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
              onClick={() => {
                updateField("admin_status", "rejected");
                updateField("worker_status", "in_progress");
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
            to={path || "."}
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
