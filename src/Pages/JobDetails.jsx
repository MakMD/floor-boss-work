import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./JobDetails.module.css";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("photos");

  const handleLogout = () => {
    // TODO: clear auth
    navigate("/", { replace: true });
  };

  return (
    <div className={styles.jobDetails}>
      <div className={styles.actionButtons}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          &#8592; Back
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
        {activeTab === "photos" && (
          <div>
            {/* TODO: Render photo gallery */}
            <p>No photos uploaded yet.</p>
          </div>
        )}
        {activeTab === "invoices" && (
          <div>
            {/* TODO: Invoice form or list */}
            <p>No invoices added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
