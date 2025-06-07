// src/Pages/WorkerProfile.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import StatusBadge from "../components/common/StatusBadge"; // <-- ІМПОРТ
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
} from "lucide-react";

export default function WorkerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [worker, setWorker] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchWorkerProfileData = async () => {
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
              .select("id, address, date, client, worker_status, admin_status")
              .in("id", jobIds)
              .order("date", { ascending: false });
            if (jobsError) throw jobsError;
            assignedJobsData = jobsData || [];
          }
          setJobs(assignedJobsData);
        } else {
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

  // ВИДАЛЕНО: Локальна функція getStatusBadge

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
                    {/* ЗМІНА: Використовуємо новий компонент */}
                    <StatusBadge
                      workerStatus={job.worker_status}
                      adminStatus={job.admin_status}
                    />
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
