import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "./Photos.module.css";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function Photos() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    try {
      const newPhoto = { id: Date.now().toString(), url: preview };
      const updated = { ...job, photos: [...(job.photos || []), newPhoto] };
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setJob(updated);
      setFile(null);
      setPreview(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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
        <button type="submit" className={styles.uploadButton}>
          {loading ? "Uploading..." : "Upload Photo"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.gallery}>
        {(job.photos || []).map((p) => (
          <div key={p.id} className={styles.photoItem}>
            <img src={p.url} alt="Job" />
          </div>
        ))}
        {!job.photos?.length && <p>No photos uploaded yet.</p>}
      </div>
    </div>
  );
}
