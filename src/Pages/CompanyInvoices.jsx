// src/Pages/CompanyInvoices.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./CompanyInvoices.module.css";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function CompanyInvoices() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [companyAmount, setCompanyAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load job to get existing company invoices
  useEffect(() => {
    fetch(`${API_URL}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => setJob(data))
      .catch((e) => setError(e.message));
  }, [id]);

  const handleAddCompanyInvoice = async (e) => {
    e.preventDefault();
    const newInv = {
      id: Date.now().toString(),
      date: invoiceDate,
      amount: parseFloat(companyAmount),
    };
    const updated = {
      ...job,
      companyInvoices: [...(job.companyInvoices || []), newInv],
    };
    setLoading(true);
    try {
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setJob(updated);
      setCompanyAmount("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!job) return <p>Loading company invoices...</p>;

  return (
    <div className={styles.page}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        &larr; Back
      </button>
      <h2 className={styles.title}>Company Invoices — Order #{id}</h2>

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
        <button type="submit" className={styles.addButton}>
          {loading ? "Adding..." : "Add Invoice"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      <ul className={styles.list}>
        {(job.companyInvoices || []).map((inv) => (
          <li key={inv.id} className={styles.item}>
            <span className={styles.date}>{inv.date}</span>
            <span className={styles.amount}>${inv.amount.toFixed(2)}</span>
          </li>
        ))}
        {!job.companyInvoices?.length && <p>No company invoices yet.</p>}
      </ul>
    </div>
  );
}
