import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./Workers.module.css";

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let { data, error } = await supabase
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

  if (loading) return <p>Loading workers…</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!workers.length) return <p>No workers found.</p>;

  return (
    <ul className={styles.list}>
      {workers.map((w, idx) => (
        <li key={w.id} className={styles.item}>
          <Link to={`/workers/${w.id}`}>
            {idx + 1}. {w.name} ({w.role})
          </Link>
        </li>
      ))}
    </ul>
  );
}
