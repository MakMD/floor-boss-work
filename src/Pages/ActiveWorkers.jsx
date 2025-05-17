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
        if (!ids.length) return setWorkers([]);

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

  if (loading) return <p>Loading assigned workers…</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!workers.length) return <p>No assigned workers.</p>;

  return (
    <ul className={styles.list}>
      {workers.map((w, idx) => (
        <li key={w.id}>
          <Link to={`/workers/${w.id}`}>
            {idx + 1}. {w.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
