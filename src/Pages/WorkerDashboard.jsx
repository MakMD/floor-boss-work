// src/Pages/WorkerDashboard.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { AppContext } from "../components/App/App";
import StatusBadge from "../components/common/StatusBadge"; // <-- ІМПОРТ
import styles from "./WorkerDashboard.module.css";

export default function WorkerDashboard() {
  const { user } = useContext(AppContext);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("active"); // 'active', 'completed', 'all'

  useEffect(() => {
    const fetchAssignedJobs = async () => {
      if (!user || !user.id) {
        setLoading(false);
        setAssignedJobs([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data: jobWorkerRels, error: relError } = await supabase
          .from("job_workers")
          .select("job_id")
          .eq("worker_id", user.id);

        if (relError) throw relError;

        const jobIds = jobWorkerRels.map((rel) => rel.job_id);

        if (jobIds.length === 0) {
          setAssignedJobs([]);
          setLoading(false);
          return;
        }

        let jobsQuery = supabase
          .from("jobs")
          .select(
            `
            id, 
            address, 
            client, 
            date, 
            worker_status, 
            admin_status,
            company_id, 
            companies (name) 
          `
          )
          .in("id", jobIds)
          .order("date", { ascending: true });

        if (filterStatus === "active") {
          jobsQuery = jobsQuery.or(
            "worker_status.neq.done,admin_status.eq.rejected"
          );
        } else if (filterStatus === "completed") {
          jobsQuery = jobsQuery
            .eq("worker_status", "done")
            .eq("admin_status", "approved");
        }

        const { data: jobsData, error: jobsError } = await jobsQuery;

        if (jobsError) throw jobsError;
        setAssignedJobs(jobsData || []);
      } catch (err) {
        console.error("Error fetching worker's assigned jobs:", err);
        setError(err.message);
        setAssignedJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedJobs();
  }, [user, filterStatus]);

  // ВИДАЛЕНО: Локальна функція getStatusText, оскільки тепер є компонент

  if (loading && !user)
    return <p className={styles.loading}>Authenticating...</p>;
  if (loading) return <p className={styles.loading}>Loading your jobs...</p>;

  if (user && user.role !== "worker") {
    return <p className={styles.errorPage}>This page is for workers only.</p>;
  }
  if (error && user)
    return <p className={styles.errorPage}>Error loading jobs: {error}</p>;

  return (
    <div className={styles.dashboardPage}>
      <h1 className={styles.pageTitle}>My Dashboard</h1>
      {user && (
        <p className={styles.welcomeMessage}>
          Welcome, {user.name || user.email || "Worker"}!
        </p>
      )}

      <div className={styles.filterContainer}>
        <button
          onClick={() => setFilterStatus("active")}
          className={`${styles.filterButton} ${
            filterStatus === "active" ? styles.activeFilter : ""
          }`}
        >
          Active Jobs
        </button>
        <button
          onClick={() => setFilterStatus("completed")}
          className={`${styles.filterButton} ${
            filterStatus === "completed" ? styles.activeFilter : ""
          }`}
        >
          Completed Jobs
        </button>
        <button
          onClick={() => setFilterStatus("all")}
          className={`${styles.filterButton} ${
            filterStatus === "all" ? styles.activeFilter : ""
          }`}
        >
          All My Jobs
        </button>
      </div>

      {!loading && assignedJobs.length === 0 ? (
        <p className={styles.noJobs}>
          {filterStatus === "active" && "You have no active jobs assigned."}
          {filterStatus === "completed" && "You have no completed jobs."}
          {filterStatus === "all" && "No jobs assigned to you at the moment."}
        </p>
      ) : (
        <ul className={styles.jobList}>
          {assignedJobs.map((job) => (
            <li key={job.id} className={styles.jobItem}>
              <Link to={`/orders/${job.id}`} className={styles.jobLink}>
                <div className={styles.jobHeader}>
                  <span className={styles.jobId}>Order #{job.id}</span>
                  <span className={styles.jobDate}>
                    {job.date
                      ? new Date(
                          job.date.replace(/-/g, "/")
                        ).toLocaleDateString()
                      : "No date"}
                  </span>
                </div>
                <p className={styles.jobAddress}>
                  {job.address || "No address specified"}
                </p>
                {job.client && (
                  <p className={styles.jobClient}>Builder: {job.client}</p>
                )}
                {job.companies && job.companies.name && (
                  <p className={styles.jobCompany}>
                    Company: {job.companies.name}
                  </p>
                )}
                <div className={styles.jobStatus}>
                  Status: {/* ЗМІНА: Використовуємо новий компонент */}
                  <StatusBadge
                    workerStatus={job.worker_status}
                    adminStatus={job.admin_status}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
