// src/Pages/ActiveWorkers.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./ActiveWorkers.module.css";

const JOBS_API = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";
const WORKERS_API = "https://680eea7067c5abddd1934af2.mockapi.io/workers";

export default function ActiveWorkers() {
  const { id } = useParams();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Fetch job → отримуємо масив workerIds
    fetch(`${JOBS_API}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch job");
        return res.json();
      })
      .then((job) => {
        const ids = Array.isArray(job.workerIds) ? job.workerIds : [];
        // Fetch всіх працівників і фільтруємо
        return fetch(WORKERS_API)
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch workers");
            return res.json();
          })
          .then((all) => all.filter((w) => ids.includes(w.id)));
      })
      .then((filtered) => setWorkers(filtered))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className={styles.loading}>Loading workers…</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (workers.length === 0)
    return <p className={styles.empty}>No workers assigned to this order.</p>;

  return (
    <ul className={styles.list}>
      {workers.map((w) => (
        <li key={w.id} className={styles.item}>
          <Link to={`/workers/${w.id}`} className={styles.link}>
            {w.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
