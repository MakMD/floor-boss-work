// src/Pages/Calendar.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "./Calendar.module.css";
import { AppContext } from "../components/App/App";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

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

  // Обрана дата
  const [activeDate, setActiveDate] = useState(new Date());
  // Пошуковий термін
  const [searchTerm, setSearchTerm] = useState("");
  // Вмикає/вимикає фільтр по даті
  const [showAll, setShowAll] = useState(false);

  // Завантажити всі роботи
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => setJobs(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Перший зріз по ролі: worker бачить тільки свої роботи
  const accessibleJobs =
    user?.role === "worker"
      ? jobs.filter((job) => job.workerIds?.includes(user.id))
      : jobs;

  // Далі фільтр по тексту
  const afterTextFilter = accessibleJobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    return (
      (job.address || "").toLowerCase().includes(term) ||
      (job.client || "").toLowerCase().includes(term)
    );
  });

  // Тепер фільтруємо по даті, якщо showAll === false
  const dateFiltered = afterTextFilter.filter((job) => {
    if (showAll) return true;
    if (!job.date) return false;
    const jobDate = parseLocalDate(job.date);
    return jobDate.toDateString() === activeDate.toDateString();
  });

  // Групуємо по датах
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

      {/* Кнопка Show All */}
      <div className={styles.buttonContainer}>
        <button
          className={styles.showAllBtn}
          onClick={() => {
            setShowAll((prev) => {
              const next = !prev;
              if (next) {
                // скидаємо активну дату
                setActiveDate(null);
              } else {
                // повертаємо на сьогодні
                setActiveDate(new Date());
              }
              return next;
            });
          }}
        >
          {showAll ? "Filter by Date" : "Show All Orders"}
        </button>
      </div>

      {/* Список робіт, згрупований за датами */}
      <div className={styles.eventsContainer}>
        <h2 className={styles.title}>
          {showAll
            ? "All Orders"
            : activeDate
            ? `Orders on ${activeDate.toLocaleDateString()}`
            : "Orders"}
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
          // всередині кожної дати сортуємо замовлення від нових до старих за id
          const jobsForDate = grouped[dateKey].sort(
            (a, b) => Number(b.id) - Number(a.id)
          );
          return (
            <div key={dateKey} className={styles.dateGroup}>
              <h3 className={styles.dateHeader}>{dateKey}</h3>
              <ul className={styles.jobList}>
                {jobsForDate.map((job) => (
                  <li key={job.id} className={styles.jobItem}>
                    <Link to={`/job/${job.id}`} className={styles.jobLink}>
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
