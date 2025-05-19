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

  // Завантажити апдейти
  const fetchUpdates = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("job_updates")
        .select("id, job_id, message, created_at")
        .order("created_at", { ascending: false });

      if (user.role === "worker") {
        query = query.eq("worker_id", user.profile.id);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      setUpdates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchUpdates();
  }, [user]);

  // Видалити апдейт (для admin)
  const handleDelete = async (updateId) => {
    if (!window.confirm("Видалити це оновлення?")) return;
    try {
      const { error: delErr } = await supabase
        .from("job_updates")
        .delete()
        .eq("id", updateId);
      if (delErr) throw delErr;
      // очистити зі стейту
      setUpdates((prev) => prev.filter((u) => u.id !== updateId));
    } catch (err) {
      alert("Не вдалося видалити оновлення: " + err.message);
    }
  };

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
              </span>
              <Link
                to={`/orders/${item.job_id}`}
                className={styles.activityLink}
              >
                {item.message}
              </Link>
              {user.role === "admin" && (
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(item.id)}
                >
                  ✕
                </button>
              )}
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
