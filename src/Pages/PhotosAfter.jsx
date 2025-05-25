// src/Pages/PhotosAfter.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./PhotosAfter.module.css";
import { useToast } from "@chakra-ui/react"; // <--- НОВИЙ ІМПОРТ

export default function PhotosAfter() {
  const { id: jobId } = useParams(); // jobId з URL
  const { addActivity, user } = useContext(AppContext);
  const toast = useToast();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploadCaption, setUploadCaption] = useState(""); // Підпис для нових фото при завантаженні
  const [previews, setPreviews] = useState([]);

  const [pageLoading, setPageLoading] = useState(true); // Завантаження списку фото
  const [uploadLoading, setUploadLoading] = useState(false); // Процес завантаження нових фото
  const [actionLoading, setActionLoading] = useState(false); // Процес оновлення підпису

  const [error, setError] = useState(null); // Загальна помилка для сторінки
  const [uploadError, setUploadError] = useState(null);

  const [modalUrl, setModalUrl] = useState(null);

  // Стани для редагування підписів існуючих фото
  const [editingPhotoId, setEditingPhotoId] = useState(null); // ID фото, що редагується
  const [currentCaptionEdit, setCurrentCaptionEdit] = useState(""); // Текст підпису, що редагується

  const fetchPhotos = useCallback(async () => {
    setPageLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("photos_after")
        .select("id, url, created_at, caption")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setPhotos(data || []);
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error Loading Photos",
        description: err.message,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
      setPhotos([]);
    } finally {
      setPageLoading(false);
    }
  }, [jobId, toast]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      const newPreviews = selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviews(newPreviews);
    } else {
      setFiles([]);
      setPreviews([]);
    }
  };

  useEffect(() => {
    // Очищення Object URLs для прев'ю, коли компонент розмонтовується або файли змінюються
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setUploadError("Please select files to upload.");
      toast({
        title: "No Files Selected",
        description: "Please select files to upload.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }
    setUploadLoading(true);
    setUploadError(null);
    setError(null);

    const uploadPromises = files.map(async (fileToUpload) => {
      const ext = fileToUpload.name.split(".").pop();
      const name = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${ext}`;
      const path = `job_${jobId}/${name}`;

      const { error: upErr } = await supabase.storage
        .from("afterwork")
        .upload(path, fileToUpload);
      if (upErr) {
        throw new Error(
          `Failed to upload ${fileToUpload.name}: ${upErr.message}`
        );
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("afterwork").getPublicUrl(path);
      return { publicUrl, originalName: fileToUpload.name };
    });

    try {
      const uploadedFileResults = await Promise.all(uploadPromises);
      const insertData = uploadedFileResults.map((result) => ({
        job_id: jobId,
        url: result.publicUrl,
        caption: uploadCaption || null,
      }));

      if (insertData.length > 0) {
        const { error: insErr } = await supabase
          .from("photos_after")
          .insert(insertData);
        if (insErr) throw insErr;
      }

      const activityMessage =
        `User ${user?.name || user?.id || "System"} uploaded ${
          uploadedFileResults.length
        } after-photo(s) for order #${jobId}` +
        (uploadCaption ? ` with caption "${uploadCaption}"` : "");

      // Оновлюємо функцію addActivity відповідно до нового формату
      // Якщо ви не реалізували збереження логів в БД, цей виклик може не працювати як очікується
      // і його потрібно буде адаптувати або тимчасово закоментувати.
      // Для поточного завдання я припускаю, що addActivity оновлено.
      addActivity({
        message: activityMessage,
        jobId: jobId,
        details: {
          photoCount: uploadedFileResults.length,
          caption: uploadCaption || null,
          fileNames: uploadedFileResults.map((r) => r.originalName),
        },
      });

      toast({
        title: "Upload Successful",
        description: `${uploadedFileResults.length} photo(s) uploaded.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });

      setFiles([]);
      setUploadCaption("");
      setPreviews([]);
      if (e.target.reset) e.target.reset(); // Очищаємо інпут файлу більш надійно
      await fetchPhotos();
    } catch (err) {
      console.error("Upload or insert error:", err);
      const errorMsg = err.message || "An error occurred during upload.";
      setUploadError(errorMsg);
      toast({
        title: "Upload Error",
        description: errorMsg,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleEditCaption = (photo) => {
    setEditingPhotoId(photo.id);
    setCurrentCaptionEdit(photo.caption || "");
  };

  const handleCancelEditCaption = () => {
    setEditingPhotoId(null);
    setCurrentCaptionEdit("");
  };

  const handleSaveCaption = async () => {
    if (editingPhotoId === null) return;
    setActionLoading(true);
    try {
      const { data, error: updateError } = await supabase
        .from("photos_after")
        .update({ caption: currentCaptionEdit.trim() || null }) // Встановлюємо null, якщо підпис порожній
        .eq("id", editingPhotoId)
        .select() // Повертаємо оновлений запис
        .single();

      if (updateError) throw updateError;

      toast({
        title: "Caption Updated",
        description: `Caption for photo has been successfully updated.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });

      // Логування
      // Припускаємо, що addActivity оновлено для прийняття об'єкта
      addActivity({
        message: `User ${
          user?.name || user?.id
        } updated caption for after-photo (ID: ${editingPhotoId}) on order #${jobId}. New caption: "${
          data.caption || "(empty)"
        }"`,
        jobId: jobId,
        details: {
          photoId: editingPhotoId,
          newCaption: data.caption,
          action: "caption_updated",
        },
      });

      setEditingPhotoId(null);
      setCurrentCaptionEdit("");
      await fetchPhotos(); // Оновлюємо список фото з новими підписами
    } catch (err) {
      toast({
        title: "Error Updating Caption",
        description: `Failed to update caption: ${err.message}`,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (url) => setModalUrl(url);
  const closeModal = () => setModalUrl(null);

  // Перевірка, чи користувач може редагувати (admin або worker)
  const canEdit = user?.role === "admin" || user?.role === "worker";

  if (pageLoading && photos.length === 0) {
    return <p className={styles.loading}>Loading after-photos…</p>;
  }

  if (error && !pageLoading) {
    // Показуємо помилку, якщо вона є і завантаження завершено
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.photosAfterPage}>
      <h2 className={styles.title}>After Photos for Order #{jobId}</h2>

      {canEdit && ( // Форма завантаження доступна для адмінів та працівників
        <form onSubmit={handleUpload} className={styles.uploadForm}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.fileInput}
            multiple
            disabled={uploadLoading}
          />

          {previews.length > 0 && (
            <div className={styles.previewContainerMultiple}>
              {previews.map((previewUrl, index) => (
                <img
                  key={index}
                  src={previewUrl}
                  alt={`Preview ${index + 1}`}
                  className={styles.previewImg}
                />
              ))}
            </div>
          )}

          <textarea
            placeholder="Common caption for all new photos (optional)"
            value={uploadCaption}
            onChange={(e) => setUploadCaption(e.target.value)}
            className={styles.captionInput}
            disabled={uploadLoading}
          />

          <button
            type="submit"
            disabled={uploadLoading || files.length === 0}
            className={styles.uploadButton}
          >
            {uploadLoading
              ? `Uploading ${files.length} photo(s)…`
              : `Upload ${files.length > 0 ? files.length : ""} After Photo(s)`}
          </button>
        </form>
      )}
      {uploadError && <p className={styles.error}>{uploadError}</p>}

      {!pageLoading && photos.length === 0 && !error && (
        <p className={styles.noResults}>No after-photos uploaded yet.</p>
      )}

      {photos.length > 0 && (
        <ul className={styles.photoList}>
          {photos.map((p) => (
            <li key={p.id} className={styles.photoItem}>
              <img
                src={p.url}
                alt={p.caption || "After Job"}
                className={styles.thumb}
                onClick={() => openModal(p.url)}
              />
              <div className={styles.photoDetails}>
                {editingPhotoId === p.id && canEdit ? (
                  <div className={styles.editCaptionForm}>
                    <textarea
                      value={currentCaptionEdit}
                      onChange={(e) => setCurrentCaptionEdit(e.target.value)}
                      placeholder="Enter caption"
                      className={styles.editCaptionTextarea}
                      disabled={actionLoading}
                      rows="2"
                    />
                    <div className={styles.editCaptionActions}>
                      <button
                        onClick={handleSaveCaption}
                        disabled={actionLoading}
                        className={styles.saveCaptionBtn}
                      >
                        {actionLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEditCaption}
                        disabled={actionLoading}
                        className={styles.cancelCaptionBtn}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {p.caption && (
                      <p className={styles.photoCaption}>{p.caption}</p>
                    )}
                    {!p.caption && canEdit && (
                      <button
                        onClick={() => handleEditCaption(p)}
                        className={styles.addEditCaptionBtn}
                        disabled={actionLoading || editingPhotoId !== null}
                      >
                        Add Caption
                      </button>
                    )}
                    {p.caption && canEdit && (
                      <button
                        onClick={() => handleEditCaption(p)}
                        className={styles.addEditCaptionBtn}
                        disabled={actionLoading || editingPhotoId !== null}
                      >
                        Edit Caption
                      </button>
                    )}
                  </>
                )}
              </div>
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
              className={styles.modalImg}
            />
          </div>
        </div>
      )}
    </div>
  );
}
