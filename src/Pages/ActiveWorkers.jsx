// src/Pages/ActiveWorkers.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import styles from "./ActiveWorkers.module.css";

export default function ActiveWorkers() {
  const { id: jobId } = useParams();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: rel, error: relErr } = await supabase
          .from("job_workers")
          .select("worker_id")
          .eq("job_id", jobId);
        if (relErr) throw relErr;
        const ids = rel.map((r) => r.worker_id);
        if (!ids.length) {
          setWorkers([]);
          setLoading(false);
          return;
        }

        const { data, error: usrErr } = await supabase
          .from("workers")
          .select("id, name, role")
          .in("id", ids)
          .order("name", { ascending: true });
        if (usrErr) throw usrErr;
        setWorkers(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Assigned Workers</h2>

      {loading && <p className={styles.loading}>Loading assigned workers…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && workers.length === 0 && (
        <p className={styles.empty}>No assigned workers.</p>
      )}

      {!loading && !error && workers.length > 0 && (
        <ul className={styles.list}>
          {workers.map((w, idx) => (
            <li key={w.id} className={styles.item}>
              <span className={styles.index}>{idx + 1}</span>
              <Link to={`/workers/${w.id}`} className={styles.link}>
                <span className={styles.workerName}>{w.name}</span>
                <span className={styles.workerRole}>{w.role}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
