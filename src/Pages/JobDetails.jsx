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

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select(`*, job_workers(worker_id)`)
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
        if (
          user?.role === "worker" &&
          (data.worker_status || "not_started") === "not_started"
        ) {
          if (window.confirm("Бажаєте розпочати виконання цього завдання?")) {
            await updateField("worker_status", "in_progress");
          }
        }
      }
      setLoading(false);
    })();
  }, [id, user]);

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
      if (field === "worker_status") {
        addActivity(
          `User ${
            user?.name || user?.id
          } set status "${value}" for order #${id}`
        );
      }
      if (field === "admin_status") {
        const action = value === "approved" ? "approved" : "rejected";
        addActivity(
          `Admin ${
            user?.name || user?.id
          } ${action} completion for order #${id}`
        );
      }
    }
    setLoading(false);
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!job) return <p className={styles.error}>Job not found.</p>;

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
        {tabs.map(({ path, label }) => {
          const to = path ? `/job/${id}/${path}` : `/job/${id}`;
          return (
            <NavLink
              key={path}
              to={to}
              className={({ isActive }) =>
                isActive ? styles.activeTab : styles.tab
              }
            >
              {label}
            </NavLink>
          );
        })}
      </div>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
