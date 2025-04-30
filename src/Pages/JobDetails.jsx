import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./JobDetails.module.css";

const JOBS_API = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("photos");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invDate, setInvDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [amount, setAmount] = useState("");

  const handleLogout = () => navigate("/", { replace: true });

  // Fetch job details (including nested invoices)
  const fetchJob = () => {
    setLoading(true);
    fetch(`${JOBS_API}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((job) => {
        setInvoices(job.invoices || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === "invoices") fetchJob();
  }, [activeTab, id]);

  const handleAddInvoice = (e) => {
    e.preventDefault();
    const newInv = {
      id: Date.now().toString(),
      date: invDate,
      amount: parseFloat(amount),
    };
    // Update locally
    setInvoices((prev) => [...prev, newInv]);
    // Persist to backend
    fetch(`${JOBS_API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoices: [...invoices, newInv] }),
    }).catch((err) => setError(err.message));
  };

  return (
    <div className={styles.jobDetails}>
      <div className={styles.actionButtons}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          &larr; Back
        </button>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className={styles.header}>
        <div className={styles.title}>Job Details — ID {id}</div>
      </div>

      <div className={styles.tabs}>
        <div
          className={`${styles.tabButton} ${
            activeTab === "photos" ? styles.tabButtonActive : ""
          }`}
          onClick={() => setActiveTab("photos")}
        >
          Photos
        </div>
        <div
          className={`${styles.tabButton} ${
            activeTab === "invoices" ? styles.tabButtonActive : ""
          }`}
          onClick={() => setActiveTab("invoices")}
        >
          Invoices
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === "photos" && <p>No photos uploaded yet.</p>}

        {activeTab === "invoices" && (
          <>
            <form className={styles.addInvoiceForm} onSubmit={handleAddInvoice}>
              <input
                type="date"
                value={invDate}
                onChange={(e) => setInvDate(e.target.value)}
                required
                className={styles.dateInput}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className={styles.invoiceAmountInput}
              />
              <button type="submit" className={styles.logoutButton}>
                Add Invoice
              </button>
            </form>

            {loading && <p>Loading invoices...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && (
              <ul className={styles.invoiceList}>
                {invoices.length ? (
                  invoices.map((inv) => (
                    <li key={inv.id} className={styles.invoiceItem}>
                      <div className={styles.invoiceInfo}>
                        <span className={styles.invoiceId}>
                          Invoice #{inv.id}
                        </span>
                        <span className={styles.invoiceDate}>{inv.date}</span>
                      </div>
                      <div className={styles.invoiceAmount}>${inv.amount}</div>
                    </li>
                  ))
                ) : (
                  <p>No invoices available for this job.</p>
                )}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
