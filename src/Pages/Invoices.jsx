// src/Pages/Invoices.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "./Invoices.module.css";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function Invoices() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/${id}`)
      .then((res) => res.json())
      .then((data) => setJob(data))
      .catch((e) => setError(e.message));
  }, [id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newInv = {
        id: Date.now().toString(),
        date,
        amount: parseFloat(amount),
      };
      const updated = { ...job, invoices: [...(job.invoices || []), newInv] };
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setJob(updated);
      setAmount("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!job) return <p>Loading invoices...</p>;

  return (
    <div className={styles.page}>
      <form onSubmit={handleAdd} className={styles.form}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles.input}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={styles.input}
          required
        />
        <button type="submit" className={styles.addButton}>
          {loading ? "Adding..." : "Add Invoice"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      <ul className={styles.list}>
        {(job.invoices || []).map((inv) => (
          <li key={inv.id} className={styles.item}>
            <span className={styles.date}>{inv.date}</span>
            <span className={styles.amount}>${inv.amount.toFixed(2)}</span>
          </li>
        ))}
        {!job.invoices?.length && <p>No invoices yet.</p>}
      </ul>
    </div>
  );
}
