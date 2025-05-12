// src/Pages/Invoices.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { AppContext } from "../components/App/App";
import styles from "./Invoices.module.css";

export default function Invoices() {
  const { id: jobId } = useParams();
  const { user } = useContext(AppContext);

  const [invoices, setInvoices] = useState([]);
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Завантаження рахунків
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_date, amount")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });
      if (error) {
        setError(error.message);
        setInvoices([]);
      } else {
        setInvoices(data);
      }
      setLoading(false);
    })();
  }, [jobId]);

  // Додавання нового рахунку
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!date || !amount) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("invoices")
      .insert([{ job_id: jobId, invoice_date: date, amount: Number(amount) }])
      .single();

    if (error) {
      setError(error.message);
    } else {
      setInvoices((prev) => [...prev, data]);
      setDate("");
      setAmount("");
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Invoices for Order #{jobId}</h2>

      <form onSubmit={handleAdd} className={styles.form}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className={styles.input}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className={styles.input}
        />
        <button type="submit" className={styles.addButton} disabled={loading}>
          {loading ? "Adding…" : "Add Invoice"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.loading}>Loading invoices...</p>
      ) : invoices.length > 0 ? (
        <ul className={styles.list}>
          {invoices.map((inv) => (
            <li key={inv.id} className={styles.item}>
              <span className={styles.date}>
                {new Date(inv.invoice_date).toLocaleDateString()}
              </span>
              <span className={styles.amount}>${inv.amount.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noResults}>No invoices yet.</p>
      )}
    </div>
  );
}
