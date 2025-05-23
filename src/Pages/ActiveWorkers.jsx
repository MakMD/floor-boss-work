// src/Pages/ActiveWorkers.jsx
import React, { useState, useEffect, useContext, useCallback } from "react"; // Додано useCallback
import { useParams, Link } from "react-router-dom";
import Select from "react-select";
import { supabase } from "../lib/supabase"; //
import styles from "./ActiveWorkers.module.css"; //
import { AppContext } from "../components/App/App"; //

export default function ActiveWorkers() {
  const { id: jobId } = useParams();
  const { user, addActivity } = useContext(AppContext); //

  const [assignedWorkers, setAssignedWorkers] = useState([]);
  const [allWorkers, setAllWorkers] = useState([]);
  const [selectedWorkerToAdd, setSelectedWorkerToAdd] = useState(null);

  const [initialLoading, setInitialLoading] = useState(true); // Для початкового завантаження
  const [actionLoading, setActionLoading] = useState(false); // Для кнопок Додати/Видалити
  const [error, setError] = useState(null);

  // Використовуємо useCallback для стабілізації функції
  const fetchAssignedWorkers = useCallback(async () => {
    // Не встановлюємо тут setInitialLoading(true), щоб уникнути миготіння
    // при оновленні після дії. Його контролює головний useEffect.
    setError(null);
    try {
      const { data: rel, error: relErr } = await supabase
        .from("job_workers")
        .select("worker_id")
        .eq("job_id", jobId);
      if (relErr) throw relErr;

      const workerIds = rel.map((r) => r.worker_id);
      if (!workerIds.length) {
        setAssignedWorkers([]);
        return; // Важливо повернути, щоб не виконувати наступний запит з порожнім масивом
      }

      const { data: workersData, error: usrErr } = await supabase
        .from("workers")
        .select("id, name, role")
        .in("id", workerIds)
        .order("name", { ascending: true });
      if (usrErr) throw usrErr;
      setAssignedWorkers(workersData || []);
    } catch (e) {
      setError(`Error fetching assigned workers: ${e.message}`);
      setAssignedWorkers([]);
    }
    // setInitialLoading(false); // Контролюється з головного useEffect
  }, [jobId]); // useCallback залежить від jobId

  const fetchAllWorkers = useCallback(async () => {
    // setError(null); // Не скидаємо тут, щоб не втратити помилку від fetchAssignedWorkers
    try {
      const { data, error: fetchError } = await supabase
        .from("workers")
        .select("id, name")
        .order("name", { ascending: true });
      if (fetchError) throw fetchError;
      setAllWorkers(data || []);
    } catch (e) {
      setError((prevError) =>
        prevError
          ? `${prevError}\nError fetching all workers: ${e.message}`
          : `Error fetching all workers: ${e.message}`
      );
      setAllWorkers([]);
    }
  }, []); // Пустий масив залежностей, оскільки ця функція не залежить від props чи state

  useEffect(() => {
    const loadData = async () => {
      if (!jobId) return;
      setInitialLoading(true);
      setError(null); // Скидаємо помилки перед початком завантаження
      // Виконуємо послідовно, щоб уникнути потенційних проблем з одночасними setError
      await fetchAllWorkers();
      await fetchAssignedWorkers();
      setInitialLoading(false);
    };
    loadData();
  }, [jobId, fetchAssignedWorkers, fetchAllWorkers]); // Додаємо fetchAllWorkers і fetchAssignedWorkers як залежності

  const handleAddWorker = async () => {
    if (!selectedWorkerToAdd || !selectedWorkerToAdd.value) {
      setError("Please select a worker to add.");
      return;
    }
    if (assignedWorkers.some((w) => w.id === selectedWorkerToAdd.value)) {
      setError(`${selectedWorkerToAdd.label} is already assigned to this job.`);
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const { error: insertError } = await supabase
        .from("job_workers")
        .insert([{ job_id: jobId, worker_id: selectedWorkerToAdd.value }]);

      if (insertError) throw insertError;

      addActivity(
        `Admin ${user?.name || user?.id} assigned worker ${
          selectedWorkerToAdd.label
        } to order #${jobId}`
      );
      setSelectedWorkerToAdd(null);
      await fetchAssignedWorkers(); // Оновлюємо список призначених (ця функція тепер стабільна завдяки useCallback)
    } catch (e) {
      setError(`Error assigning worker: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveWorker = async (workerId, workerName) => {
    // eslint-disable-next-line no-restricted-globals
    if (
      !confirm(`Are you sure you want to remove ${workerName} from this job?`)
    )
      return;

    setActionLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from("job_workers")
        .delete()
        .eq("job_id", jobId)
        .eq("worker_id", workerId);

      if (deleteError) throw deleteError;

      addActivity(
        `Admin ${
          user?.name || user?.id
        } removed worker ${workerName} from order #${jobId}`
      );
      await fetchAssignedWorkers(); // Оновлюємо список
    } catch (e) {
      setError(`Error removing worker: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const workerOptions = allWorkers
    .filter((aw) => !assignedWorkers.some((asw) => asw.id === aw.id))
    .map((w) => ({ value: w.id, label: w.name }));

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>
        Manage Assigned Workers for Order #{jobId}
      </h2>

      {user?.role === "admin" && (
        <div className={styles.addWorkerForm}>
          <Select
            options={workerOptions}
            value={selectedWorkerToAdd}
            onChange={(option) => setSelectedWorkerToAdd(option)}
            placeholder="Select a worker to assign..."
            isClearable
            className={styles.workerSelect}
            menuPortalTarget={document.body}
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            isLoading={initialLoading} // Показуємо індикатор завантаження в селекті, поки вантажаться всі працівники
          />
          <button
            onClick={handleAddWorker}
            disabled={actionLoading || initialLoading || !selectedWorkerToAdd} // Деактивуємо, поки йде початкове завантаження
            className={styles.actionButton}
          >
            {actionLoading ? "Assigning..." : "Assign Worker"}
          </button>
        </div>
      )}

      {initialLoading && (
        <p className={styles.loading}>Loading workers data…</p>
      )}
      {error && <p className={styles.error}>{error}</p>}

      {!initialLoading && !error && assignedWorkers.length === 0 && (
        <p className={styles.empty}>
          No workers currently assigned to this job.
        </p>
      )}

      {!initialLoading && !error && assignedWorkers.length > 0 && (
        <ul className={styles.list}>
          {assignedWorkers.map((w, idx) => (
            <li key={w.id} className={styles.item}>
              <span className={styles.index}>{idx + 1}</span>
              <Link to={`/workers/${w.id}`} className={styles.link}>
                <span className={styles.workerName}>{w.name}</span>
                <span className={styles.workerRole}>{w.role}</span>
              </Link>
              {user?.role === "admin" && (
                <button
                  onClick={() => handleRemoveWorker(w.id, w.name)}
                  disabled={actionLoading || initialLoading}
                  className={styles.removeButton}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
