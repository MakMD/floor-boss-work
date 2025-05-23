// src/Pages/WorkerProfile.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase"; //
import { AppContext } from "../components/App/App"; //
import styles from "./WorkerProfile.module.css"; //

export default function WorkerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AppContext); //
  // … решта без змін …

  const [worker, setWorker] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Додамо стан для пошукового запиту
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null); // Скидаємо помилку перед кожним завантаженням
      try {
        // 1) Дані працівника
        const { data: w, error: wErr } = await supabase
          .from("workers")
          .select("id, name, role")
          .eq("id", id)
          .single();
        if (wErr) throw wErr;
        setWorker(w);

        // 2) Зв’язки job_workers → job_id
        const { data: rels, error: rErr } = await supabase
          .from("job_workers")
          .select("job_id")
          .eq("worker_id", id);
        if (rErr) throw rErr;
        const jobIds = rels.map((r) => r.job_id);

        // 3) Завантажуємо jobs за цими id
        let assigned = [];
        if (jobIds.length > 0) {
          const { data: jData, error: jErr } = await supabase
            .from("jobs")
            .select("id, address, date, client") // Додамо client для можливого пошуку
            .in("id", jobIds)
            .order("date", { ascending: false });
          if (jErr) throw jErr;
          assigned = jData || []; // Переконуємося, що assigned завжди масив
        }

        setJobs(assigned);
      } catch (e) {
        setError(e.message);
        setJobs([]); // Скидаємо jobs у випадку помилки
        setWorker(null); // Скидаємо worker у випадку помилки
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Фільтрація робіт на основі searchTerm
  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    return (
      job.address?.toLowerCase().includes(term) ||
      job.client?.toLowerCase().includes(term) ||
      job.id?.toString().includes(term) ||
      (job.date && new Date(job.date).toLocaleDateString().includes(term))
    );
  });

  if (loading) return <p className={styles.loading}>Loading profile...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!worker) return <p className={styles.error}>Worker not found.</p>;

  return (
    <div className={styles.page}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        &larr; Back
      </button>
      <h2 className={styles.title}>{worker.name}</h2>
      <p className={styles.detail}>
        <strong>Role:</strong> {worker.role}
      </p>

      <div className={styles.jobsSection}>
        <h3 className={styles.subtitle}>Assigned Jobs</h3>

        {/* Поле пошуку */}
        <input
          type="text"
          placeholder="Search assigned jobs (by ID, Address, Client, Date)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput} // Потрібно буде додати цей стиль
        />

        {filteredJobs.length > 0 ? (
          <ul className={styles.jobList}>
            {filteredJobs.map((job) => (
              <li key={job.id} className={styles.jobItem}>
                {/* Виправлено шлях тут */}
                <Link to={`/orders/${job.id}`} className={styles.jobLink}>
                  Order #{job.id} — {job.address || "No Address"} (
                  {job.date
                    ? new Date(job.date).toLocaleDateString()
                    : "No Date"}
                  ){job.client && ` — Client: ${job.client}`}
                </Link>
              </li>
            ))}
          </ul>
        ) : jobs.length > 0 && searchTerm ? (
          <p className={styles.noResults}>
            No jobs match your search criteria.
          </p>
        ) : (
          <p className={styles.noResults}>No jobs assigned.</p>
        )}
      </div>
    </div>
  );
}
