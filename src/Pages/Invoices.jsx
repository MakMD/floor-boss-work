// src/Pages/Invoices.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import styles from "./Invoices.module.css";
// AppContext тут може бути не потрібний, якщо ми не використовуємо user або addActivity
// import { AppContext } from "../components/App/App";

export default function Invoices() {
  const { id: jobId } = useParams();
  // const { user } = useContext(AppContext); // Можливо, не потрібен

  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [error, setError] = useState(null);

  // Завантаження існуючих рахунків
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!jobId) return;
      setLoadingInvoices(true);
      setError(null); // Скидаємо помилку перед завантаженням
      try {
        const { data, error: fetchError } = await supabase
          .from("invoices")
          .select("id, invoice_date, amount")
          .eq("job_id", jobId)
          .order("created_at", { ascending: true });

        if (fetchError) {
          throw fetchError;
        }
        setInvoices(data || []);
      } catch (e) {
        setError(`Failed to load invoices: ${e.message}`);
        setInvoices([]);
      }
      setLoadingInvoices(false);
    };
    fetchInvoices();
  }, [jobId]);

  if (loadingInvoices) {
    return <p className={styles.loading}>Loading invoices...</p>;
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Invoices for Order #{jobId}</h2>

      {error && <p className={styles.error}>{error}</p>}

      {invoices.length > 0 ? (
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
        !error && (
          <p className={styles.noResults}>No invoices found for this job.</p>
        )
      )}
    </div>
  );
}
