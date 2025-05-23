// src/Pages/JobDetails.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  useParams,
  useNavigate,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import styles from "./JobDetails.module.css"; //
import { AppContext } from "../components/App/App"; //
import { supabase } from "../lib/supabase"; //

export default function JobDetails() {
  const { id: jobId } = useParams(); // Змінено id на jobId для ясності
  const navigate = useNavigate();
  const { user, addActivity } = useContext(AppContext);
  const location = useLocation(); // Отримуємо об'єкт location за допомогою хука

  const [job, setJob] = useState(null);
  const [companyName, setCompanyName] = useState(""); // Для назви компанії
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const updateField = async (field, value) => {
    // Можна використовувати окремий лоадер для оновлення, щоб не блокувати всю сторінку
    // setLoading(true);
    const { error: jobErr } = await supabase
      .from("jobs")
      .update({ [field]: value })
      .eq("id", jobId);

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
          ? `User ${actor} set status "${value}" for order #${jobId}`
          : `Admin ${actor} ${
              value === "approved" ? "approved" : "rejected"
            } completion for order #${jobId}`;
      addActivity(msg);

      if (field === "worker_status" && value === "in_progress" && user?.id) {
        // Додано перевірку user.id
        try {
          await supabase.from("job_updates").insert([
            {
              job_id: jobId,
              worker_id: user.id,
              message: `Worker ${actor} started order #${jobId}`,
            },
          ]);
        } catch (updErr) {
          console.error("Не вдалося додати job_update:", updErr);
        }
      }
    }
    // setLoading(false);
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;
      setLoading(true);
      setError(null);
      setCompanyName(""); // Скидаємо ім'я компанії
      try {
        const { data, error: fetchErr } = await supabase
          .from("jobs")
          .select(
            `
            *, 
            company_id, 
            work_order_number, 
            storage_info, 
            admin_instructions,
            job_order_photo_url 
          `
          ) // Явно вказуємо поля
          .eq("id", jobId)
          .single();

        if (fetchErr) throw fetchErr;

        if (data) {
          setJob({
            ...data,
            workerStatus: data.worker_status || "not_started",
            adminStatus: data.admin_status || "pending",
          });

          // Завантажуємо ім'я компанії, якщо є company_id
          if (data.company_id) {
            const { data: companyData, error: companyError } = await supabase
              .from("companies")
              .select("name")
              .eq("id", data.company_id)
              .single();
            if (companyError) {
              console.error(
                "Error fetching company name:",
                companyError.message
              );
            } else if (companyData) {
              setCompanyName(companyData.name);
            }
          }
        } else {
          setError("Job not found.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [jobId]);

  if (loading && !job)
    return <p className={styles.loading}>Loading job details...</p>;
  if (error) return <p className={styles.error}>Error: {error}</p>;
  if (!job && !loading) return <p className={styles.error}>Job not found.</p>;

  // Вкладки
  const tabs = [
    { path: "photos-after", label: "After Photos" },
    ...(user?.role === "admin"
      ? [{ path: "job-order-photo", label: "Job Order Photo" }]
      : []),
    { path: "worker-notes", label: "Worker Notes" },
    ...(user?.role === "admin" ? [{ path: "workers", label: "Workers" }] : []),
    { path: "invoices", label: "Invoices" },
    { path: "materials", label: "Materials" },
  ];

  const defaultActiveTabPath = "photos-after";

  return (
    <div className={styles.jobDetails}>
      <div className={styles.btnContainer}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <h1 className={styles.title}>Order #{job.id}</h1>

      {/* Основна інформація про замовлення */}
      <div className={styles.jobInfoBlock}>
        <p className={styles.detail}>
          <strong>Address:</strong> {job.address || "N/A"}
        </p>
        <p className={styles.detail}>
          <strong>Builder:</strong> {job.client || "N/A"}
        </p>
        {job.date && (
          <p className={styles.detail}>
            <strong>Date:</strong> {new Date(job.date).toLocaleDateString()}
          </p>
        )}

        {/* Додаткові поля */}
        {job.work_order_number && (
          <p className={styles.detail}>
            <strong>Work Order #:</strong> {job.work_order_number}
          </p>
        )}
        {companyName && (
          <p className={styles.detail}>
            <strong>Company:</strong> {companyName}
          </p>
        )}
        {job.storage_info && (
          <p className={styles.detail}>
            <strong>Storage Info:</strong> {job.storage_info}
          </p>
        )}

        {job.admin_instructions &&
          (user?.role === "admin" || user?.role === "worker") && (
            <div className={styles.instructionsBlock}>
              <strong>Admin Instructions:</strong>
              <p className={styles.instructionText}>{job.admin_instructions}</p>
            </div>
          )}
      </div>

      {job && (
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
            Worker:{" "}
            {job.workerStatus === "not_started"
              ? "Not Started"
              : job.workerStatus === "in_progress"
              ? "In Progress"
              : "Work Done"}
          </div>

          {user.role === "worker" && job.workerStatus === "not_started" && (
            <button
              className={styles.actionBtn}
              onClick={() => updateField("worker_status", "in_progress")}
              // disabled={loading} // Використовуйте окремий actionLoading, якщо потрібно
            >
              Start Work
            </button>
          )}
          {user.role === "worker" && job.workerStatus === "in_progress" && (
            <button
              className={styles.actionBtn}
              onClick={() => updateField("worker_status", "done")}
              // disabled={loading}
            >
              Finish Work
            </button>
          )}

          {user.role === "admin" && (
            <>
              <div
                className={`${styles.badge} ${
                  job.adminStatus === "pending" && job.workerStatus === "done"
                    ? styles.badgeInProgress
                    : job.adminStatus === "approved"
                    ? styles.badgeDoneGreen
                    : job.adminStatus === "rejected"
                    ? styles.badgeError
                    : styles.badgeNotStarted
                }`}
              >
                Admin:{" "}
                {job.adminStatus === "pending" && job.workerStatus === "done"
                  ? "Pending Approval"
                  : job.adminStatus === "approved"
                  ? "Approved"
                  : job.adminStatus === "rejected"
                  ? "Rejected"
                  : "Awaiting worker"}
              </div>

              {job.workerStatus === "done" && job.adminStatus === "pending" && (
                <>
                  <button
                    className={styles.actionBtn}
                    onClick={() => updateField("admin_status", "approved")}
                    // disabled={loading}
                  >
                    Approve Completion
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => {
                      updateField("admin_status", "rejected");
                    }}
                    // disabled={loading}
                  >
                    Reject Completion
                  </button>
                </>
              )}
              {job.adminStatus === "rejected" && (
                <button
                  className={styles.actionBtn}
                  onClick={() => {
                    updateField("worker_status", "in_progress");
                    updateField("admin_status", "pending");
                  }}
                  // disabled={loading}
                >
                  Re-open Job
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className={styles.tabs}>
        {tabs.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path === "" ? defaultActiveTabPath : path}
            end={path === defaultActiveTabPath}
            className={({ isActive }) => {
              const isBaseForIndexTab =
                (location.pathname === `/orders/${jobId}` ||
                  location.pathname === `/orders/${jobId}/`) &&
                path === defaultActiveTabPath;
              return isActive || isBaseForIndexTab
                ? styles.activeTab
                : styles.tab;
            }}
          >
            {label}
          </NavLink>
        ))}
      </div>

      <div className={styles.content}>
        <Outlet context={{ jobData: job }} />
      </div>
    </div>
  );
}
