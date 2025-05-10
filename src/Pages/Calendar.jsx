import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "./Calendar.module.css";
import { AppContext } from "../components/App/App";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function CalendarPage() {
  const { user } = useContext(AppContext);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeDate, setActiveDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

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

  // First, filter by worker role: workers see only their orders
  const accessibleJobs =
    user?.role === "worker"
      ? jobs.filter((job) => job.workerIds?.includes(user.id))
      : jobs;

  // Then apply date & search filters
  const filtered = accessibleJobs.filter((job) => {
    // date filter
    const jobDate = new Date(job.date);
    const sameDate = showAll
      ? true
      : jobDate.toDateString() === activeDate.toDateString();

    // text search filter
    const term = searchTerm.toLowerCase();
    const address = job.address?.toLowerCase() || "";
    const client = job.client?.toLowerCase() || "";
    const matchText = address.includes(term) || client.includes(term);

    return sameDate && matchText;
  });

  return (
    <div className={styles.calendarPage}>
      {/* Search field */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by address or client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Calendar */}
      <div className={styles.calendarWrapper}>
        <ReactCalendar
          onChange={(date) => {
            setActiveDate(date);
            setShowAll(false);
          }}
          value={activeDate}
          className={styles.reactCalendar}
        />
      </div>

      {/* Show All button */}
      <div className={styles.buttonContainer}>
        <button
          className={styles.showAllBtn}
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Filter by Date" : "Show All Orders"}
        </button>
      </div>

      {/* Orders List */}
      <div className={styles.eventsContainer}>
        <h2 className={styles.title}>
          {showAll
            ? "All Orders"
            : `Orders on ${activeDate.toLocaleDateString()}`}
        </h2>

        {loading && <p className={styles.loading}>Loading...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && filtered.length === 0 && (
          <p className={styles.noResults}>
            {user?.role === "worker"
              ? "No assigned orders."
              : "No orders match your criteria."}
          </p>
        )}

        <ul className={styles.jobList}>
          {filtered.map((job) => (
            <li key={job.id} className={styles.jobItem}>
              <Link to={`/job/${job.id}`} className={styles.jobLink}>
                Order #{job.id}: {job.client || job.address}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
