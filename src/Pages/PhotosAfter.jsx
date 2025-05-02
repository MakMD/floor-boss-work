import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "./PhotosAfter.module.css";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function PhotosAfter() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/${id}`)
      .then((res) => res.json())
      .then((data) => setJob(data))
      .catch((e) => console.error(e));
  }, [id]);

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
