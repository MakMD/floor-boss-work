// src/Pages/JobDetails.jsx
import React, { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import styles from "./JobDetails.module.css";

const JOBS_API = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";
const WORKERS_API = "https://680eea7067c5abddd1934af2.mockapi.io/workers";

function WorkersTab({ workerIds }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Array.isArray(workerIds) || workerIds.length === 0) {
      setWorkers([]);
      setLoading(false);
      return;
    }
    fetch(WORKERS_API)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => {
        setWorkers(data.filter((w) => workerIds.includes(w.id)));
      })
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, [workerIds]);

  if (loading) return <p>Loading workers…</p>;
  if (workers.length === 0) return <p>No workers assigned.</p>;

  return (
    <ul className={styles.workersList}>
      {workers.map((w) => (
        <li key={w.id} className={styles.workerItem}>
          {w.name}
        </li>
      ))}
    </ul>
  );
}

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Завантаження деталей замовлення
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!job) return <p>Job not found.</p>;

  // Визначаємо активну вкладку
  const pathSegments = location.pathname.split("/");
  let currentTab = pathSegments[pathSegments.length - 1];
  // Якщо останній сегмент – це id (тобто базова сторінка), виводимо Photos
  if (currentTab === id) currentTab = "";

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
      <div className={styles.actionButtons}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/home", { replace: true })}
        >
          &larr; Back
        </button>
        <button
          className={styles.logoutButton}
          onClick={() => navigate("/", { replace: true })}
        >
          Logout
        </button>
      </div>

      <h1 className={styles.title}>Order #{id}</h1>

      <div className={styles.tabs}>
        {tabs.map(({ path, label }) => (
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
        ))}
      </div>

      <div className={styles.content}>
        {currentTab === "workers" ? (
          <WorkersTab workerIds={job.workerIds || []} />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}
