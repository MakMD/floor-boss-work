// src/Pages/PhotosAfter.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../components/App/App"; //
import { supabase } from "../lib/supabase"; //
import styles from "./PhotosAfter.module.css"; //

export default function PhotosAfter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addActivity, user } = useContext(AppContext); //

  const [photos, setPhotos] = useState([]);
  // Змінюємо file на files, оскільки тепер може бути кілька файлів
  const [files, setFiles] = useState([]); // Буде масивом File об'єктів
  const [caption, setCaption] = useState("");
  // Змінюємо preview на previews, оскільки може бути кілька прев'ю
  const [previews, setPreviews] = useState([]); // Буде масивом URL для прев'ю
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null); // Окремий стейт для помилок завантаження
  const [modalUrl, setModalUrl] = useState(null);

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null); // Скидаємо загальну помилку перед завантаженням
    const { data, error: fetchError } = await supabase
      .from("photos_after")
      .select("id, url, created_at, caption")
      .eq("job_id", id)
      .order("created_at", { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
      setPhotos([]);
    } else {
      setPhotos(data || []); // Переконуємося, що photos завжди масив
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, [id]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      const newPreviews = [];
      selectedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          // Оновлюємо прев'ю, коли всі файли прочитані
          if (newPreviews.length === selectedFiles.length) {
            setPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      setFiles([]);
      setPreviews([]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setUploadError("Please select files to upload."); //
      return;
    }
    setLoading(true);
    setUploadError(null); // Скидаємо помилку завантаження
    setError(null); // Скидаємо загальну помилку

    // Створюємо масив промісів для завантаження кожного файлу
    const uploadPromises = files.map(async (fileToUpload) => {
      const ext = fileToUpload.name.split(".").pop();
      const name = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${ext}`; // Додано унікальності
      const path = `job_${id}/${name}`; //

      const { error: upErr } = await supabase.storage
        .from("afterwork") //
        .upload(path, fileToUpload);
      if (upErr) {
        // Якщо помилка, кидаємо її, щоб Promise.all міг її зловити
        throw new Error(
          `Failed to upload ${fileToUpload.name}: ${upErr.message}`
        );
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("afterwork").getPublicUrl(path); //
      return { publicUrl, originalName: fileToUpload.name };
    });

    try {
      // Чекаємо завершення всіх завантажень
      const uploadedFileResults = await Promise.all(uploadPromises);

      // Створюємо записи в базі даних для кожного завантаженого файлу
      const insertData = uploadedFileResults.map((result) => ({
        job_id: id,
        url: result.publicUrl,
        caption: caption || null, // Використовуємо спільний підпис для всіх фото в цій "пачці"
      }));

      if (insertData.length > 0) {
        const { error: insErr } = await supabase
          .from("photos_after") //
          .insert(insertData);
        if (insErr) throw insErr; //
      }

      addActivity(
        `User ${user?.name || user?.id} uploaded ${
          uploadedFileResults.length
        } after-photo(s) for order #${id}` + //
          (caption ? ` with caption "${caption}"` : "")
      );

      setFiles([]);
      setCaption("");
      setPreviews([]);
      e.target.reset(); // Очищаємо інпут файлу
      await fetchPhotos(); // Оновлюємо список фото
    } catch (err) {
      console.error("Upload or insert error:", err);
      // Встановлюємо помилку завантаження, якщо вона сталася під час Promise.all або insert
      setUploadError(err.message || "An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (url) => setModalUrl(url);
  const closeModal = () => setModalUrl(null);

  return (
    <div className={styles.photosAfterPage}>
      {/* Кнопку Back прибрано, оскільки вона вже є в JobDetails.jsx */}
      {/* <button onClick={() => navigate(-1)} className={styles.backButton}>
        ← Back
      </button> */}
      <h2 className={styles.title}>After Photos for Order #{id}</h2>
      <form onSubmit={handleUpload} className={styles.uploadForm}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
          multiple // Дозволяємо вибір кількох файлів
        />

        {previews.length > 0 && (
          <div className={styles.previewContainerMultiple}>
            {" "}
            {/* Можливо, потрібен новий стиль для кількох прев'ю */}
            {previews.map((previewUrl, index) => (
              <img
                key={index}
                src={previewUrl}
                alt={`Preview ${index + 1}`}
                className={styles.previewImg} //
              />
            ))}
          </div>
        )}

        <textarea
          placeholder="Caption for all uploaded photos (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className={styles.captionInput} //
        />

        <button
          type="submit"
          disabled={loading || files.length === 0} // Деактивуємо, якщо файли не вибрані
          className={styles.uploadButton} //
        >
          {loading
            ? `Uploading ${files.length} photo(s)…`
            : `Upload ${files.length > 0 ? files.length : ""} After Photo(s)`}
        </button>
      </form>
      {uploadError && <p className={styles.error}>{uploadError}</p>}{" "}
      {/* Відображення помилки завантаження */}
      {error && !uploadError && <p className={styles.error}>{error}</p>}{" "}
      {/* Відображення загальної помилки, якщо немає помилки завантаження */}
      {loading && photos.length === 0 ? ( // Показуємо завантаження, тільки якщо фото ще не завантажені
        <p className={styles.loading}>Loading after-photos…</p>
      ) : !loading && photos.length === 0 && !error ? ( // Додано перевірку на !error
        <p className={styles.noResults}>No after-photos uploaded yet.</p> //
      ) : (
        <ul className={styles.photoList}>
          {photos.map((p) => (
            <li key={p.id} className={styles.photoItem}>
              <img
                src={p.url}
                alt={p.caption || "After Job"}
                className={styles.thumb} //
                onClick={() => openModal(p.url)}
              />
              {p.caption && <p className={styles.photoCaption}>{p.caption}</p>}
            </li>
          ))}
        </ul>
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
              className={styles.modalImg} //
            />
          </div>
        </div>
      )}
    </div>
  );
}
