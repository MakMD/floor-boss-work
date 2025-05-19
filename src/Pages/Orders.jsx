// src/Pages/Orders.jsx
import React, { useState, useEffect, useContext } from "react";
import Select from "react-select";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./Orders.module.css";

export default function Orders() {
  const { user } = useContext(AppContext);

  const [workers, setWorkers] = useState([]);
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sf, setSf] = useState("");
  const [rate, setRate] = useState("");
  const [client, setClient] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Завантажуємо працівників
  useEffect(() => {
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("workers")
          .select("id, name")
          .eq("role", "worker")
          .order("name", { ascending: true });
        if (error) throw error;
        setWorkers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Додаємо нове замовлення
  const handleAddJob = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1) Створюємо job
      const { data: newJob, error: insertError } = await supabase
        .from("jobs")
        .insert([
          { address, date, sf: Number(sf), rate: Number(rate), client, notes },
        ])
        .select()
        .single();
      if (insertError) throw insertError;

      // 2) Додаємо зв’язки у job_workers
      if (selectedWorkers.length) {
        const relations = selectedWorkers.map((wid) => ({
          job_id: newJob.id,
          worker_id: wid,
        }));
        const { error: relError } = await supabase
          .from("job_workers")
          .insert(relations);
        if (relError) throw relError;
      }

      // 3) Очищаємо форму
      setAddress("");
      setDate(new Date().toISOString().slice(0, 10));
      setSf("");
      setRate("");
      setClient("");
      setNotes("");
      setSelectedWorkers([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const workerOptions = workers.map((w) => ({ value: w.id, label: w.name }));

  return (
    <div className={styles.homePage}>
      <form onSubmit={handleAddJob} className={styles.addForm}>
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className={styles.formInput}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className={styles.formInput}
        />
        <input
          type="number"
          placeholder="Square Footage"
          value={sf}
          onChange={(e) => setSf(e.target.value)}
          required
          className={styles.formInput}
        />
        <input
          type="number"
          placeholder="Rate"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          required
          className={styles.formInput}
        />
        <input
          type="text"
          placeholder="Client"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className={styles.formInput}
        />
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={styles.formTextarea}
        />

        {/* Обертка для розширеного Select */}
        <div className={styles.selectWrapper}>
          <Select
            isMulti
            options={workerOptions}
            value={workerOptions.filter((opt) =>
              selectedWorkers.includes(opt.value)
            )}
            onChange={(sel) =>
              setSelectedWorkers(sel ? sel.map((s) => s.value) : [])
            }
            placeholder="Select workers..."
            menuPortalTarget={document.body} // порталуємо в body
            menuPosition="fixed" // фіксоване позиціонування
            styles={{
              control: (base) => ({
                ...base,
                minHeight: 40,
                fontSize: "0.9rem",
              }),
              menu: (base) => ({
                ...base,
                width: "100%",
                zIndex: 9999,
              }),
              menuList: (base) => ({
                ...base,
                maxHeight: "50vh",
                overflowY: "auto",
              }),
              menuPortal: (base) => ({
                ...base,
                zIndex: 9999,
              }),
            }}
          />
        </div>

        <button type="submit" className={styles.formButton} disabled={loading}>
          {loading ? "Adding…" : "Add Job"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
