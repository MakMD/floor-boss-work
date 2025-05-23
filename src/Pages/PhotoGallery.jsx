// src/Pages/PhotoGallery.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom"; // Додаємо useNavigate, useSearchParams
import { supabase } from "../lib/supabase";
import styles from "./PhotoGallery.module.css";
import { AppContext } from "../components/App/App";

// Допоміжна функція для відображення назви папки замовлення
const getJobFolderName = (job) => {
  if (!job) return "Unknown Job";
  return `Order #${job.id} - ${job.address || job.client || "Details N/A"}`;
};

// Компонент для відображення сітки фотографій (буде розширено пізніше)
const PhotoGridDisplay = ({ jobId, photoType, onBack }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalUrl, setModalUrl] = useState(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const fetchPhotosForJob = async () => {
      if (!jobId || !photoType) return;
      setLoading(true);
      setError(null);
      let query;
      let photoData = [];

      try {
        if (photoType === "after") {
          setTitle("After Work Photos");
          query = supabase
            .from("photos_after")
            .select("id, url, caption, created_at, job_id")
            .eq("job_id", jobId)
            .order("created_at", { ascending: false });
        } else if (photoType === "materials") {
          setTitle("Materials Photos");
          query = supabase
            .from("materials")
            .select("id, url, description, amount, created_at, job_id")
            .eq("job_id", jobId)
            .not("url", "is", null) // Тільки ті, що мають URL
            .order("created_at", { ascending: false });
        } else if (photoType === "job_order") {
          setTitle("Job Order Photo");
          const { data: jobData, error: jobFetchError } = await supabase
            .from("jobs")
            .select("id, job_order_photo_url, created_at, client, address") // client/address для контексту
            .eq("id", jobId)
            .single();
          if (jobFetchError) throw jobFetchError;
          if (jobData && jobData.job_order_photo_url) {
            // Імітуємо структуру інших фото для уніфікованого відображення
            photoData = [
              {
                id: `job_order_${jobData.id}`,
                url: jobData.job_order_photo_url,
                caption: `Job Order Photo for ${getJobFolderName(jobData)}`,
                created_at: jobData.created_at, // Дата створення замовлення
                job_id: jobData.id,
              },
            ];
          }
        }

        if (query) {
          const { data, error: fetchError } = await query;
          if (fetchError) throw fetchError;
          photoData = data.map((p) => ({
            ...p,
            caption: p.caption || p.description, // Для матеріалів використовуємо description як caption
          }));
        }
        setPhotos(photoData || []);
      } catch (err) {
        setError(`Failed to load ${photoType} photos: ${err.message}`);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotosForJob();
  }, [jobId, photoType]);

  const openModal = (url) => setModalUrl(url);
  const closeModal = () => setModalUrl(null);

  if (loading) return <p className={styles.loading}>Loading photos...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.photoGridContainer}>
      <button onClick={onBack} className={styles.backButton}>
        &larr; Back to Job Folders
      </button>
      <h2 className={styles.subTitle}>
        {title} for {jobId && `Order #${jobId}`}
      </h2>
      {photos.length === 0 && (
        <p className={styles.noPhotos}>No photos found for this category.</p>
      )}
      <div className={styles.photoGrid}>
        {photos.map((photo) => (
          <div
            key={photo.id || photo.url}
            className={styles.photoCard}
            onClick={() => openModal(photo.url)}
          >
            <img
              src={photo.url}
              alt={photo.caption || `Photo for job ${photo.job_id}`}
              className={styles.photoThumb}
            />
            <div className={styles.photoInfo}>
              {photo.caption && (
                <p className={styles.caption}>{photo.caption}</p>
              )}
              <p className={styles.date}>
                {new Date(photo.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Модальне вікно */}
      {modalUrl && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.closeBtn} onClick={closeModal}>
              &times;
            </button>
            <img src={modalUrl} alt="Enlarged" className={styles.modalImg} />
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент для відображення підпапок для обраного замовлення
const JobPhotoTypes = ({ job, onSelectPhotoType, onBack }) => {
  if (!job) return null;
  const photoTypes = [
    { type: "after", label: "After Work Photos" },
    { type: "materials", label: "Materials Photos" },
    { type: "job_order", label: "Job Order Photo" },
  ];

  return (
    <div className={styles.jobPhotoTypesContainer}>
      <button onClick={onBack} className={styles.backButton}>
        &larr; Back to Orders List
      </button>
      <h2 className={styles.subTitle}>
        Photo Categories for {getJobFolderName(job)}
      </h2>
      <div className={styles.folderGrid}>
        {photoTypes.map((pt) => (
          <div
            key={pt.type}
            className={styles.folderCard}
            onClick={() => onSelectPhotoType(pt.type)}
          >
            <div className={styles.folderIcon}>📁</div>{" "}
            {/* Проста іконка папки */}
            <p className={styles.folderName}>{pt.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function PhotoGallery() {
  const { user } = useContext(AppContext);
  const [jobs, setJobs] = useState([]); // Список замовлень (папок)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Використовуємо useSearchParams для керування станом в URL
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedJobId = searchParams.get("jobId");
  const selectedPhotoType = searchParams.get("photoType");

  const [searchTerm, setSearchTerm] = useState(""); // Для пошуку замовлень

  // Завантаження списку замовлень
  useEffect(() => {
    const fetchJobsForGallery = async () => {
      setLoading(true);
      setError(null);
      try {
        // Завантажуємо лише ті замовлення, для яких потенційно є фото
        // Це може бути складним запитом, якщо потрібно перевіряти наявність фото в кількох таблицях.
        // Для простоти, поки що завантажуємо всі замовлення, які може бачити адмін.
        // Пізніше можна оптимізувати, щоб показувати лише "папки" з фото.
        let query = supabase
          .from("jobs")
          .select("id, address, client, created_at, job_order_photo_url") // Поля для відображення папки та перевірки Job Order Photo
          .order("created_at", { ascending: false });

        // TODO: Додати фільтрацію замовлень, якщо це потрібно (наприклад, за датою, статусом)

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        setJobs(data || []);
      } catch (err) {
        setError(`Failed to load jobs for gallery: ${err.message}`);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") {
      // Галерея доступна лише адміну
      fetchJobsForGallery();
    }
  }, [user]); // Перезавантажуємо, якщо змінився користувач

  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    return (
      getJobFolderName(job).toLowerCase().includes(term) ||
      job.id.toString().includes(term)
    );
  });

  // Обробники для навігації
  const handleSelectJob = (jobId) => {
    setSearchParams({ jobId });
  };

  const handleSelectPhotoType = (photoType) => {
    setSearchParams({ jobId: selectedJobId, photoType });
  };

  const handleBackToOrders = () => {
    setSearchParams({});
  };

  const handleBackToJobFolders = () => {
    setSearchParams({ jobId: selectedJobId });
  };

  // Логіка рендерингу залежно від обраного рівня
  if (user?.role !== "admin") {
    return (
      <p className={styles.accessDenied}>
        Access Denied. Photo Gallery is for admins only.
      </p>
    );
  }

  if (loading && !selectedJobId)
    return <p className={styles.loading}>Loading orders for gallery...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  // Рівень 3: Відображення сітки фотографій
  if (selectedJobId && selectedPhotoType) {
    return (
      <PhotoGridDisplay
        jobId={selectedJobId}
        photoType={selectedPhotoType}
        onBack={handleBackToJobFolders}
      />
    );
  }

  // Рівень 2: Відображення типів фото для обраного замовлення
  if (selectedJobId) {
    const job = jobs.find((j) => j.id.toString() === selectedJobId);
    return (
      <JobPhotoTypes
        job={job}
        onSelectPhotoType={handleSelectPhotoType}
        onBack={handleBackToOrders}
      />
    );
  }

  // Рівень 1: Список замовлень (папок)
  return (
    <div className={styles.galleryPage}>
      <h1 className={styles.pageTitle}>Photo Gallery - Orders</h1>
      <input
        type="text"
        placeholder="Search orders by address, client, or ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchInput} // Потрібно додати стиль
      />

      {filteredJobs.length === 0 && !loading && (
        <p className={styles.noPhotos}>
          No orders found matching your criteria.
        </p>
      )}

      <div className={styles.folderGrid}>
        {" "}
        {/* Використовуємо той самий стиль для сітки папок */}
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className={styles.folderCard}
            onClick={() => handleSelectJob(job.id.toString())}
          >
            <div className={styles.folderIcon}>🗂️</div>{" "}
            {/* Іконка для замовлення */}
            <p className={styles.folderName}>{getJobFolderName(job)}</p>
            <p className={styles.folderDate}>
              Created: {new Date(job.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
