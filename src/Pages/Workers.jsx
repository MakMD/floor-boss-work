import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useToast } from "@chakra-ui/react";
import styles from "./Workers.module.css";
import {
  Users,
  UserCog,
  ChevronRight,
  ServerCrash,
  SearchX,
  UserPlus,
  X,
} from "lucide-react";

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: "",
    role: "worker",
    email: "",
    password: "",
  });

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("workers")
        .select("id, name, role")
        .order("name", { ascending: true });
      if (fetchError) throw fetchError;
      setWorkers(data || []);
    } catch (e) {
      setError(e.message);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewWorker((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNewWorker = async (e) => {
    e.preventDefault();
    if (
      !newWorker.email ||
      !newWorker.password ||
      !newWorker.name ||
      !newWorker.role
    ) {
      toast({
        title: "Validation Error",
        description: "All fields are required.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newWorker.email,
        password: newWorker.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User was not created in Auth.");

      const { error: profileError } = await supabase.from("workers").upsert(
        {
          id: authData.user.id,
          name: newWorker.name,
          role: newWorker.role,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      toast({
        title: "Worker Created",
        description: `Worker ${newWorker.name} has been successfully created.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setNewWorker({ name: "", role: "worker", email: "", password: "" });
      setIsFormVisible(false);
      await fetchWorkers();
    } catch (err) {
      toast({
        title: "Error Creating Worker",
        description: err.message,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`${styles.workersPage} ${styles.centeredStatus}`}>
        <p className={styles.loadingText}>Loading workers…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.workersPage} ${styles.centeredStatus}`}>
        <ServerCrash size={48} className={styles.errorIcon} />
        <p className={styles.errorText}>Error loading workers: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.workersPage}>
      <header className={styles.pageHeader}>
        <div className={styles.headerTitleGroup}>
          <Users size={32} className={styles.headerIcon} />
          <h1 className={styles.mainTitle}>Workers List</h1>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.addWorkerButton} ${
              isFormVisible ? styles.addWorkerButtonActive : ""
            }`}
            onClick={() => setIsFormVisible((prev) => !prev)}
          >
            {isFormVisible ? <X size={16} /> : <UserPlus size={16} />}
            <span>{isFormVisible ? "Cancel" : "Add New Worker"}</span>
          </button>
        </div>
      </header>

      <div
        className={`${styles.formContainer} ${
          isFormVisible ? styles.formContainerVisible : ""
        }`}
      >
        <form onSubmit={handleAddNewWorker} className={styles.addWorkerForm}>
          <h2 className={styles.formTitle}>Create New Worker Profile</h2>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={newWorker.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.formField}>
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={newWorker.role}
                onChange={handleInputChange}
                required
              >
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label htmlFor="email">Email (for login)</label>
              <input
                id="email"
                name="email"
                type="email"
                value={newWorker.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.formField}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={newWorker.password}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className={styles.submitWorkerButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Worker"}
          </button>
        </form>
      </div>

      {workers.length === 0 && !isFormVisible && (
        <div className={`${styles.centeredStatus} ${styles.emptyState}`}>
          <SearchX size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>No workers found.</p>
        </div>
      )}

      {workers.length > 0 && (
        <ul className={styles.workerList}>
          {workers.map((w) => (
            <li key={w.id} className={styles.workerItemCard}>
              <div className={styles.workerInfo}>
                <div className={styles.avatarPlaceholder}>
                  {w.name ? w.name.charAt(0).toUpperCase() : "?"}
                </div>
                <div className={styles.nameAndRole}>
                  <span className={styles.workerName}>{w.name || "N/A"}</span>
                  <span className={styles.workerRole}>
                    <UserCog size={14} className={styles.roleIcon} />
                    {w.role || "No role assigned"}
                  </span>
                </div>
              </div>
              <Link
                to={`/workers/${w.id}`}
                className={styles.profileLinkButton}
                aria-label={`View profile of ${w.name}`}
              >
                View Profile
                <ChevronRight size={18} className={styles.profileLinkIcon} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
