// src/Pages/Calendar.jsx
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { Link } from "react-router-dom";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "./Calendar.module.css";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import { useToast } from "@chakra-ui/react"; // <--- НОВИЙ ІМПОРТ

function parseDateStringSafe(dateString) {
  if (!dateString) return null;
  return new Date(dateString.replace(/-/g, "/"));
}

export default function CalendarPage() {
  const { user, addActivity } = useContext(AppContext); // <--- Додано addActivity
  const toast = useToast(); // <--- ІНІЦІАЛІЗАЦІЯ TOAST

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Для відображення загальної помилки завантаження

  const [activeDate, setActiveDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false); // Для кнопок Hide/Delete

  const [selectedPeriodInDays, setSelectedPeriodInDays] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null); // Скидаємо помилку перед кожним завантаженням
    try {
      let query = supabase
        .from("jobs")
        .select(
          "id, address, date, client, job_workers!inner(worker_id), is_hidden"
        )
        .order("date", { ascending: true });

      // Застосовуємо фільтр is_hidden тільки якщо showHidden встановлено (для адміна)
      if (user?.role === "admin") {
        query = query.eq("is_hidden", showHidden);
      } else {
        // Для інших ролей завжди показуємо тільки не приховані
        query = query.eq("is_hidden", false);
      }

      if (user?.role === "worker" && user?.id) {
        query = query.eq("job_workers.worker_id", user.id);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setJobs(
        data.map((job) => ({
          ...job,
          workerIds: job.job_workers?.map((jw) => jw.worker_id) || [],
        }))
      );
    } catch (err) {
      const errorMsg = `Failed to load orders: ${err.message}`;
      setError(errorMsg);
      toast({
        title: "Error Loading Orders",
        description: errorMsg,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [showHidden, user, toast]); // Додано user і toast до залежностей

  useEffect(() => {
    if (user) {
      fetchJobs();
    } else {
      setJobs([]);
    }
  }, [fetchJobs, user]);

  const jobsByDate = useMemo(() => {
    const counts = {};
    jobs.forEach((job) => {
      if (job.date) {
        const jobDate = parseDateStringSafe(job.date);
        if (jobDate) {
          const jobDateKey = jobDate.toDateString();
          counts[jobDateKey] = (counts[jobDateKey] || 0) + 1;
        }
      }
    });
    return counts;
  }, [jobs]);

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const dateStr = date.toDateString();
      const count = jobsByDate[dateStr];
      if (count > 0) {
        return <p className={styles.jobCountBadge}>{count}</p>;
      }
    }
    return null;
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    setActionLoading(true);
    try {
      const { error: delErr } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);

      if (delErr) throw delErr;

      toast({
        title: "Order Deleted",
        description: `Order #${jobId} has been successfully deleted.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      addActivity(`Admin ${user.name || user.id} deleted order #${jobId}`);
      await fetchJobs(); // Оновлюємо список
      setEditingId(null);
    } catch (err) {
      toast({
        title: "Error Deleting Order",
        description: `Failed to delete order #${jobId}: ${err.message}`,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleHide = async (jobId, currentIsHidden) => {
    const actionText = currentIsHidden ? "unhide" : "hide";
    if (!window.confirm(`Are you sure you want to ${actionText} this order?`))
      return;
    setActionLoading(true);
    try {
      const { error: updErr } = await supabase
        .from("jobs")
        .update({ is_hidden: !currentIsHidden })
        .eq("id", jobId);

      if (updErr) throw updErr;

      toast({
        title: `Order ${currentIsHidden ? "Unhidden" : "Hidden"}`,
        description: `Order #${jobId} has been successfully ${
          actionText === "hide" ? "hidden" : "made visible"
        }.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      addActivity(
        `Admin ${user.name || user.id} ${
          actionText === "hide" ? "hid" : "unhid"
        } order #${jobId}`
      );
      await fetchJobs(); // Оновлюємо список
      setEditingId(null);
    } catch (err) {
      toast({
        title: `Error ${currentIsHidden ? "Unhiding" : "Hiding"} Order`,
        description: `Failed to ${actionText} order #${jobId}: ${err.message}`,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const searchedJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const term = searchTerm.toLowerCase();
        return (
          job.address?.toLowerCase().includes(term) ||
          job.client?.toLowerCase().includes(term) ||
          job.id?.toString().includes(term)
        );
      }),
    [jobs, searchTerm]
  );

  const dateFilteredJobs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (showAll) {
      return searchedJobs;
    }

    if (selectedPeriodInDays !== null) {
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + selectedPeriodInDays - 1); // -1 тому що включаємо сьогоднішній день
      endDate.setHours(23, 59, 59, 999);

      return searchedJobs.filter((job) => {
        if (!job.date) return false;
        const jobDate = parseDateStringSafe(job.date);
        if (!jobDate) return false;
        jobDate.setHours(0, 0, 0, 0); // Нормалізуємо час для порівняння
        return jobDate >= today && jobDate <= endDate;
      });
    }

    // Фільтрація за активною датою календаря
    return searchedJobs.filter((job) => {
      if (!job.date) return false;
      const jobDate = parseDateStringSafe(job.date);
      return jobDate?.toDateString() === activeDate.toDateString();
    });
  }, [searchedJobs, activeDate, showAll, selectedPeriodInDays]);

  const groupedByDateJobs = useMemo(
    () =>
      dateFilteredJobs.reduce((acc, job) => {
        const jobDate = job.date ? parseDateStringSafe(job.date) : null;
        const key = jobDate
          ? jobDate.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })
          : "Jobs with Unspecified Date";
        if (!acc[key]) acc[key] = [];
        acc[key].push(job);
        return acc;
      }, {}),
    [dateFilteredJobs]
  );

  const sortedDateKeys = useMemo(
    () =>
      Object.keys(groupedByDateJobs).sort((a, b) => {
        if (a === "Jobs with Unspecified Date") return 1;
        if (b === "Jobs with Unspecified Date") return -1;
        return new Date(a) - new Date(b);
      }),
    [groupedByDateJobs]
  );

  const handlePeriodSelect = (days) => {
    setSelectedPeriodInDays(days);
    setShowAll(false); // Якщо обрано період, не показуємо "всі"
    setActiveDate(new Date());
  };

  return (
    <div className={styles.calendarPage}>
      {user?.role === "admin" && (
        <div className={styles.hiddenToggle}>
          <button
            className={styles.toggleBtn}
            onClick={() => {
              setShowHidden((prev) => !prev);
              // При зміні фільтра прихованих, скидаємо editingId, щоб меню дій закрилося
              setEditingId(null);
            }}
            disabled={actionLoading || loading}
          >
            {showHidden ? "Show Visible Orders" : "Show Hidden Orders"}
          </button>
        </div>
      )}

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by ID, address or client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          disabled={loading}
        />
      </div>

      <div className={styles.calendarWrapper}>
        <ReactCalendar
          onChange={(date) => {
            setActiveDate(date);
            setShowAll(false);
            setSelectedPeriodInDays(null);
            setEditingId(null); // Скидаємо редагування при зміні дати
          }}
          value={showAll || selectedPeriodInDays !== null ? null : activeDate}
          className={styles.reactCalendar}
          tileContent={tileContent}
        />
      </div>

      <div className={styles.periodFilterButtons}>
        {[3, 7, 10].map((days) => (
          <button
            key={days}
            onClick={() => {
              handlePeriodSelect(days);
              setEditingId(null); // Скидаємо редагування
            }}
            className={`${styles.periodButton} ${
              selectedPeriodInDays === days ? styles.activePeriodButton : ""
            }`}
            disabled={loading || actionLoading}
          >
            Next {days} Days
          </button>
        ))}
        {(selectedPeriodInDays !== null || showAll) && ( // Кнопка Clear активна, якщо обрано період або "Show All"
          <button
            onClick={() => {
              setSelectedPeriodInDays(null);
              setShowAll(false); // Скидаємо і "Show All"
              setActiveDate(new Date());
              setEditingId(null); // Скидаємо редагування
            }}
            className={styles.clearPeriodButton}
            disabled={loading || actionLoading}
          >
            Clear Filters & Show Today
          </button>
        )}
      </div>

      {!showAll &&
        selectedPeriodInDays === null && ( // Показуємо кнопку "Show All" тільки якщо не обрано період і не активний режим "Show All"
          <div className={styles.buttonContainer}>
            <button
              className={styles.showAllBtn}
              onClick={() => {
                setShowAll(true);
                setSelectedPeriodInDays(null);
                setEditingId(null);
              }}
              disabled={loading || actionLoading}
            >
              Show All Filtered Orders
            </button>
          </div>
        )}

      <div className={styles.eventsContainer}>
        <h2 className={styles.title}>
          {selectedPeriodInDays !== null
            ? `Orders for Next ${selectedPeriodInDays} Days (from today)`
            : showAll
            ? showHidden
              ? "Hidden Orders (All Dates, Filtered by Search)"
              : "All Orders (Filtered by Search)"
            : `Orders on ${activeDate.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}`}
        </h2>
        {loading && <p className={styles.loading}>Loading orders...</p>}
        {error && !loading && <p className={styles.error}>{error}</p>}{" "}
        {/* Показуємо помилку, якщо не йде завантаження */}
        {!loading &&
          sortedDateKeys.length === 0 &&
          !error && ( // Додано !error
            <p className={styles.noResults}>
              {searchTerm && dateFilteredJobs.length === 0 // Якщо є пошуковий запит і він не дав результатів
                ? "No orders match your search criteria for the selected date/period."
                : showAll || selectedPeriodInDays !== null
                ? "No orders found for the current filters/period."
                : "No orders for the selected date."}
            </p>
          )}
        {sortedDateKeys.map((dateKey) => (
          <div key={dateKey} className={styles.dateGroup}>
            <h3 className={styles.dateHeader}>{dateKey}</h3>
            <ul className={styles.jobList}>
              {groupedByDateJobs[dateKey]
                .sort((a, b) => Number(a.id) - Number(b.id))
                .map((job) => (
                  <li key={job.id} className={styles.jobItem}>
                    <Link to={`/orders/${job.id}`} className={styles.jobLink}>
                      Order #{job.id}: {job.client || job.address}
                      {job.date &&
                        ` (Scheduled: ${new Date(
                          job.date.replace(/-/g, "/")
                        ).toLocaleDateString()})`}
                      {job.is_hidden && user?.role === "admin" && " (Hidden)"}
                    </Link>

                    {user?.role === "admin" && (
                      <div className={styles.jobActions}>
                        {editingId === job.id ? (
                          <>
                            <button
                              className={styles.hideBtn}
                              onClick={() => handleHide(job.id, job.is_hidden)}
                              disabled={actionLoading}
                            >
                              {job.is_hidden ? "Unhide" : "Hide"}
                            </button>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDelete(job.id)}
                              disabled={actionLoading}
                            >
                              Delete
                            </button>
                            <button
                              className={styles.cancelBtn}
                              onClick={() => setEditingId(null)}
                              disabled={actionLoading}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className={styles.editBtn}
                            onClick={() => setEditingId(job.id)}
                            disabled={actionLoading}
                          >
                            Actions
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
