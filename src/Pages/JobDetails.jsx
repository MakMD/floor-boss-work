import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink, Outlet } from "react-router-dom";
import styles from "./JobDetails.module.css";

const JOBS_API = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${JOBS_API}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => setJob(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!job) return <p className={styles.error}>Job not found.</p>;

  const tabs = [
    { path: "", label: "Photos" },
    { path: "workers", label: "Workers" },
    { path: "invoices", label: "Invoices" },
    { path: "materials", label: "Materials" },
    { path: "photos-after", label: "After Photos" },
    { path: "company-invoices", label: "Company Invoices" },
  ];

  return (
    <div className={styles.jobDetails}>
      <div className={styles.btnContainer}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <button className={styles.logoutBtn} onClick={() => navigate("/")}>
          Logout
        </button>
      </div>
      <h1 className={styles.title}>Order #{job.id}</h1>
      <div className={styles.tabs}>
        {tabs.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === ""}
            className={({ isActive }) =>
              isActive ? styles.activeTab : styles.tab
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
