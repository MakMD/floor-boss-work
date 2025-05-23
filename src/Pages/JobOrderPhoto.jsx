// src/Pages/JobOrderPhoto.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase"; //
import styles from "./JobOrderPhoto.module.css"; // Створимо цей файл стилів нижче
import { AppContext } from "../components/App/App"; //

export default function JobOrderPhoto() {
  const { id: jobId } = useParams();
  const { user } = useContext(AppContext); //
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobOrderPhoto = async () => {
      if (!jobId) return;
      setLoading(true);
      setError(null);
      try {
        const { data: jobData, error: jobError } = await supabase
          .from("jobs")
          .select("job_order_photo_url")
          .eq("id", jobId)
          .single();

        if (jobError) throw jobError;

        if (jobData && jobData.job_order_photo_url) {
          setPhotoUrl(jobData.job_order_photo_url);
        } else {
          setPhotoUrl(null); // Або якесь повідомлення "Фото не завантажено"
        }
      } catch (err) {
        console.error("Error fetching job order photo:", err);
        setError(err.message);
        setPhotoUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJobOrderPhoto();
  }, [jobId]);

  // Ця вкладка доступна лише адміну, тому додаткова перевірка ролі тут може бути зайвою,
  // якщо маршрутизація вже це контролює. Але для надійності можна додати.
  if (user?.role !== "admin") {
    return (
      <p className={styles.error}>
        Access Denied. This section is for admins only.
      </p>
    );
  }

  if (loading)
    return <p className={styles.loading}>Loading job order photo...</p>;
  if (error) return <p className={styles.error}>Error: {error}</p>;

  return (
    <div className={styles.jobOrderPhotoPage}>
      <h2 className={styles.title}>Job Order Photo for Order #{jobId}</h2>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`Job Order Photo for Order #${jobId}`}
          className={styles.jobImage}
        />
      ) : (
        <p className={styles.noPhoto}>
          No job order photo has been uploaded for this order.
        </p>
      )}
    </div>
  );
}
