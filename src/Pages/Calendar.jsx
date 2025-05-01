import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink, Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import styles from "./Calendar.module.css";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function Calendar() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Group jobs by date
  const grouped = jobs.reduce((acc, job) => {
    const date = job.date || "Unknown date";
    if (!acc[date]) acc[date] = [];
    acc[date].push(job);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  if (loading) return <p>Loading calendar...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.calendarPage}>
      <h2 className={styles.title}>Calendar View</h2>
      {sortedDates.length === 0 && <p>No orders available.</p>}
      {sortedDates.map((date) => (
        <div key={date} className={styles.dateGroup}>
          <h3 className={styles.dateHeader}>{date}</h3>
          <ul className={styles.jobList}>
            {grouped[date].map((job) => (
              <li key={job.id} className={styles.jobItem}>
                <Link to={`/job/${job.id}`} className={styles.jobLink}>
                  Order #{job.id}: {job.client || job.address}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
