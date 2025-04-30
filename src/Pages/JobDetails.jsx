import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./JobDetails.module.css";

// Cloudinary configuration via Vite env variables (fallback to defaults if undefined)
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dklxyxftr";
const UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "floorboss_unsigned";
const FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || "job_photos";

const API_URL = "https://680eea7067c5abddd1934af2.mockapi.io/jobs"; // use jobs resource for job objects  // use invoices resource for job objects

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("photos");
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Photo upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Invoice state
  const [invDate, setInvDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [amount, setAmount] = useState("");

  const handleLogout = () => navigate("/", { replace: true });

  // Fetch job with photos/invoices
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => setJob(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!photoFile) return;
    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", FOLDER);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");

      const newPhoto = { id: data.public_id, url: data.secure_url };
      const updated = { ...job, photos: [...(job.photos || []), newPhoto] };
      setJob(updated);
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    const newInv = {
      id: Date.now().toString(),
      date: invDate,
      amount: parseFloat(amount),
    };
    const updated = { ...job, invoices: [...(job.invoices || []), newInv] };
    setJob(updated);
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).catch((err) => setError(err.message));
    setAmount("");
  };

  if (loading || !job) return <p>Loading...</p>;

  return (
    <div className={styles.jobDetails}>
      <div className={styles.actionButtons}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          &larr; Back
        </button>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className={styles.header}>
        <div className={styles.title}>Job Details — ID {id}</div>
      </div>
      <div className={styles.tabs}>
        <div
          className={`${styles.tabButton} ${
            activeTab === "photos" ? styles.tabButtonActive : ""
          }`}
          onClick={() => setActiveTab("photos")}
        >
          Photos
        </div>
        <div
          className={`${styles.tabButton} ${
            activeTab === "invoices" ? styles.tabButtonActive : ""
          }`}
          onClick={() => setActiveTab("invoices")}
        >
          Invoices
        </div>
      </div>
      <div className={styles.content}>
        {activeTab === "photos" && (
          <>
            <form className={styles.addPhotoForm} onSubmit={handleAddPhoto}>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className={styles.photoPreview}
                />
              )}
              <button type="submit" className={styles.formButton}>
                Upload Photo
              </button>
            </form>
            <div className={styles.photoList}>
              {job.photos?.map((photo) => (
                <div key={photo.id} className={styles.photoItem}>
                  <img src={photo.url} alt="Job" />
                </div>
              ))}
            </div>
          </>
        )}
        {activeTab === "invoices" && (
          <>
            <form className={styles.addInvoiceForm} onSubmit={handleAddInvoice}>
              <input
                type="date"
                value={invDate}
                onChange={(e) => setInvDate(e.target.value)}
                className={styles.dateInput}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={styles.invoiceAmountInput}
                required
              />
              <button type="submit" className={styles.formButton}>
                Add Invoice
              </button>
            </form>
            <ul className={styles.invoiceList}>
              {job.invoices?.length ? (
                job.invoices.map((inv) => (
                  <li key={inv.id} className={styles.invoiceItem}>
                    <div className={styles.invoiceInfo}>
                      <span className={styles.invoiceId}>
                        Invoice #{inv.id}
                      </span>
                      <span className={styles.invoiceDate}>{inv.date}</span>
                    </div>
                    <div className={styles.invoiceAmount}>${inv.amount}</div>
                  </li>
                ))
              ) : (
                <p>No invoices available for this job.</p>
              )}
            </ul>
          </>
        )}
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
