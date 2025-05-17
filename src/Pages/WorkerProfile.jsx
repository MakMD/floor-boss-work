import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { AppContext } from "../components/App/App";
import styles from "./WorkerProfile.module.css";

export default function WorkerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  // … решта без змін …

  const [worker, setWorker] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 1) Дані працівника
        const { data: w, error: wErr } = await supabase
          .from("workers")
          .select("id, name, role")
          .eq("id", id)
          .single();
        if (wErr) throw wErr;
        setWorker(w);

        // 2) Зв’язки job_workers → job_id
        const { data: rels, error: rErr } = await supabase
          .from("job_workers")
          .select("job_id")
          .eq("worker_id", id);
        if (rErr) throw rErr;
        const jobIds = rels.map((r) => r.job_id);

        // 3) Завантажуємо jobs за цими id
        let assigned = [];
        if (jobIds.length > 0) {
          const { data: jData, error: jErr } = await supabase
            .from("jobs")
            .select("id, address, date")
            .in("id", jobIds)
            .order("date", { ascending: false });
          if (jErr) throw jErr;
          assigned = jData;
        }

        setJobs(assigned);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p className={styles.loading}>Loading profile...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!worker) return <p className={styles.error}>Worker not found.</p>;

  return (
    <div className={styles.page}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        &larr; Back
      </button>
      <h2 className={styles.title}>{worker.name}</h2>
      <p className={styles.detail}>
        <strong>Role:</strong> {worker.role}
      </p>

      <div className={styles.jobsSection}>
        <h3 className={styles.subtitle}>Assigned Jobs</h3>
        {jobs.length > 0 ? (
          <ul className={styles.jobList}>
            {jobs.map((job) => (
              <li key={job.id} className={styles.jobItem}>
                <Link to={`/job/${job.id}`} className={styles.jobLink}>
                  Order #{job.id} — {job.address} (
                  {new Date(job.date).toLocaleDateString()})
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noResults}>No jobs assigned.</p>
        )}
      </div>
    </div>
  );
}
