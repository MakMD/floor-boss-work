import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "./Photos.module.css";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dklxyxftr/upload";
const UPLOAD_PRESET = "floorboss_unsigned";

export default function Photos() {
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

      const updated = { ...job, photos: [...(job.photos || []), newPhoto] };
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

  const openModal = (idx) => {
    setCurrentIndex(idx);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const showPrev = () =>
    setCurrentIndex((currentIndex + job.photos.length - 1) % job.photos.length);
  const showNext = () =>
    setCurrentIndex((currentIndex + 1) % job.photos.length);

  if (!job) return <p>Loading photos...</p>;

  return (
    <div className={styles.page}>
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
          {loading ? "Uploading..." : "Upload Photo"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.gallery}>
        {job.photos?.length ? (
          job.photos.map((p, idx) => (
            <img
              key={p.id}
              src={p.url}
              alt="Job"
              className={styles.photoItem}
              onClick={() => openModal(idx)}
            />
          ))
        ) : (
          <p>No photos uploaded yet.</p>
        )}
      </div>

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
              src={job.photos[currentIndex].url}
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
