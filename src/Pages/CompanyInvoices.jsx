// src/Pages/CompanyInvoices.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import styles from "./CompanyInvoices.module.css";

export default function CompanyInvoices() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [companyAmount, setCompanyAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Завантажуємо рахунки для цього замовлення
  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("company_invoices")
        .select("id, date, amount")
        .eq("job_id", jobId)
        .order("date", { ascending: false });
      if (error) throw error;
      setInvoices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [jobId]);

  // Додаємо новий рахунок
  const handleAddCompanyInvoice = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const amount = parseFloat(companyAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Сума повинна бути додатним числом");
      }
      const { error } = await supabase
        .from("company_invoices")
        .insert([{ job_id: jobId, date: invoiceDate, amount }]);
      if (error) throw error;
      setCompanyAmount("");
      setInvoiceDate(new Date().toISOString().slice(0, 10));
      await fetchInvoices();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h2 className={styles.title}>Company Invoices — Order #{jobId}</h2>

      <form onSubmit={handleAddCompanyInvoice} className={styles.form}>
        <input
          type="date"
          value={invoiceDate}
          onChange={(e) => setInvoiceDate(e.target.value)}
          className={styles.input}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={companyAmount}
          onChange={(e) => setCompanyAmount(e.target.value)}
          className={styles.input}
          required
        />
        <button type="submit" className={styles.addButton} disabled={loading}>
          {loading ? "Adding…" : "Add Invoice"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {loading && !invoices.length ? (
        <p className={styles.loading}>Loading invoices…</p>
      ) : null}

      <ul className={styles.list}>
        {invoices.length > 0
          ? invoices.map((inv) => (
              <li key={inv.id} className={styles.item}>
                <span className={styles.date}>{inv.date}</span>
                <span className={styles.amount}>${inv.amount.toFixed(2)}</span>
              </li>
            ))
          : !loading && (
              <li className={styles.empty}>No company invoices yet.</li>
            )}
      </ul>
    </div>
  );
}
