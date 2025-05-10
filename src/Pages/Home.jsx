// src/Pages/Home.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../components/App/App";
import styles from "./Home.module.css";

export default function Home() {
  const { activityLog } = useContext(AppContext);

  return (
    <div className={styles.homePage}>
      <h2 className={styles.title}>Latest Updates</h2>
      <ul className={styles.activityList}>
        {activityLog.length === 0 && (
          <li className={styles.empty}>No updates yet.</li>
        )}
        {activityLog
          .slice()
          .reverse()
          .map((item, index) => {
            const match = item.message.match(/#(\d+)/);
            const orderId = match ? match[1] : null;

            return (
              <li key={index} className={styles.activityItem}>
                <span className={styles.activityTime}>
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                {orderId ? (
                  <Link to={`/job/${orderId}`} className={styles.activityLink}>
                    {item.message}
                  </Link>
                ) : (
                  <span className={styles.activityText}>{item.message}</span>
                )}
              </li>
            );
          })}
      </ul>

      {/* ---- Нова секція контактів ---- */}
      <div className={styles.footer}>
        <h3 className={styles.footerTitle}>Contact Information</h3>
        <ul className={styles.contactList}>
          <li className={styles.contactItem}>
            <a href="tel:+14031234567" className={styles.contactLink}>
              📞 John Doe: +1 (403) 123-4567
            </a>
          </li>
          <li className={styles.contactItem}>
            <a href="tel:+14039876543" className={styles.contactLink}>
              📞 Jane Smith: +1 (403) 987-6543
            </a>
          </li>
        </ul>
        <p className={styles.address}>
          📍 1234 Floor Street, Calgary, AB T2X 1Y4
        </p>
      </div>
    </div>
  );
}
