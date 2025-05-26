// src/Pages/WorkerProfile.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { AppContext } from "../components/App/App";
import styles from "./WorkerProfile.module.css";
import {
  ArrowLeft,
  UserCircle,
  Briefcase,
  Search,
  ExternalLink,
  ServerCrash,
  UserX,
  ListChecks,
} from "lucide-react"; // Іконки

export default function WorkerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  // const { user } = useContext(AppContext); // user з AppContext тут не використовується для логіки прав, але може знадобитися для інших цілей

  const [worker, setWorker] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchWorkerProfileData = async () => {
      // Перейменовано для ясності
      setLoading(true);
      setError(null);
      try {
        const { data: workerData, error: workerError } = await supabase
          .from("workers")
          .select("id, name, role")
          .eq("id", id)
          .single();
        if (workerError) throw workerError;
        setWorker(workerData);

        if (workerData) {
          // Завантажуємо роботи тільки якщо працівника знайдено
          const { data: jobRelations, error: relationsError } = await supabase
            .from("job_workers")
            .select("job_id")
            .eq("worker_id", id);
          if (relationsError) throw relationsError;

          const jobIds = jobRelations.map((r) => r.job_id);
          let assignedJobsData = [];
          if (jobIds.length > 0) {
            const { data: jobsData, error: jobsError } = await supabase
              .from("jobs")
              .select("id, address, date, client, worker_status, admin_status") // Додаємо статуси
              .in("id", jobIds)
              .order("date", { ascending: false });
            if (jobsError) throw jobsError;
            assignedJobsData = jobsData || [];
          }
          setJobs(assignedJobsData);
        } else {
          // Якщо працівника не знайдено, jobs залишаться порожнім масивом
          setJobs([]);
        }
      } catch (e) {
        setError(e.message);
        setJobs([]);
        setWorker(null);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkerProfileData();
  }, [id]);

  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    const jobDate = job.date
      ? new Date(job.date.replace(/-/g, "/")).toLocaleDateString()
      : "";
    return (
      job.address?.toLowerCase().includes(term) ||
      job.client?.toLowerCase().includes(term) ||
      job.id?.toString().includes(term) ||
      jobDate.includes(term)
    );
  });

  // Функція для отримання JSX бейджа статусу
  const getStatusBadge = (job) => {
    let statusText = "Unknown";
    let statusClassKey = "statusBadgeUnknown";

    if (job.admin_status === "approved") {
      statusText = "Approved";
      statusClassKey = "statusBadgeApproved";
    } else if (job.admin_status === "rejected") {
      statusText = "Rejected";
      statusClassKey = "statusBadgeRejected";
    } else if (job.worker_status === "done") {
      statusText = "Pending Approval";
      statusClassKey = "statusBadgePending";
    } else if (job.worker_status === "in_progress") {
      statusText = "In Progress";
      statusClassKey = "statusBadgeInProgress";
    } else if (job.worker_status === "not_started") {
      statusText = "Not Started";
      statusClassKey = "statusBadgeNotStarted";
    }
    const badgeClass = styles[statusClassKey] || styles.statusBadgeUnknown;
    return (
      <span className={`${styles.statusBadge} ${badgeClass}`}>
        {statusText}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`${styles.profilePage} ${styles.centeredStatus}`}>
        <p className={styles.loadingText}>Loading worker profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.profilePage} ${styles.centeredStatus}`}>
        <ServerCrash size={48} className={styles.errorIcon} />
        <p className={styles.errorText}>Error loading profile: {error}</p>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <ArrowLeft size={18} /> Go Back
        </button>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className={`${styles.profilePage} ${styles.centeredStatus}`}>
        <UserX size={48} className={styles.emptyIcon} />
        <p className={styles.errorText}>Worker not found.</p>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <ArrowLeft size={18} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <header className={styles.profileHeader}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <ArrowLeft size={20} /> Back to Workers List
        </button>
        <div className={styles.workerIdentity}>
          <div className={styles.avatarPlaceholder}>
            {worker.name ? (
              worker.name.charAt(0).toUpperCase()
            ) : (
              <UserCircle size={32} />
            )}
          </div>
          <div>
            <h1 className={styles.workerNameTitle}>{worker.name}</h1>
            <p className={styles.workerRoleDetail}>
              <Briefcase size={16} className={styles.roleIcon} />
              Role: {worker.role || "N/A"}
            </p>
          </div>
        </div>
      </header>

      <section className={styles.jobsSection}>
        <div className={styles.jobsHeader}>
          <h2 className={styles.sectionSubtitle}>
            <ListChecks size={24} className={styles.subtitleIcon} />
            Assigned Jobs ({filteredJobs.length})
          </h2>
          <div className={styles.searchInputContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search assigned jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {filteredJobs.length > 0 ? (
          <ul className={styles.jobList}>
            {filteredJobs.map((job) => (
              <li key={job.id} className={styles.jobItemCard}>
                <div className={styles.jobCardContent}>
                  <div className={styles.jobCardHeader}>
                    <h3 className={styles.jobId}>Order #{job.id}</h3>
                    {getStatusBadge(job)}
                  </div>
                  <p className={styles.jobAddress}>
                    {job.address || "No Address Specified"}
                  </p>
                  {job.client && (
                    <p className={styles.jobClient}>Client: {job.client}</p>
                  )}
                  {job.date && (
                    <p className={styles.jobDate}>
                      Date:{" "}
                      {new Date(
                        job.date.replace(/-/g, "/")
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Link
                  to={`/orders/${job.id}`}
                  className={styles.viewJobLink}
                  aria-label={`View details for order ${job.id}`}
                >
                  <ExternalLink size={18} />
                  <span>View</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : jobs.length > 0 && searchTerm ? (
          <p className={styles.noResultsText}>
            No jobs match your search criteria.
          </p>
        ) : (
          <p className={styles.noResultsText}>
            No jobs currently assigned to this worker.
          </p>
        )}
      </section>
    </div>
  );
}
