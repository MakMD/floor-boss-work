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
            // витягуємо номер замовлення із повідомлення
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
    </div>
  );
}
