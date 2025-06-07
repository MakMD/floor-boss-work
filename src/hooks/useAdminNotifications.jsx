import { useState, useEffect, useCallback, useContext } from "react";
import { supabase } from "../lib/supabase";
import { AppContext } from "../components/App/App";

const PAGE_SIZE = 10;

export function useAdminNotifications() {
  const { user } = useContext(AppContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchNotifications = useCallback(
    async (term, page = 0) => {
      if (!user?.role === "admin") {
        setLoading(false);
        return;
      }

      if (page === 0) {
        setLoading(true);
        setNotifications([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase.from("job_updates").select(
          `
            id,
            created_at,
            message,
            action_type,
            details,
            job_id,
            jobs (address, client, work_order_number),
            worker_id,
            workers (name)
          `,
          { count: "exact" }
        );

        if (term) {
          const searchPattern = `%${term}%`;
          query = query.or(
            `jobs.address.ilike.${searchPattern},jobs.client.ilike.${searchPattern},jobs.work_order_number.ilike.${searchPattern},workers.name.ilike.${searchPattern},message.ilike.${searchPattern}`
          );
        }

        query = query.order("created_at", { ascending: false }).range(from, to);

        const { data, error: fetchError, count } = await query;

        if (fetchError) throw fetchError;

        setNotifications((prev) => (page === 0 ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE && count > from + data.length);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchNotifications(searchTerm, 0);
  }, [searchTerm, fetchNotifications]);

  const deleteNotificationById = useCallback(async (notificationId) => {
    try {
      const { error: deleteError } = await supabase
        .from("job_updates")
        .delete()
        .eq("id", notificationId);
      if (deleteError) throw deleteError;
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Failed to delete notification:", err);
      throw err;
    }
  }, []);

  return {
    notifications,
    loading,
    loadingMore,
    error,
    hasMore,
    setSearchTerm,
    fetchMore: (page) => fetchNotifications(searchTerm, page),
    deleteNotificationById,
  };
}
