// src/Pages/Orders.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Orders.module.css";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function Orders() {
  const [jobs, setJobs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [rate, setRate] = useState("");
  const [client, setClient] = useState("");
  const [worker, setWorker] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobs = () => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => setJobs(data.filter((j) => j.date === selectedDate)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetchJobs, [selectedDate]);

  const handleAdd = (e) => {
    e.preventDefault();
    const newJob = {
      address,
      date: selectedDate,
      area,
      rate,
      client,
      worker,
      notes,
      invoices: [],
      materials: [],
      photos_after_work: [],
    };
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newJob),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Create failed");
        return res.json();
      })
      .then((data) => {
        if (data.date === selectedDate) setJobs((prev) => [...prev, data]);
        setAddress("");
        setArea("");
        setRate("");
        setClient("");
        setWorker("");
        setNotes("");
      })
      .catch((err) => setError(err.message));
  };

  return (
    <div className={styles.ordersPage}>
      <form onSubmit={handleAdd} className={styles.addForm}>
        <input
          className={styles.formInput}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          required
        />
        <input
          className={styles.formInput}
          type="number"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Area (SF)"
          required
        />
        <input
          className={styles.formInput}
          type="number"
          step="0.01"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder="Rate"
          required
        />
        <input
          className={styles.formInput}
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="Client"
          required
        />
        <input
          className={styles.formInput}
          value={worker}
          onChange={(e) => setWorker(e.target.value)}
          placeholder="Worker"
          required
        />
        <textarea
          className={styles.formTextarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
        />
        <button className={styles.formButton}>Create Order</button>
      </form>

      <div className={styles.calendarContainer}>
        <input
          className={styles.dateInput}
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {loading && <p>Loading orders...</p>}

      <div className={styles.tableList}>
        {jobs.length
          ? jobs.map((job) => (
              <Link
                key={job.id}
                to={`/job/${job.id}`}
                className={styles.tableCard}
              >
                <div className={styles.tableHeader}>
                  Order #{job.id} — {job.client}
                </div>
                <div className={styles.tableSub}>
                  {job.address} | {job.area} SF @ ${job.rate}
                </div>
              </Link>
            ))
          : !loading && <p>No orders for this date.</p>}
      </div>
    </div>
  );
}
