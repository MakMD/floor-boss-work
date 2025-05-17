import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./Workers.module.css";

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AppContext);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("workers")
          .select("id, name, role")
          .order("name", { ascending: true });
        if (error) throw error;
        setWorkers(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Workers</h1>

      {loading && <p className={styles.loading}>Loading workers…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && workers.length === 0 && (
        <p className={styles.empty}>No workers found.</p>
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
