// src/Pages/WorkerProfile.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import styles from "./WorkerProfile.module.css";

const API_WORKERS = "https://680eea7067c5abddd1934af2.mockapi.io/workers";
const API_JOBS = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function WorkerProfile() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [wRes, jRes] = await Promise.all([
          fetch(`${API_WORKERS}/${workerId}`),
          fetch(API_JOBS),
        ]);
        if (!wRes.ok || !jRes.ok) throw new Error("Network error");
        const wData = await wRes.json();
        const jData = await jRes.json();

        setWorker(wData);

        // Фільтруємо замовлення, де масив workerIds містить поточний workerId
        const assignedJobs = Array.isArray(jData)
          ? jData.filter(
              (job) =>
                Array.isArray(job.workerIds) && job.workerIds.includes(workerId)
            )
          : [];

        setJobs(assignedJobs);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [workerId]);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!worker) return <p>Worker not found.</p>;

  return (
    <div className={styles.page}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        &larr; Back
      </button>
      <h2 className={styles.title}>{worker.name}</h2>
      <p className={styles.detail}>
        <strong>Role:</strong> {worker.role || "N/A"}
      </p>
      <div className={styles.jobsSection}>
        <h3 className={styles.subtitle}>Assigned Jobs</h3>
        {jobs.length > 0 ? (
          <ul className={styles.jobList}>
            {jobs.map((job) => (
              <li key={job.id} className={styles.jobItem}>
                <Link to={`/job/${job.id}`} className={styles.jobLink}>
                  Order #{job.id} — {job.address}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No jobs assigned.</p>
        )}
      </div>
    </div>
  );
}
