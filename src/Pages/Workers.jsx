import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Workers.module.css";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/workers";

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => setWorkers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Workers</h2>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className={styles.list}>
          {workers.length > 0 ? (
            workers.map((worker) => (
              <li key={worker.id} className={styles.item}>
                <Link to={`/workers/${worker.id}`} className={styles.link}>
                  <div className={styles.workerName}>{worker.name}</div>
                  <div className={styles.workerRole}>{worker.role}</div>
                </Link>
              </li>
            ))
          ) : (
            <p>No workers found.</p>
          )}
        </ul>
      )}
    </div>
  );
}
