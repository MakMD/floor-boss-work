import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink, Outlet } from "react-router-dom";
import styles from "./JobDetails.module.css";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch job details
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => setJob(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!job) return <p>Job not found.</p>;

  return (
    <div className={styles.jobDetails}>
      <div className={styles.actionButtons}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          &larr; Back
        </button>
        <button
          className={styles.logoutButton}
          onClick={() => navigate("/", { replace: true })}
        >
          Logout
        </button>
      </div>
      <div className={styles.header}>
        <h1 className={styles.title}>Order #{id}</h1>
      </div>
      <div className={styles.tabs}>
        {["", "invoices", "materials", "photos-after", "company-invoices"].map(
          (path) => {
            const label = {
              "": "Photos",
              invoices: "Invoices",
              materials: "Materials",
              "photos-after": "After Photos",
              "company-invoices": "Company Invoices",
            }[path];
            return (
              <NavLink
                key={path}
                to={path}
                end={path === ""}
                className={({ isActive }) =>
                  isActive
                    ? `${styles.tabButton} ${styles.tabButtonActive}`
                    : styles.tabButton
                }
              >
                {label}
              </NavLink>
            );
          }
        )}
      </div>

      {/* Nested route outlet renders the selected tab component */}
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
