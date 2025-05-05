import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "./PhotosAfter.module.css";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dklxyxftr/upload";
const UPLOAD_PRESET = "floorboss_unsigned";

export default function PhotosAfter() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/${id}`)
      .then((res) => res.json())
      .then((data) => setJob(data))
      .catch((e) => setError(e.message));
  }, [id]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "after_work_photos");

      const resp = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error?.message || "Upload failed");
      }
      const data = await resp.json();
      const newPhoto = { id: data.public_id, url: data.secure_url };

      const updated = {
        ...job,
        photos_after_work: [...(job.photos_after_work || []), newPhoto],
      };
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setJob(updated);
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!job) return <p>Loading...</p>;

  const photos = job.photos_after_work || [];
  const openModal = (idx) => {
    setCurrentIndex(idx);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const showPrev = () =>
    setCurrentIndex((currentIndex + photos.length - 1) % photos.length);
  const showNext = () => setCurrentIndex((currentIndex + 1) % photos.length);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>After Work Photos</h2>
      <form onSubmit={handleUpload} className={styles.form}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.input}
        />
        {preview && (
          <img src={preview} alt="Preview" className={styles.preview} />
        )}
        <button
          type="submit"
          className={styles.uploadButton}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload After Photo"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      {photos.length ? (
        <div className={styles.gallery}>
          {photos.map((p, idx) => (
            <img
              key={p.id}
              src={p.url}
              alt="After work"
              className={styles.photoItem}
              onClick={() => openModal(idx)}
            />
          ))}
        </div>
      ) : (
        <p>No after-work photos available.</p>
      )}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.closeButton} onClick={closeModal}>
              &times;
            </button>
            <img
              src={photos[currentIndex].url}
              alt="Large view"
              className={styles.modalImage}
            />
            <button className={styles.navButtonLeft} onClick={showPrev}>
              &#10094;
            </button>
            <button className={styles.navButtonRight} onClick={showNext}>
              &#10095;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
