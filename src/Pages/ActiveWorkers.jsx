// src/Pages/ActiveWorkers.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./ActiveWorkers.module.css";

export default function ActiveWorkers() {
  const { id } = useParams();
  const { user } = useContext(AppContext);

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Отримуємо зв'язки job_workers для цього job
        const { data: relations, error: relError } = await supabase
          .from("job_workers")
          .select("worker_id")
          .eq("job_id", id);
        if (relError) throw relError;

        const workerIds = relations.map((r) => r.worker_id);
        if (workerIds.length === 0) {
          setWorkers([]);
          return;
        }

        // 2) Завантажуємо дані працівників за отриманими ID
        const { data: users, error: usersError } = await supabase
          .from("workers")
          .select("id, name, role")
          .in("id", workerIds)
          .order("name", { ascending: true });
        if (usersError) throw usersError;

        setWorkers(users);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p className={styles.loading}>Loading workers…</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (workers.length === 0)
    return (
      <p className={styles.noResults}>No workers assigned to this order.</p>
    );

  return (
    <ul className={styles.list}>
      {workers.map((worker, index) => (
        <li key={worker.id} className={styles.item}>
          <Link to={`/workers/${worker.id}`} className={styles.link}>
            <div className={styles.workerName}>
              {index + 1}. {worker.name}
            </div>
            <div className={styles.workerRole}>{worker.role}</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
