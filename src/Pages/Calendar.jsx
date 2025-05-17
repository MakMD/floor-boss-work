// src/Pages/Calendar.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "./Calendar.module.css";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";

// Парсить YYYY-MM-DD як локальну дату (щоб уникнути зсуву часу UTC)
function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function CalendarPage() {
  const { user } = useContext(AppContext);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Обрана дата та фільтри
  const [activeDate, setActiveDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Завантажуємо всі роботи
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("jobs")
        .select("id, address, date, client, job_workers(worker_id)")
        .order("date", { ascending: true });
      if (fetchError) {
        setError(fetchError.message);
        setJobs([]);
      } else {
        setJobs(
          data.map((job) => ({
            ...job,
            workerIds: job.job_workers?.map((jw) => jw.worker_id) || [],
          }))
        );
      }
      setLoading(false);
    })();
  }, []);

  // Фільтрація за роллю
  const accessibleJobs =
    user?.role === "worker"
      ? jobs.filter((job) => job.workerIds.includes(user.id))
      : jobs;

  // Текстовий фільтр
  const afterText = accessibleJobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    return (
      (job.address || "").toLowerCase().includes(term) ||
      (job.client || "").toLowerCase().includes(term)
    );
  });

  // Фільтр по даті або всі
  const dateFiltered = afterText.filter((job) => {
    if (showAll) return true;
    if (!job.date) return false;
    return (
      parseLocalDate(job.date).toDateString() === activeDate.toDateString()
    );
  });

  // Групуємо за датами
  const grouped = dateFiltered.reduce((acc, job) => {
    const key = job.date || "Unknown date";
    if (!acc[key]) acc[key] = [];
    acc[key].push(job);
    return acc;
  }, {});

  // Сортуємо дати від нових до старих
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => parseLocalDate(b) - parseLocalDate(a)
  );

  return (
    <div className={styles.calendarPage}>
      {/* Пошук */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by address or client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Календар */}
      <div className={styles.calendarWrapper}>
        <ReactCalendar
          onChange={(date) => {
            setActiveDate(date);
            setShowAll(false);
          }}
          value={showAll ? null : activeDate}
          className={styles.reactCalendar}
        />
      </div>

      {/* Кнопка Show All / Filter by Date */}
      <div className={styles.buttonContainer}>
        <button
          className={styles.showAllBtn}
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Filter by Date" : "Show All Orders"}
        </button>
      </div>

      {/* Заголовок та список */}
      <div className={styles.eventsContainer}>
        <h2 className={styles.title}>
          {showAll
            ? "All Orders"
            : `Orders on ${activeDate.toLocaleDateString()}`}
        </h2>

        {loading && <p className={styles.loading}>Loading...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && sortedDates.length === 0 && (
          <p className={styles.noResults}>
            {user?.role === "worker"
              ? "No assigned orders."
              : "No orders match your criteria."}
          </p>
        )}

        {sortedDates.map((dateKey) => {
          const jobsForDate = grouped[dateKey].sort(
            (a, b) => Number(b.id) - Number(a.id)
          );
          return (
            <div key={dateKey} className={styles.dateGroup}>
              <h3 className={styles.dateHeader}>{dateKey}</h3>
              <ul className={styles.jobList}>
                {jobsForDate.map((job) => (
                  <li key={job.id} className={styles.jobItem}>
                    {/* Виправлено шлях: /orders/:id */}
                    <Link to={`/orders/${job.id}`} className={styles.jobLink}>
                      Order #{job.id}: {job.client || job.address}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
