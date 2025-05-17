// src/Pages/Home.jsx
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { AppContext } from "../components/App/App";
import styles from "./Home.module.css";

export default function Home() {
  const { user } = useContext(AppContext);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from("job_updates")
          .select("id, job_id, message, created_at")
          .order("created_at", { ascending: false });

        // Працівник бачить тільки свої оновлення
        if (user.role === "worker") {
          query = query.eq("worker_id", user.id);
        }

        const { data, error: fetchErr } = await query;
        if (fetchErr) throw fetchErr;
        setUpdates(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className={styles.homePage}>
      <h2 className={styles.title}>
        {user.role === "worker" ? "Your Updates" : "Latest Updates"}
      </h2>

      <ul className={styles.activityList}>
        {loading && <li className={styles.loading}>Loading updates…</li>}

        {!loading && error && <li className={styles.error}>{error}</li>}

        {!loading && !error && updates.length === 0 && (
          <li className={styles.empty}>
            {user.role === "worker"
              ? "No updates for you yet."
              : "No updates yet."}
          </li>
        )}

        {!loading &&
          !error &&
          updates.map((item) => (
            <li key={item.id} className={styles.activityItem}>
              <span className={styles.activityTime}>
                {new Date(item.created_at).toLocaleString()}
              </span>{" "}
              <Link
                to={`/orders/${item.job_id}`}
                className={styles.activityLink}
              >
                {item.message}
              </Link>
            </li>
          ))}
      </ul>

      <div className={styles.footer}>
        <h3 className={styles.footerTitle}>Contact Information</h3>
        <ul className={styles.contactList}>
          <li className={styles.contactItem}>
            <a href="tel:+14031234567" className={styles.contactLink}>
              📞 Myroslav: +1 (825) 461-1950
            </a>
          </li>
          <li className={styles.contactItem}>
            <a href="tel:+14039876543" className={styles.contactLink}>
              📞 Misha: +1 (403) 987-6543
            </a>
          </li>
        </ul>
        <p className={styles.address}>
          📍 5244 Kinney Pl SW, Edmonton, AB T6W 5G5
        </p>
      </div>
    </div>
  );
}
