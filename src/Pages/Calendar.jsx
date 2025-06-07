// src/Pages/Calendar.jsx
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { Link } from "react-router-dom";
import styles from "./Calendar.module.css";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import { useToast } from "@chakra-ui/react";
import WeekStripCalendar from "../components/Calendar/WeekStripCalendar";
import StatusBadge from "../components/common/StatusBadge"; // <-- ІМПОРТ
import { getStartOfWeek, addDays, isSameDay } from "../utils/dateUtils";
import { Edit3, Trash2, Eye, EyeOff, XCircle } from "lucide-react";

function parseDateStringSafe(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function CalendarPage() {
  const { user, addActivity } = useContext(AppContext);
  const toast = useToast();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [displayWeekStartDate, setDisplayWeekStartDate] = useState(
    getStartOfWeek(new Date())
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("jobs")
        .select(
          "id, address, date, client, worker_status, admin_status, is_hidden, job_workers!inner(worker_id)"
        )
        .order("date", { ascending: true });

      if (user?.role === "admin") {
        query = query.eq("is_hidden", showHidden);
      } else {
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
  }, [showHidden, user, toast]);

  useEffect(() => {
    if (user) {
      fetchJobs();
    } else {
      setJobs([]);
    }
  }, [fetchJobs, user]);

  const jobsByDateForStrip = useMemo(() => {
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

  const handlePrevWeek = () =>
    setDisplayWeekStartDate((prev) => addDays(prev, -7));
  const handleNextWeek = () =>
    setDisplayWeekStartDate((prev) => addDays(prev, 7));
  const handleToday = () => {
    const today = new Date();
    setDisplayWeekStartDate(getStartOfWeek(today));
    setSelectedDate(today);
    setShowAll(false);
    setEditingId(null);
  };
  const handleDateSelectInStrip = (date) => {
    setSelectedDate(date);
    setShowAll(false);
    setEditingId(null);
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
        description: `Order #${jobId} deleted.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      if (typeof addActivity === "function") {
        addActivity({
          action_type: "ORDER_DELETED",
          jobId: jobId,
        });
      }
      await fetchJobs();
      setEditingId(null);
    } catch (err) {
      toast({
        title: "Error Deleting Order",
        description: err.message,
        status: "error",
        duration: 7000,
        isClosable: true,
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
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      if (typeof addActivity === "function") {
        addActivity({
          action_type: currentIsHidden ? "ORDER_UNHIDDEN" : "ORDER_HIDDEN",
          jobId: jobId,
        });
      }
      await fetchJobs();
      setEditingId(null);
    } catch (err) {
      toast({
        title: `Error ${currentIsHidden ? "Unhiding" : "Hiding"} Order`,
        description: err.message,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ВИДАЛЕНО: Локальна функція getStatusBadge

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
    if (showAll) {
      return searchedJobs;
    }
    return searchedJobs.filter((job) => {
      if (!job.date) return false;
      const jobDate = parseDateStringSafe(job.date);
      return jobDate && selectedDate && isSameDay(jobDate, selectedDate);
    });
  }, [searchedJobs, selectedDate, showAll]);

  const groupedByDateJobs = useMemo(() => {
    if (!showAll) {
      return { [selectedDate.toDateString()]: dateFilteredJobs };
    }
    return dateFilteredJobs.reduce((acc, job) => {
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
    }, {});
  }, [dateFilteredJobs, showAll, selectedDate]);

  const sortedDateKeys = useMemo(
    () =>
      Object.keys(groupedByDateJobs).sort((a, b) => {
        if (a === "Jobs with Unspecified Date") return 1;
        if (b === "Jobs with Unspecified Date") return -1;
        if (!showAll) return 0;
        return new Date(a) - new Date(b);
      }),
    [groupedByDateJobs, showAll]
  );

  return (
    <div className={styles.calendarPage}>
      <div className={styles.controlsContainer}>
        {user?.role === "admin" && (
          <div className={styles.hiddenToggle}>
            <button
              className={`${styles.controlButton} ${
                showHidden ? styles.activeView : ""
              }`}
              onClick={() => {
                setShowHidden((prev) => !prev);
                setEditingId(null);
              }}
              disabled={actionLoading || loading}
            >
              {showHidden ? "Showing Hidden" : "Show Visible Only"}
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
      </div>

      <WeekStripCalendar
        displayWeekStartDate={displayWeekStartDate}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelectInStrip}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        jobsByDate={jobsByDateForStrip}
      />

      <div className={styles.showAllButtonContainer}>
        <button
          className={styles.showAllBtn}
          onClick={() => {
            setShowAll((prev) => !prev);
            setEditingId(null);
            if (!showAll === false) {
              setSelectedDate(new Date());
              setDisplayWeekStartDate(getStartOfWeek(new Date()));
            }
          }}
          disabled={loading || actionLoading}
        >
          {showAll
            ? selectedDate
              ? `Show for ${selectedDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}`
              : "Show Selected Day"
            : "Show All Filtered Orders"}
        </button>
      </div>

      <div className={styles.eventsContainer}>
        <h2 className={styles.eventsTitle}>
          {showAll
            ? `All ${
                showHidden && user?.role === "admin" ? "Hidden " : ""
              }Filtered Orders`
            : `Orders for ${selectedDate.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}`}
        </h2>

        {loading && <p className={styles.loadingMessage}>Loading orders...</p>}
        {error && !loading && <p className={styles.errorMessage}>{error}</p>}
        {!loading && dateFilteredJobs.length === 0 && !error && (
          <p className={styles.noResultsMessage}>
            {showAll && searchTerm
              ? "No orders match your search criteria."
              : showAll
              ? "No orders to display."
              : "No orders for the selected date."}
          </p>
        )}

        {(showAll ? sortedDateKeys : [selectedDate.toDateString()]).map(
          (dateKeyOrHeader) => {
            const jobsToDisplay = showAll
              ? groupedByDateJobs[dateKeyOrHeader] || []
              : dateFilteredJobs;

            if (jobsToDisplay.length === 0 && showAll) return null;

            return (
              <div key={dateKeyOrHeader} className={styles.dateGroup}>
                {showAll && jobsToDisplay.length > 0 && (
                  <h3 className={styles.dateHeader}>{dateKeyOrHeader}</h3>
                )}
                <ul className={styles.jobList}>
                  {jobsToDisplay
                    .sort((a, b) => Number(a.id) - Number(b.id))
                    .map((job) => (
                      <li key={job.id} className={styles.jobItem}>
                        <div className={styles.jobItemContent}>
                          <div className={styles.jobItemHeader}>
                            <Link
                              to={`/orders/${job.id}`}
                              className={styles.jobLink}
                            >
                              Order #{job.id}
                            </Link>
                            {/* ЗМІНА: Використовуємо новий компонент */}
                            <StatusBadge
                              workerStatus={job.worker_status}
                              adminStatus={job.admin_status}
                            />
                          </div>
                          <p className={styles.jobDetailText}>
                            {job.client || "N/A Client"} -{" "}
                            {job.address || "N/A Address"}
                          </p>
                          {job.is_hidden && user?.role === "admin" && (
                            <span className={styles.hiddenLabel}>(Hidden)</span>
                          )}
                        </div>

                        {user?.role === "admin" && (
                          <div className={styles.jobActions}>
                            {editingId === job.id ? (
                              <>
                                <button
                                  title={job.is_hidden ? "Unhide" : "Hide"}
                                  className={`${styles.actionButton} ${styles.hideBtn}`}
                                  onClick={() =>
                                    handleHide(job.id, job.is_hidden)
                                  }
                                  disabled={actionLoading}
                                >
                                  {job.is_hidden ? (
                                    <EyeOff size={16} />
                                  ) : (
                                    <Eye size={16} />
                                  )}
                                </button>
                                <button
                                  title="Delete"
                                  className={`${styles.actionButton} ${styles.deleteBtn}`}
                                  onClick={() => handleDelete(job.id)}
                                  disabled={actionLoading}
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button
                                  title="Cancel"
                                  className={`${styles.actionButton} ${styles.cancelBtn}`}
                                  onClick={() => setEditingId(null)}
                                  disabled={actionLoading}
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            ) : (
                              <button
                                title="Actions"
                                className={`${styles.actionButton} ${styles.editBtn}`}
                                onClick={() => setEditingId(job.id)}
                                disabled={actionLoading}
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
