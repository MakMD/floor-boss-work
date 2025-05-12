// src/Pages/PhotosAfter.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./PhotosAfter.module.css";

export default function PhotosAfter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addActivity, user } = useContext(AppContext);

  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalUrl, setModalUrl] = useState(null);

  // Fetch after-photos, newest first
  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("photos_after")
      .select("id, url, created_at")
      .eq("job_id", id)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setPhotos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, [id]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const ext = file.name.split(".").pop();
      const name = `${Date.now()}.${ext}`;
      const path = `job_${id}/${name}`;

      // upload to afterwork bucket
      const { error: upErr } = await supabase.storage
        .from("afterwork")
        .upload(path, file);
      if (upErr) throw upErr;

      // get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("afterwork").getPublicUrl(path);

      // insert record
      const { data: newPhoto, error: insErr } = await supabase
        .from("photos_after")
        .insert([{ job_id: id, url: publicUrl }])
        .single();
      if (insErr) throw insErr;

      // prepend to list
      setPhotos((prev) => [newPhoto, ...prev].filter(Boolean));
      addActivity(
        `User ${user?.name || user?.id} uploaded after-photo for order #${id}`
      );
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (url) => setModalUrl(url);
  const closeModal = () => setModalUrl(null);

  return (
    <div className={styles.photosAfterPage}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        ← Back
      </button>
      <h2 className={styles.title}>After Photos for Order #{id}</h2>

      <form onSubmit={handleUpload} className={styles.uploadForm}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        {preview && (
          <div className={styles.previewContainer}>
            <img src={preview} alt="Preview" className={styles.previewImg} />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className={styles.uploadButton}
        >
          {loading ? "Uploading…" : "Upload After Photo"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.loading}>Loading after-photos…</p>
      ) : photos.length > 0 ? (
        <ul className={styles.photoList}>
          {photos.map((p) => (
            <li key={p.id} className={styles.photoItem}>
              <img
                src={p.url}
                alt="After Job"
                className={styles.thumb}
                onClick={() => openModal(p.url)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noResults}>No after-photos uploaded yet.</p>
      )}

      {modalUrl && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.closeBtn} onClick={closeModal}>
              &times;
            </button>
            <img
              src={modalUrl}
              alt="After Job Enlarged"
              className={styles.modalImg}
            />
          </div>
        </div>
      )}
    </div>
  );
}
