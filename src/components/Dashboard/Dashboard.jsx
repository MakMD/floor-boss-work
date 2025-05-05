import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [jobsCount, setJobsCount] = useState(0);
  const [unpaidInvoices, setUnpaidInvoices] = useState(0);
  const [materialsStock, setMaterialsStock] = useState(0);
  const [photosCount, setPhotosCount] = useState(0);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const [jobsRes, invRes, matRes, photosRes] = await Promise.all([
          axios.get("https://680eea7067c5abddd1934af2.mockapi.io/jobs"),
          axios.get("https://680eea7067c5abddd1934af2.mockapi.io/invoices"),
          axios.get("https://680eea7067c5abddd1934af2.mockapi.io/materials"),
          axios.get("https://680eea7067c5abddd1934af2.mockapi.io/photos"),
        ]);

        // заплановані роботи — просто довжина масиву
        setJobsCount(jobsRes.data.length);
        // неоплачені інвойси — фільтруємо по paid=false
        setUnpaidInvoices(invRes.data.filter((inv) => !inv.paid).length);
        // рівень запасів матеріалів — сумуємо властивість quantity
        const totalStock = matRes.data.reduce(
          (sum, m) => sum + (m.quantity || 0),
          0
        );
        setMaterialsStock(totalStock);
        // статистика фото — загальна кількість записів
        setPhotosCount(photosRes.data.length);
      } catch (err) {
        console.error("Помилка завантаження метрик", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return <div className={styles.spinner}>Завантаження метрик...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <h2 className={styles.title}>Панель керування</h2>
      <div className={styles.cards}>
        <div className={styles.card}>
          <p className={styles.label}>Запланованих робіт</p>
          <p className={styles.value}>{jobsCount}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.label}>Неоплачених інвойсів</p>
          <p className={styles.value}>{unpaidInvoices}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.label}>Рівень запасів</p>
          <p className={styles.value}>{materialsStock}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.label}>Фотографій</p>
          <p className={styles.value}>{photosCount}</p>
        </div>
      </div>
    </div>
  );
}
