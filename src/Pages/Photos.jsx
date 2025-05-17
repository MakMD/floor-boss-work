// src/Pages/Photos.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./Photos.module.css";

export default function Photos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addActivity, user } = useContext(AppContext);

  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState(""); // новий стейт для підпису
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalUrl, setModalUrl] = useState(null);

  // Fetch photos, newest first, включаючи caption
  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("photos")
      .select("id, url, created_at, caption")
      .eq("job_id", id)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setPhotos([]);
    } else {
      setPhotos(data);
    }
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

      // upload to 'work' bucket
      const { error: upErr } = await supabase.storage
        .from("work")
        .upload(path, file);
      if (upErr) throw upErr;

      // get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("work").getPublicUrl(path);

      // insert record with optional caption
      const { error: insErr } = await supabase
        .from("photos")
        .insert([{ job_id: id, url: publicUrl, caption: caption || null }]);
      if (insErr) throw insErr;

      addActivity(
        `User ${user?.name || user?.id} uploaded photo for order #${id}` +
          (caption ? ` with caption "${caption}"` : "")
      );

      // reset form
      setFile(null);
      setCaption("");
      setPreview(null);

      // refresh list
      await fetchPhotos();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (url) => setModalUrl(url);
  const closeModal = () => setModalUrl(null);

  return (
    <div className={styles.photosPage}>
      {/* <button onClick={() => navigate(-1)} className={styles.backButton}>
        ← Back
      </button> */}
      <h2 className={styles.title}>Photos for Order #{id}</h2>

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

        {/* Поле для необов’язкового підпису */}
        <textarea
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className={styles.captionInput}
        />

        <button
          type="submit"
          disabled={loading}
          className={styles.uploadButton}
        >
          {loading ? "Uploading…" : "Upload Photo"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.loading}>Loading photos…</p>
      ) : photos.length > 0 ? (
        <ul className={styles.photoList}>
          {photos.map((p) => (
            <li key={p.id} className={styles.photoItem}>
              <img
                src={p.url}
                alt={p.caption || "Job"}
                className={styles.thumb}
                onClick={() => openModal(p.url)}
              />
              {p.caption && <p className={styles.photoCaption}>{p.caption}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noResults}>No photos uploaded yet.</p>
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
            <img src={modalUrl} alt="Enlarged" className={styles.modalImg} />
          </div>
        </div>
      )}
    </div>
  );
}
