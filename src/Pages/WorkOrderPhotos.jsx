// src/Pages/WorkOrderPhotos.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./WorkOrderPhotos.module.css";

export default function WorkOrderPhotos() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { user, addActivity } = useContext(AppContext);

  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Завантажуємо існуючі фото
  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("order_photos")
      .select("id, url, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setPhotos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, [jobId]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      // 1) Завантажуємо файл у Storage
      const ext = file.name.split(".").pop();
      const name = `${Date.now()}.${ext}`;
      const path = `order_${jobId}/${name}`;
      let { error: upErr } = await supabase.storage
        .from("workorder-photos")
        .upload(path, file);
      if (upErr) throw upErr;

      // 2) Отримуємо публічний URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("workorder-photos").getPublicUrl(path);

      // 3) Записуємо в таблицю
      const { error: insErr } = await supabase
        .from("order_photos")
        .insert([{ job_id: jobId, url: publicUrl }]);
      if (insErr) throw insErr;

      addActivity(
        `Admin ${
          user?.name || user.id
        } uploaded work-order photo for order #${jobId}`
      );
      setFile(null);
      await fetchPhotos();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h2 className={styles.title}>Work Order Photos — Order #{jobId}</h2>

      <form onSubmit={handleUpload} className={styles.form}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        <button type="submit" className={styles.uploadBtn} disabled={loading}>
          {loading ? "Uploading…" : "Upload Photo"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.gallery}>
        {photos.map((p) => (
          <img
            key={p.id}
            src={p.url}
            alt={`Work order ${jobId}`}
            className={styles.thumb}
          />
        ))}
        {photos.length === 0 && !loading && (
          <p className={styles.empty}>No photos yet.</p>
        )}
      </div>
    </div>
  );
}
