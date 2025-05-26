// src/Pages/Workers.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./Workers.module.css";
import {
  Users,
  UserCog,
  ChevronRight,
  ServerCrash,
  SearchX,
} from "lucide-react"; // Іконки

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true); // Встановлюємо true за замовчуванням
  const [error, setError] = useState(null);
  // const { user } = useContext(AppContext); // user тут не використовується, можна прибрати, якщо немає логіки прав доступу

  useEffect(() => {
    const fetchWorkers = async () => {
      // Перейменовуємо анонімну функцію для ясності
      setLoading(true);
      setError(null); // Скидаємо помилку перед кожним запитом
      try {
        const { data, error: fetchError } = await supabase // Перейменовуємо error на fetchError
          .from("workers")
          .select("id, name, role")
          .order("name", { ascending: true });
        if (fetchError) throw fetchError;
        setWorkers(data || []); // Встановлюємо порожній масив, якщо data null
      } catch (e) {
        setError(e.message);
        setWorkers([]); // При помилці також встановлюємо порожній масив
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers(); // Викликаємо іменовану функцію
  }, []);

  if (loading) {
    return (
      <div className={`${styles.page} ${styles.centeredStatus}`}>
        {/* <Spinner size="xl" /> Chakra UI Spinner, якщо використовується, або свій лоадер */}
        <p className={styles.loadingText}>Loading workers…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.page} ${styles.centeredStatus}`}>
        <ServerCrash size={48} className={styles.errorIcon} />
        <p className={styles.errorText}>Error loading workers: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.workersPage}>
      {" "}
      {/* Змінено клас для уникнення конфлікту з .page */}
      <header className={styles.pageHeader}>
        <Users size={32} className={styles.headerIcon} />
        <h1 className={styles.mainTitle}>Workers List</h1>
      </header>
      {workers.length === 0 && (
        <div className={`${styles.centeredStatus} ${styles.emptyState}`}>
          <SearchX size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>No workers found.</p>
          {/* Можна додати кнопку для створення працівника, якщо така функція є/планується */}
          {/* <Link to="/workers/new" className={styles.addWorkerButton}>Add New Worker</Link> */}
        </div>
      )}
      {workers.length > 0 && (
        <ul className={styles.workerList}>
          {workers.map((w) => (
            <li key={w.id} className={styles.workerItemCard}>
              <div className={styles.workerInfo}>
                <div className={styles.avatarPlaceholder}>
                  {/* <UserCircle size={40} /> Замість індекса можна іконку користувача */}
                  {w.name ? w.name.charAt(0).toUpperCase() : "?"}
                </div>
                <div className={styles.nameAndRole}>
                  <span className={styles.workerName}>{w.name || "N/A"}</span>
                  <span className={styles.workerRole}>
                    <UserCog size={14} className={styles.roleIcon} />
                    {w.role || "No role assigned"}
                  </span>
                </div>
              </div>
              <Link
                to={`/workers/${w.id}`}
                className={styles.profileLinkButton}
                aria-label={`View profile of ${w.name}`}
              >
                View Profile
                <ChevronRight size={18} className={styles.profileLinkIcon} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
