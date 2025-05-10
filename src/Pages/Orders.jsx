// src/Pages/Orders.jsx
import React, { useState, useEffect, useContext } from "react";
import Select from "react-select";
import { AppContext } from "../components/App/App";
import styles from "./Orders.module.css";

const JOBS_API = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";
const WORKERS_API = "https://680eea7067c5abddd1934af2.mockapi.io/workers";

export default function Orders() {
  const { user } = useContext(AppContext);

  const [workers, setWorkers] = useState([]);
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sf, setSf] = useState("");
  const [rate, setRate] = useState("");
  const [client, setClient] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Завантажуємо працівників
  useEffect(() => {
    fetch(WORKERS_API)
      .then((res) => res.json())
      .then(setWorkers)
      .catch(console.error);
  }, []);

  // Обробка створення замовлення
  const handleAddJob = (e) => {
    e.preventDefault();
    setLoading(true);
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
      .then(() => {
        // Очищаємо форму
        setAddress("");
        setDate(new Date().toISOString().slice(0, 10));
        setSf("");
        setRate("");
        setClient("");
        setNotes("");
        setSelectedWorkers([]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const workerOptions = workers.map((w) => ({
    value: w.id,
    label: w.name,
  }));

  return (
    <div className={styles.homePage}>
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
        <input
          type="number"
          placeholder="Square Footage"
          value={sf}
          onChange={(e) => setSf(e.target.value)}
          required
          className={styles.formInput}
        />
        <input
          type="number"
          placeholder="Rate"
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
          className={styles.formInput}
        />
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={styles.formTextarea}
        />
        <Select
          isMulti
          options={workerOptions}
          value={workerOptions.filter((opt) =>
            selectedWorkers.includes(opt.value)
          )}
          onChange={(selected) =>
            setSelectedWorkers(selected ? selected.map((s) => s.value) : [])
          }
          className={styles.formSelect}
          classNamePrefix="react-select"
          placeholder="Select workers..."
        />
        <button type="submit" className={styles.formButton}>
          {loading ? "Adding…" : "Add Job"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
