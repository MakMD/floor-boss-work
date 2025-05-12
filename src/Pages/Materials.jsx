// src/Pages/Materials.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import styles from "./Materials.module.css";

export default function Materials() {
  const { id } = useParams();

  const [materials, setMaterials] = useState([]);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(1);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalUrl, setModalUrl] = useState(null);

  // 1. Function to fetch materials from Supabase
  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("materials")
      .select("id, url, description, amount, created_at")
      .eq("job_id", id)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setMaterials(data || []);
    setLoading(false);
  };

  // 2. Load materials on mount and when job id changes
  useEffect(() => {
    fetchMaterials();
  }, [id]);

  // File preview handler
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

  // Upload handler: after upload, re-fetch materials
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file && !description.trim()) return;
    setLoading(true);
    setError(null);

    try {
      let publicUrl = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const name = `${Date.now()}.${ext}`;
        const path = `job_${id}/${name}`;
        const { error: upErr } = await supabase.storage
          .from("material")
          .upload(path, file);
        if (upErr) throw upErr;
        const {
          data: { publicUrl: url },
        } = supabase.storage.from("material").getPublicUrl(path);
        publicUrl = url;
      }

      const { error: insErr } = await supabase.from("materials").insert([
        {
          job_id: id,
          url: publicUrl,
          description: description.trim(),
          amount: Number(amount),
        },
      ]);
      if (insErr) throw insErr;

      // Re-fetch materials to immediately show new entry
      await fetchMaterials();

      // Reset form inputs
      setFile(null);
      setDescription("");
      setAmount(1);
      setPreview(null);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const openModal = (url) => setModalUrl(url);
  const closeModal = () => setModalUrl(null);

  return (
    <div className={styles.materialsPage}>
      <h2 className={styles.title}>Materials for Order #{id}</h2>
      <form onSubmit={handleUpload} className={styles.uploadForm}>
        <label className={styles.label}>
          Amount:
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.amountInput}
            required
          />
        </label>
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textInput}
        />
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
          {loading ? "Saving…" : "Add Material"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.loading}>Loading materials…</p>
      ) : materials.length > 0 ? (
        <ul className={styles.materialList}>
          {materials.map((m) => (
            <li key={m.id} className={styles.materialItem}>
              {m.url && (
                <img
                  src={m.url}
                  alt={m.description || "Material"}
                  className={styles.thumb}
                  onClick={() => openModal(m.url)}
                />
              )}
              <div className={styles.materialInfo}>
                <span className={styles.materialAmount}>Qty: {m.amount}</span>
                {m.description && (
                  <p className={styles.description}>{m.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noResults}>No materials added yet.</p>
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
            <img src={modalUrl} alt="Material" className={styles.modalImg} />
          </div>
        </div>
      )}
    </div>
  );
}
