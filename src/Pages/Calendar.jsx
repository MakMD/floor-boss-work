// src/Pages/Calendar.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "./Calendar.module.css";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function CalendarPage() {
  const { user } = useContext(AppContext);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeDate, setActiveDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Виносимо fetch в окрему функцію і мемоізуємо
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("jobs")
        .select("id, address, date, client, job_workers(worker_id), is_hidden")
        .order("date", { ascending: true });
      query = query.eq("is_hidden", showHidden);
      if (user.role === "worker") {
        // для workerів додатковий фільтр
        query = query.eq("job_workers.worker_id", user.id);
      }
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setJobs(
        data.map((job) => ({
          ...job,
          workerIds: job.job_workers?.map((jw) => jw.worker_id) || [],
        }))
      );
    } catch (err) {
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [showHidden, user]);

  // Початкове завантаження та при зміні showHidden або user
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (jobId) => {
    if (!window.confirm("Видалити замовлення?")) return;
    setLoading(true);
    const { error: delErr } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId);
    setLoading(false);
    if (delErr) {
      alert("Не вдалося видалити: " + delErr.message);
    } else {
      await fetchJobs();
      setEditingId(null);
    }
  };

  const handleHide = async (jobId) => {
    if (!window.confirm("Приховати замовлення?")) return;
    setLoading(true);
    const { error: updErr } = await supabase
      .from("jobs")
      .update({ is_hidden: true })
      .eq("id", jobId);
    setLoading(false);
    if (updErr) {
      alert("Не вдалося приховати: " + updErr.message);
    } else {
      await fetchJobs();
      setEditingId(null);
    }
  };

  // Фільтрація та групування
  const accessibleJobs =
    user.role === "worker"
      ? jobs.filter((job) => job.workerIds.includes(user.id))
      : jobs;
  const afterText = accessibleJobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    return (
      job.address.toLowerCase().includes(term) ||
      job.client.toLowerCase().includes(term)
    );
  });
  const dateFiltered = afterText.filter((job) =>
    showAll
      ? true
      : job.date &&
        parseLocalDate(job.date).toDateString() === activeDate.toDateString()
  );
  const grouped = dateFiltered.reduce((acc, job) => {
    const key = job.date || "Unknown date";
    if (!acc[key]) acc[key] = [];
    acc[key].push(job);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => parseLocalDate(b) - parseLocalDate(a)
  );

  return (
    <div className={styles.calendarPage}>
      {user.role === "admin" && (
        <div className={styles.hiddenToggle}>
          <button
            className={styles.toggleBtn}
            onClick={() => setShowHidden((prev) => !prev)}
          >
            {showHidden ? "Show Visible" : "Show Hidden"}
          </button>
        </div>
      )}

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by address or client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

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

      <div className={styles.buttonContainer}>
        <button
          className={styles.showAllBtn}
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Filter by Date" : "Show All Orders"}
        </button>
      </div>

      <div className={styles.eventsContainer}>
        <h2 className={styles.title}>
          {showAll
            ? showHidden
              ? "Hidden Orders"
              : "All Orders"
            : `Orders on ${activeDate.toLocaleDateString()}`}
        </h2>

        {loading && <p className={styles.loading}>Loading...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && sortedDates.length === 0 && (
          <p className={styles.noResults}>
            {user.role === "worker"
              ? "No assigned orders."
              : "No orders match your criteria."}
          </p>
        )}

        {sortedDates.map((dateKey) => (
          <div key={dateKey} className={styles.dateGroup}>
            <h3 className={styles.dateHeader}>{dateKey}</h3>
            <ul className={styles.jobList}>
              {grouped[dateKey]
                .sort((a, b) => Number(b.id) - Number(a.id))
                .map((job) => (
                  <li key={job.id} className={styles.jobItem}>
                    <Link to={`/orders/${job.id}`} className={styles.jobLink}>
                      Order #{job.id}: {job.client || job.address}
                    </Link>

                    {user.role === "admin" && (
                      <div className={styles.jobActions}>
                        {editingId === job.id ? (
                          <>
                            {!showHidden && (
                              <button
                                className={styles.hideBtn}
                                onClick={() => handleHide(job.id)}
                              >
                                Hide
                              </button>
                            )}
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDelete(job.id)}
                            >
                              Delete
                            </button>
                            <button
                              className={styles.cancelBtn}
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className={styles.editBtn}
                            onClick={() => setEditingId(job.id)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
