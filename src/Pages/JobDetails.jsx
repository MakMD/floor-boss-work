// src/Pages/JobDetails.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  useParams,
  useNavigate,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import styles from "./JobDetails.module.css";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import { useToast } from "@chakra-ui/react"; // <--- НОВИЙ ІМПОРТ

export default function JobDetails() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { user, addActivity } = useContext(AppContext);
  const location = useLocation();
  const toast = useToast(); // <--- ІНІЦІАЛІЗАЦІЯ TOAST

  const [job, setJob] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true); // Для початкового завантаження деталей замовлення
  const [actionLoading, setActionLoading] = useState(false); // Для операцій зміни статусу
  const [error, setError] = useState(null);

  const updateField = async (field, value) => {
    setActionLoading(true); // Блокуємо кнопки на час виконання
    setError(null); // Скидаємо попередні помилки (якщо вони відображаються локально)

    try {
      const { error: jobErr } = await supabase
        .from("jobs")
        .update({ [field]: value })
        .eq("id", jobId);

      if (jobErr) throw jobErr;

      // Оновлюємо локальний стан для негайного відображення змін
      // Використовуємо функціональну форму setJob для гарантії актуальності prev
      setJob((prevJob) => ({
        ...prevJob,
        ...(field === "worker_status" ? { workerStatus: value } : {}),
        ...(field === "admin_status" ? { adminStatus: value } : {}),
      }));

      const actor = user?.name || user?.email || `User ID: ${user?.id}`;
      const statusType =
        field === "worker_status" ? "Worker status" : "Admin status";
      const activityMessage = `${actor} set ${statusType.toLowerCase()} to "${value}" for order #${jobId}`;

      addActivity({
        // <--- ОНОВЛЕНИЙ ВИКЛИК
        message: activityMessage,
        jobId: jobId, // Переконайтеся, що jobId тут правильного типу (UUID або BIGINT, як у вашій БД)
        details: {
          fieldUpdated: field,
          newValue: value,
          previousStatus:
            job[field === "worker_status" ? "workerStatus" : "adminStatus"],
        },
      });

      if (field === "worker_status" && value === "in_progress" && user?.id) {
        const startWorkMessage = `Worker ${actor} started order #${jobId}`;
        const { error: updErr } = await supabase.from("job_updates").insert([
          // Це окремий лог для job_updates
          {
            job_id: jobId,
            worker_id: user.id,
            message: startWorkMessage,
          },
        ]);
        if (updErr) {
          console.error("Failed to add job_update for starting work:", updErr);
          toast({
            title: "Activity Log Warning",
            description:
              "Could not log work start to job_updates, but status was updated.",
            status: "warning",
            duration: 5000,
            isClosable: true,
            position: "top-right",
          });
        } else {
          // Додатково логуємо цю ж подію в activity_log для централізації
          addActivity({
            // <--- ОНОВЛЕНИЙ ВИКЛИК
            message: startWorkMessage,
            jobId: jobId,
            details: { action: "work_started_in_job_updates" },
          });
        }
      }

      if (field === "worker_status" && value === "in_progress" && user?.id) {
        const { error: updErr } = await supabase.from("job_updates").insert([
          {
            job_id: jobId,
            worker_id: user.id, // Переконуємося, що user.id існує
            message: `Worker ${actor} started order #${jobId}`,
          },
        ]);
        if (updErr) {
          // Не блокуємо основний потік, але логуємо помилку додавання job_update
          console.error("Failed to add job_update for starting work:", updErr);
          toast({
            title: "Activity Log Warning",
            description:
              "Could not log work start activity, but status was updated.",
            status: "warning",
            duration: 5000,
            isClosable: true,
            position: "top-right",
          });
        }
      }
    } catch (jobErr) {
      const errorMsg = `Failed to update status: ${jobErr.message}`;
      setError(errorMsg); // Можна залишити для відображення помилки на сторінці, якщо потрібно
      toast({
        title: "Error Updating Status",
        description: errorMsg,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setActionLoading(false); // Розблоковуємо кнопки
    }
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;
      setLoading(true);
      setError(null);
      setCompanyName("");
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
          )
          .eq("id", jobId)
          .single();

        if (fetchErr) throw fetchErr;

        if (data) {
          setJob({
            ...data,
            workerStatus: data.worker_status || "not_started",
            adminStatus: data.admin_status || "pending",
          });

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
              // Не показуємо тост за помилку завантаження назви компанії,
              // оскільки це не критично для основного функціоналу сторінки.
            } else if (companyData) {
              setCompanyName(companyData.name);
            }
          }
        } else {
          setError("Job not found."); // Це буде оброблено нижче
        }
      } catch (err) {
        const errorMsg = `Failed to load job details: ${err.message}`;
        setError(errorMsg);
        toast({
          // Показуємо тост при помилці завантаження основних даних
          title: "Error Loading Job Details",
          description: errorMsg,
          status: "error",
          duration: 7000,
          isClosable: true,
          position: "top-right",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [jobId, toast]); // Додано toast до залежностей

  if (loading && !job)
    return <p className={styles.loading}>Loading job details...</p>;
  if (error && !job) return <p className={styles.errorMsg}>Error: {error}</p>; // Використовуємо errorMsg для консистентності
  if (!job && !loading)
    return <p className={styles.errorMsg}>Job not found.</p>; // Використовуємо errorMsg

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
        <button
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          disabled={actionLoading}
        >
          ← Back
        </button>
      </div>

      <h1 className={styles.title}>Order #{job.id}</h1>

      <div className={styles.jobInfoBlock}>
        <p className={styles.detail}>
          <strong>Address:</strong> {job.address || "N/A"}
        </p>
        <p className={styles.detail}>
          <strong>Builder:</strong> {job.client || "N/A"}
        </p>
        {job.date && (
          <p className={styles.detail}>
            <strong>Date:</strong>{" "}
            {new Date(job.date.replace(/-/g, "/")).toLocaleDateString()}
          </p>
        )}
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
              disabled={actionLoading || loading}
            >
              Start Work
            </button>
          )}
          {user.role === "worker" && job.workerStatus === "in_progress" && (
            <button
              className={styles.actionBtn}
              onClick={() => updateField("worker_status", "done")}
              disabled={actionLoading || loading}
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
                  : "Awaiting Worker Action"}
              </div>

              {job.workerStatus === "done" && job.adminStatus === "pending" && (
                <>
                  <button
                    className={styles.actionBtn}
                    onClick={() => updateField("admin_status", "approved")}
                    disabled={actionLoading || loading}
                  >
                    Approve Completion
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => {
                      updateField("admin_status", "rejected");
                      // Додатково можна скинути статус працівника, якщо це бізнес-логіка
                      // updateField("worker_status", "not_started");
                    }}
                    disabled={actionLoading || loading}
                  >
                    Reject Completion
                  </button>
                </>
              )}
              {/* Дозволяємо адміну повторно відкрити роботу, якщо вона відхилена */}
              {job.adminStatus === "rejected" && (
                <button
                  className={styles.actionBtn}
                  onClick={() => {
                    updateField("worker_status", "not_started"); // Повертаємо до початкового стану працівника
                    updateField("admin_status", "pending"); // Адмін знову очікує дій
                  }}
                  disabled={actionLoading || loading}
                >
                  Re-open Job
                </button>
              )}
              {/* Додаємо можливість адміну змінювати статус працівника, якщо потрібно */}
              {user.role === "admin" &&
                job.workerStatus !== "done" &&
                job.adminStatus !== "approved" && (
                  <button
                    className={styles.actionBtn}
                    style={{
                      backgroundColor: "#ffc107",
                      color: "#212529",
                      marginLeft: "auto",
                    }} // Приклад іншого стилю
                    onClick={() => updateField("worker_status", "done")}
                    disabled={actionLoading || loading}
                  >
                    Force Worker Done
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
            onClick={(e) => actionLoading && e.preventDefault()} // Запобігаємо навігації під час дії
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
