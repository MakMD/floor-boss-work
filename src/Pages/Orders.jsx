// src/Pages/Home.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import Calendar from "./Calendar";
import { AppContext } from "../components/App/App";
import styles from "./Orders.module.css";

const JOBS_API = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";
const WORKERS_API = "https://680eea7067c5abddd1934af2.mockapi.io/workers";

export default function Orders() {
  const { user } = useContext(AppContext);

  // Якщо роль worker, відображаємо календар замість форми та списку
  if (user?.role === "worker") {
    return <Calendar />;
  }

  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // форма
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(selectedDate);
  const [sf, setSf] = useState("");
  const [rate, setRate] = useState("");
  const [client, setClient] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // підвантаження працівників
  useEffect(() => {
    fetch(WORKERS_API)
      .then((res) => res.json())
      .then((data) => setWorkers(data))
      .catch((err) => console.error(err));
  }, []);

  // підвантаження завдань за датою
  useEffect(() => {
    setLoading(true);
    fetch(JOBS_API)
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
  }, [selectedDate]);

  // сабміт форми
  const handleAddJob = (e) => {
    e.preventDefault();
    const newJob = {
      address,
      date,
      sf: Number(sf),
      rate: Number(rate),
      client,
      notes,
      workerIds: selectedWorkers,
      photos: [],
      photos_after_work: [],
      invoices: [],
      materials: [],
    };
    fetch(JOBS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newJob),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create job");
        return res.json();
      })
      .then((data) => {
        if (data.date === selectedDate) {
          setJobs((prev) => [...prev, data]);
        }
        // очистка форми
        setAddress("");
        setDate(selectedDate);
        setSf("");
        setRate("");
        setClient("");
        setNotes("");
        setSelectedWorkers([]);
      })
      .catch((err) => setError(err.message));
  };

  const handleWorkerSelect = (e) => {
    const opts = Array.from(e.target.selectedOptions);
    setSelectedWorkers(opts.map((o) => o.value));
  };

  return (
    <div className={styles.homePage}>
      <form onSubmit={handleAddJob} className={styles.addForm}>
        {/* Поля форми */}
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
          onChange={(e) => {
            setDate(e.target.value);
            setSelectedDate(e.target.value);
          }}
          required
          className={styles.formInput}
        />
        <input
          type="number"
          placeholder="SF (площа)"
          value={sf}
          onChange={(e) => setSf(e.target.value)}
          required
          className={styles.formInput}
        />
        <input
          type="number"
          placeholder="Rate (ставка)"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          required
          className={styles.formInput}
        />
        <input
          type="text"
          placeholder="Client"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          required
          className={styles.formInput}
        />
        <textarea
          placeholder="Notes (нотатки)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={styles.formTextarea}
        />
        <select
          multiple
          value={selectedWorkers}
          onChange={handleWorkerSelect}
          required
          className={styles.formSelect}
        >
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <button type="submit" className={styles.formButton}>
          Add Job
        </button>
      </form>

      {/* Фільтрація за датою */}
      <div className={styles.calendarContainer}>
        <input
          type="date"
          className={styles.dateInput}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Повідомлення про помилки або завантаження */}
      {error && <p className={styles.error}>{error}</p>}
      {loading && <p>Loading jobs...</p>}

      {/* Список завдань */}
      <div className={styles.tableList}>
        {jobs.length > 0
          ? jobs.map((job) => (
              <Link
                key={job.id}
                to={`/job/${job.id}`}
                className={styles.tableCard}
              >
                <div className={styles.tableHeader}>Job ID: {job.id}</div>
                <div className={styles.tableSub}>{job.address}</div>
                {/* Безпечне відображення працівників */}
                {Array.isArray(job.workerIds) && job.workerIds.length > 0 && (
                  <div className={styles.workerTag}>
                    Workers:{" "}
                    {job.workerIds
                      .map((id) => workers.find((w) => w.id === id)?.name || "")
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </Link>
            ))
          : !loading && <p>No jobs for this date.</p>}
      </div>
    </div>
  );
}
