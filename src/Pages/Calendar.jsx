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
import "react-calendar/dist/Calendar.css"; // Стилі для ReactCalendar
import styles from "./Calendar.module.css"; //
import { AppContext } from "../components/App/App"; //
import { supabase } from "../lib/supabase"; //

// Допоміжна функція для парсингу дати з рядка YYYY-MM-DD
// Враховує можливі проблеми з часовими поясами, замінюючи '-' на '/'
function parseDateStringSafe(dateString) {
  if (!dateString) return null;
  return new Date(dateString.replace(/-/g, "/"));
}

export default function CalendarPage() {
  const { user } = useContext(AppContext);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeDate, setActiveDate] = useState(new Date()); // Обрана дата в календарі
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false); // Показувати всі роботи чи лише на обрану дату/період
  const [showHidden, setShowHidden] = useState(false); // Показувати приховані роботи (для адміна)
  const [editingId, setEditingId] = useState(null); // Для режиму редагування (сховати/видалити)

  const [selectedPeriodInDays, setSelectedPeriodInDays] = useState(null); // null, 3, 7, 10

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("jobs")
        .select(
          "id, address, date, client, job_workers!inner(worker_id), is_hidden"
        )
        .order("date", { ascending: true }); // Сортуємо за датою

      query = query.eq("is_hidden", showHidden);

      if (user?.role === "worker" && user?.id) {
        // Додано перевірку user та user.id
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
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [showHidden, user]); // user додано як залежність, щоб перезавантажити, якщо змінився користувач

  useEffect(() => {
    if (user) {
      // Завантажуємо роботи тільки якщо є користувач
      fetchJobs();
    } else {
      setJobs([]); // Очищаємо роботи, якщо користувач вийшов
    }
  }, [fetchJobs, user]);

  const jobsByDate = useMemo(() => {
    const counts = {};
    jobs.forEach((job) => {
      if (job.date) {
        const jobDate = parseDateStringSafe(job.date);
        if (jobDate) {
          const jobDateKey = jobDate.toDateString(); // Нормалізуємо дату до рядка для ключа
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
    // Використовуємо окремий лоадер для дій, щоб не блокувати весь календар
    // setActionLoading(true);
    const { error: delErr } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId);
    // setActionLoading(false);
    if (delErr) {
      alert("Failed to delete order: " + delErr.message);
    } else {
      await fetchJobs();
      setEditingId(null);
    }
  };

  const handleHide = async (jobId) => {
    if (!window.confirm("Are you sure you want to hide this order?")) return;
    // setActionLoading(true);
    const { error: updErr } = await supabase
      .from("jobs")
      .update({ is_hidden: true })
      .eq("id", jobId);
    // setActionLoading(false);
    if (updErr) {
      alert("Failed to hide order: " + updErr.message);
    } else {
      await fetchJobs();
      setEditingId(null);
    }
  };

  // Фільтрація за пошуковим запитом
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

  // Фільтрація за датою або періодом
  const dateFilteredJobs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (showAll) {
      return searchedJobs;
    }

    if (selectedPeriodInDays !== null) {
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + selectedPeriodInDays - 1);
      endDate.setHours(23, 59, 59, 999);

      return searchedJobs.filter((job) => {
        if (!job.date) return false;
        const jobDate = parseDateStringSafe(job.date);
        if (!jobDate) return false;
        jobDate.setHours(0, 0, 0, 0);
        return jobDate >= today && jobDate <= endDate;
      });
    }

    return searchedJobs.filter((job) => {
      if (!job.date) return false;
      const jobDate = parseDateStringSafe(job.date);
      return jobDate?.toDateString() === activeDate.toDateString();
    });
  }, [searchedJobs, activeDate, showAll, selectedPeriodInDays]);

  // Групування відфільтрованих робіт за датою для відображення
  const groupedByDateJobs = useMemo(
    () =>
      dateFilteredJobs.reduce((acc, job) => {
        const jobDate = job.date ? parseDateStringSafe(job.date) : null;
        // Використовуємо toLocaleDateString для більш читабельного формату дати як ключа
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

  // Сортування ключів-дат для відображення
  const sortedDateKeys = useMemo(
    () =>
      Object.keys(groupedByDateJobs).sort((a, b) => {
        if (a === "Jobs with Unspecified Date") return 1; // "Unspecified Date" завжди в кінці
        if (b === "Jobs with Unspecified Date") return -1;
        // Сортуємо дати в хронологічному порядку (від старіших до новіших)
        return new Date(a) - new Date(b);
      }),
    [groupedByDateJobs]
  );

  const handlePeriodSelect = (days) => {
    setSelectedPeriodInDays(days);
    setShowAll(false);
    setActiveDate(new Date()); // При виборі періоду, activeDate можна скинути на сьогодні або залишити як є
  };

  return (
    <div className={styles.calendarPage}>
      {user?.role === "admin" && (
        <div className={styles.hiddenToggle}>
          <button
            className={styles.toggleBtn}
            onClick={() => setShowHidden((prev) => !prev)}
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
        />
      </div>

      <div className={styles.calendarWrapper}>
        <ReactCalendar
          onChange={(date) => {
            setActiveDate(date);
            setShowAll(false);
            setSelectedPeriodInDays(null); // Скидаємо фільтр за періодом
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
            onClick={() => handlePeriodSelect(days)}
            className={`${styles.periodButton} ${
              selectedPeriodInDays === days ? styles.activePeriodButton : ""
            }`}
          >
            Next {days} Days
          </button>
        ))}
        {selectedPeriodInDays !== null && (
          <button
            onClick={() => {
              setSelectedPeriodInDays(null);
              setActiveDate(new Date()); // Повертаємо календар на сьогодні
            }}
            className={styles.clearPeriodButton}
          >
            Clear Period
          </button>
        )}
      </div>

      <div className={styles.buttonContainer}>
        <button
          className={styles.showAllBtn}
          onClick={() => {
            setShowAll(true);
            setSelectedPeriodInDays(null);
            // setActiveDate(null); // Можна скинути activeDate або залишити
          }}
        >
          Show All Filtered Orders
        </button>
      </div>

      <div className={styles.eventsContainer}>
        <h2 className={styles.title}>
          {selectedPeriodInDays !== null
            ? `Orders for Next ${selectedPeriodInDays} Days (from today)`
            : showAll
            ? showHidden
              ? "Hidden Orders (All Dates, Filtered)"
              : "All Filtered Orders (All Dates)"
            : `Orders on ${activeDate.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}`}
        </h2>

        {loading && <p className={styles.loading}>Loading orders...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && sortedDateKeys.length === 0 && (
          <p className={styles.noResults}>
            {searchTerm
              ? "No orders match your search criteria."
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
                .sort((a, b) => Number(a.id) - Number(b.id)) // Сортуємо за ID (старіші зверху)
                .map((job) => (
                  <li key={job.id} className={styles.jobItem}>
                    <Link to={`/orders/${job.id}`} className={styles.jobLink}>
                      Order #{job.id}: {job.client || job.address}
                      {job.date &&
                        ` (Scheduled: ${new Date(
                          job.date.replace(/-/g, "/")
                        ).toLocaleDateString()})`}
                    </Link>

                    {user?.role === "admin" && (
                      <div className={styles.jobActions}>
                        {editingId === job.id ? (
                          <>
                            {!showHidden && (
                              <button
                                className={styles.hideBtn}
                                onClick={() => handleHide(job.id)}
                              >
                                Hide
                              </button>
                            )}
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDelete(job.id)}
                            >
                              Delete
                            </button>
                            <button
                              className={styles.cancelBtn}
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className={styles.editBtn}
                            onClick={() => setEditingId(job.id)}
                          >
                            Edit
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
