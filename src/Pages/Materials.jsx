// src/Pages/Materials.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Materials.module.css";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dklxyxftr/upload";
const UPLOAD_PRESET = "floorboss_unsigned";

export default function Materials() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Завантажуємо поточний job
  useEffect(() => {
    fetch(`${API_URL}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then(setJob)
      .catch((e) => setError(e.message));
  }, [id]);

  // Обробник вибору файлу з прев’ю
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

  // Сабміт форми: спочатку завантажуємо фото на Cloudinary, потім оновлюємо job.materials :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let fileUrl = null,
        fileName = null;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        formData.append("folder", "Materials"); // <-- тут
        const resp = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        });
        if (!resp.ok) {
          const errData = await resp.json();
          throw new Error(errData.error?.message || "Upload failed");
        }
        const data = await resp.json();
        fileUrl = data.secure_url;
        fileName = file.name;
      }
      // далі — оновлення job.materials, як раніше
      const newMat = {
        id: Date.now().toString(),
        name: fileName || `Note ${new Date().toLocaleString()}`,
        url: fileUrl,
        description: text.trim(),
      };
      const updatedJob = {
        ...job,
        materials: [...(job.materials || []), newMat],
      };
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedJob),
      });
      if (!res.ok) throw new Error("Saving failed");
      setJob(updatedJob);
      setFile(null);
      setText("");
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!job) return <p>Loading materials…</p>;

  return (
    <div className={styles.materialsPage}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        &larr; Back
      </button>
      <h2 className={styles.title}>Materials for Order #{id}</h2>

      <form onSubmit={handleSubmit} className={styles.uploadForm}>
        <textarea
          placeholder="Notes (optional)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={styles.textInput}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        {preview && (
          <img src={preview} alt="Preview" className={styles.preview} />
        )}
        <button
          type="submit"
          className={styles.uploadButton}
          disabled={loading}
        >
          {loading ? "Saving…" : "Add Material"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      <ul className={styles.materialList}>
        {job.materials?.length ? (
          job.materials.map((mat) => (
            <li key={mat.id} className={styles.materialItem}>
              {mat.url && (
                <a href={mat.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={mat.url}
                    alt={mat.name}
                    className={styles.materialImg}
                  />
                </a>
              )}
              {mat.description && (
                <p className={styles.description}>{mat.description}</p>
              )}
            </li>
          ))
        ) : (
          <p>No materials uploaded yet.</p>
        )}
      </ul>
    </div>
  );
}
