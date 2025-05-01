// src/Pages/Materials.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Materials.module.css";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";

export default function Materials() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch job to get existing materials
  useEffect(() => {
    fetch(`${API_URL}/${id}`)
      .then((res) => res.json())
      .then(setJob)
      .catch((err) => setError(err.message));
  }, [id]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    try {
      setLoading(true);
      // simulate upload: convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const url = reader.result;
        const newMat = { id: Date.now().toString(), name: file.name, url };
        const updated = {
          ...job,
          materials: [...(job.materials || []), newMat],
        };
        await fetch(`${API_URL}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        setJob(updated);
        setFile(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!job) return <p>Loading materials...</p>;

  return (
    <div className={styles.materialsPage}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        &larr; Back
      </button>
      <h2 className={styles.title}>Materials for Order #{id}</h2>

      <form onSubmit={handleUpload} className={styles.uploadForm}>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        <button type="submit" className={styles.uploadButton}>
          {loading ? "Uploading..." : "Upload Material"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      <ul className={styles.materialList}>
        {job.materials?.map((mat) => (
          <li key={mat.id} className={styles.materialItem}>
            <a href={mat.url} target="_blank" rel="noopener noreferrer">
              {mat.name}
            </a>
          </li>
        ))}
        {!job.materials?.length && <p>No materials uploaded yet.</p>}
      </ul>
    </div>
  );
}
