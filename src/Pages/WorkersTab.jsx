import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./TabForWorkers.module.css";

const JOBS_API = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";
const WORKERS_API = "https://680eea7067c5abddd1934af2.mockapi.io/workers";

export default function WorkersTab() {
  const { id } = useParams();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${JOBS_API}/${id}`).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch job");
        return res.json();
      }),
      fetch(WORKERS_API).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch workers");
        return res.json();
      }),
    ])
      .then(([job, allWorkers]) => {
        const assignedIds = Array.isArray(job.workerIds) ? job.workerIds : [];
        const assignedWorkers = allWorkers.filter((w) =>
          assignedIds.includes(w.id)
        );
        setWorkers(assignedWorkers);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className={styles.loading}>Loading workers...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!workers.length)
    return <p className={styles.empty}>No workers assigned to this order.</p>;

  return (
    <ul className={styles.workersList}>
      {workers.map((w) => (
        <li key={w.id} className={styles.workerItem}>
          <Link to={`/workers/${w.id}`} className={styles.workerLink}>
            {w.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
