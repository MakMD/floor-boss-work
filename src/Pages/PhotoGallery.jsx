// src/Pages/PhotoGallery.jsx
import React, { useState, useEffect, useContext, useMemo } from "react"; // Додано useMemo
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import styles from "./PhotoGallery.module.css";
import { AppContext } from "../components/App/App";
import {
  ArrowLeft,
  Search,
  FolderKanban,
  Image as ImageIconLucide,
  Layers,
  FileImage,
  ImageIcon as GalleryIcon, // Додано GalleryIcon
  ServerCrash,
  ImageOff,
  X,
  FolderOpen,
  FolderSymlink, // Додано ще іконок
} from "lucide-react";

const getJobFolderName = (job) => {
  if (!job) return "Unknown Job";
  return `Order #${job.id} - ${job.address || job.client || "Details N/A"}`;
};

const PhotoGridDisplay = ({ jobId, photoType, onBack, jobDetails }) => {
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
      const jobNameForTitle = jobDetails
        ? getJobFolderName(jobDetails)
        : `Order #${jobId}`;

      try {
        if (photoType === "after") {
          setTitle(`After Work Photos for ${jobNameForTitle}`);
          query = supabase
            .from("photos_after")
            .select("id, url, caption, created_at, job_id")
            .eq("job_id", jobId)
            .order("created_at", { ascending: false });
        } else if (photoType === "materials") {
          setTitle(`Materials Photos for ${jobNameForTitle}`);
          query = supabase
            .from("materials")
            .select("id, url, description, amount, created_at, job_id")
            .eq("job_id", jobId)
            .not("url", "is", null)
            .order("created_at", { ascending: false });
        } else if (photoType === "job_order") {
          setTitle(`Job Order Photo for ${jobNameForTitle}`);
          if (jobDetails && jobDetails.job_order_photo_url) {
            photoData = [
              {
                id: `job_order_${jobDetails.id}`,
                url: jobDetails.job_order_photo_url,
                caption: `Job Order Photo for ${jobNameForTitle}`,
                created_at: jobDetails.created_at,
                job_id: jobDetails.id,
              },
            ];
          } else {
            const { data: jobDataFromDB, error: jobFetchError } = await supabase
              .from("jobs")
              .select("id, job_order_photo_url, created_at, client, address")
              .eq("id", jobId)
              .single();
            if (jobFetchError) throw jobFetchError;
            if (jobDataFromDB && jobDataFromDB.job_order_photo_url) {
              photoData = [
                {
                  id: `job_order_${jobDataFromDB.id}`,
                  url: jobDataFromDB.job_order_photo_url,
                  caption: `Job Order Photo for ${getJobFolderName(
                    jobDataFromDB
                  )}`,
                  created_at: jobDataFromDB.created_at,
                  job_id: jobDataFromDB.id,
                },
              ];
            }
          }
        }

        if (query) {
          const { data, error: fetchError } = await query;
          if (fetchError) throw fetchError;
          photoData = (data || []).map((p) => ({
            ...p,
            caption:
              p.caption ||
              p.description ||
              `Photo from ${new Date(p.created_at).toLocaleDateString()}`,
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
  }, [jobId, photoType, jobDetails]);

  const openModal = (url) => setModalUrl(url);
  const closeModal = () => setModalUrl(null);

  if (loading)
    return (
      <div className={styles.statusMessageContainer}>
        <p className={styles.loadingText}>Loading photos...</p>
      </div>
    ); // Змінено клас
  if (error)
    return (
      <div className={styles.statusMessageContainerError}>
        <ServerCrash size={32} />
        <p className={styles.errorText}>Error: {error}</p>
      </div>
    ); // Змінено клас

  return (
    <div className={styles.photoGridDisplayContainer}>
      <button onClick={onBack} className={styles.backButton}>
        <ArrowLeft size={18} /> Back to Photo Categories
      </button>
      <h2 className={styles.sectionTitle}>{title}</h2>{" "}
      {/* Використовуємо .sectionTitle */}
      {photos.length === 0 && (
        <div className={styles.statusMessageContainer}>
          <ImageOff size={32} />
          <p className={styles.emptyText}>No photos found for this category.</p>
        </div> // Змінено клас
      )}
      <div className={styles.photoGrid}>
        {photos.map((photo) => (
          <div
            key={photo.id || photo.url}
            className={styles.photoCard}
            onClick={() => openModal(photo.url)}
            role="button"
            tabIndex={0}
            aria-label={photo.caption || "View photo"}
          >
            <div className={styles.photoThumbWrapper}>
              <img
                src={photo.url}
                alt={photo.caption || `Photo for job ${photo.job_id}`}
                className={styles.photoThumb}
                loading="lazy"
              />
            </div>
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
      {modalUrl && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalCloseBtn}
              onClick={closeModal}
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
            <img src={modalUrl} alt="Enlarged" className={styles.modalImg} />
          </div>
        </div>
      )}
    </div>
  );
};

const JobPhotoTypes = ({ job, onSelectPhotoType, onBack }) => {
  if (!job) return null;
  const photoTypes = [
    {
      type: "after",
      label: "After Work Photos",
      icon: <ImageIconLucide size={32} />,
    }, // Змінено на ImageIconLucide
    {
      type: "materials",
      label: "Materials Photos",
      icon: <Layers size={32} />,
    },
    {
      type: "job_order",
      label: "Job Order Photo",
      icon: <FileImage size={32} />,
    },
  ];

  return (
    <div className={styles.jobPhotoTypesContainer}>
      <button onClick={onBack} className={styles.backButton}>
        <ArrowLeft size={18} /> Back to Orders List
      </button>
      <h2 className={styles.sectionTitle}>
        {" "}
        {/* Використовуємо .sectionTitle */}
        Photo Categories for {getJobFolderName(job)}
      </h2>
      <div className={styles.folderGrid}>
        {photoTypes.map((pt) => (
          <div
            key={pt.type}
            className={styles.folderCard} // Використовуємо той же стиль, що і для замовлень
            onClick={() => onSelectPhotoType(pt.type)}
            role="button"
            tabIndex={0}
            aria-label={`View ${pt.label}`}
          >
            <div className={styles.folderIcon}>{pt.icon}</div>
            <p className={styles.folderName}>{pt.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function PhotoGallery() {
  const { user } = useContext(AppContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedJobId = searchParams.get("jobId");
  const selectedPhotoType = searchParams.get("photoType");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchJobsForGallery = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from("jobs")
          .select("id, address, client, created_at, job_order_photo_url")
          .order("created_at", { ascending: false });

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
      fetchJobsForGallery();
    } else {
      setLoading(false); // Якщо не адмін, зупиняємо завантаження
    }
  }, [user]);

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        // Додано useMemo
        const term = searchTerm.toLowerCase();
        return (
          getJobFolderName(job).toLowerCase().includes(term) ||
          job.id.toString().includes(term)
        );
      }),
    [jobs, searchTerm]
  );

  const handleSelectJob = (jobId) => setSearchParams({ jobId });
  const handleSelectPhotoType = (photoType) =>
    setSearchParams({ jobId: selectedJobId, photoType });
  const handleBackToOrders = () => {
    setSearchTerm("");
    setSearchParams({});
  };
  const handleBackToJobFolders = () =>
    setSearchParams({ jobId: selectedJobId });

  const selectedJobDetails = useMemo(() => {
    if (selectedJobId) {
      return jobs.find((j) => j.id.toString() === selectedJobId);
    }
    return null;
  }, [selectedJobId, jobs]);

  if (user?.role !== "admin") {
    return (
      <div className={`${styles.galleryPage} ${styles.accessDeniedContainer}`}>
        {" "}
        {/* Додано клас для центрування */}
        <div className={styles.statusMessageError}>
          <ServerCrash size={48} />
          <p>Access Denied. Photo Gallery is for admins only.</p>
        </div>
      </div>
    );
  }

  if (selectedJobId && selectedPhotoType) {
    return (
      <div className={styles.galleryPage}>
        {" "}
        {/* Обгортка для консистентності */}
        <PhotoGridDisplay
          jobId={selectedJobId}
          photoType={selectedPhotoType}
          onBack={handleBackToJobFolders}
          jobDetails={selectedJobDetails}
        />
      </div>
    );
  }

  if (selectedJobId) {
    return (
      <div className={styles.galleryPage}>
        {" "}
        {/* Обгортка для консистентності */}
        <JobPhotoTypes
          job={selectedJobDetails}
          onSelectPhotoType={handleSelectPhotoType}
          onBack={handleBackToOrders}
        />
      </div>
    );
  }

  return (
    <div className={styles.galleryPage}>
      <header className={styles.pageHeader}>
        <GalleryIcon size={28} className={styles.headerIcon} />
        <h1 className={styles.pageTitle}>Photo Gallery</h1>
      </header>

      <div className={styles.searchBarContainer}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search orders by ID, Address, or Client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          disabled={loading}
        />
      </div>

      {loading && (
        <div className={styles.statusMessageContainer}>
          <p className={styles.loadingText}>Loading orders...</p>
        </div>
      )}
      {error && (
        <div className={styles.statusMessageContainerError}>
          <ServerCrash size={32} />
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {!loading && filteredJobs.length === 0 && (
        <div className={styles.statusMessageContainer}>
          <FolderOpen size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>
            {searchTerm
              ? "No orders found matching your search."
              : "No orders with photos available."}
          </p>
        </div>
      )}

      {!loading && filteredJobs.length > 0 && (
        <div className={styles.folderGrid}>
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={styles.folderCard}
              onClick={() => handleSelectJob(job.id.toString())}
              role="button"
              tabIndex={0}
              aria-label={`View photos for ${getJobFolderName(job)}`}
            >
              <div className={styles.folderIcon}>
                <FolderSymlink size={40} />
              </div>{" "}
              {/* Змінено іконку */}
              <p className={styles.folderName}>{getJobFolderName(job)}</p>
              <p className={styles.folderDate}>
                Created: {new Date(job.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
