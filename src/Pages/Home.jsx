import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";

// API resource for job tables
const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(selectedDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all job tables and filter client-side by date
  const fetchJobs = () => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => {
        const filtered = data.filter((job) => job.date === selectedDate);
        setJobs(filtered);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedDate]);

  // Add new job/table
  const handleAddJob = (e) => {
    e.preventDefault();
    const newJob = { address, date, invoices: [] };
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newJob),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create job");
        return res.json();
      })
      .then((data) => {
        // If new job matches selected date, append to state
        if (data.date === selectedDate) {
          setJobs((prev) => [...prev, data]);
        }
        setAddress("");
      })
      .catch((err) => setError(err.message));
  };

  return (
    <div className={styles.homePage}>
      {/* Form to add new job/table */}
      <form onSubmit={handleAddJob} className={styles.addForm}>
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className={styles.formInput}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className={styles.formInput}
        />
        <button type="submit" className={styles.formButton}>
          Add Table
        </button>
      </form>

      {/* Date selector */}
      <div className={styles.calendarContainer}>
        <input
          type="date"
          className={styles.dateInput}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading tables...</p>}

      <div className={styles.tableList}>
        {jobs.length > 0
          ? jobs.map((job) => (
              <Link
                key={job.id}
                to={`/job/${job.id}`}
                className={styles.tableCard}
              >
                <div className={styles.tableHeader}>Table ID: {job.id}</div>
                <div className={styles.tableSub}>{job.address}</div>
              </Link>
            ))
          : !loading && <p>No tables for this date.</p>}
      </div>
    </div>
  );
}
