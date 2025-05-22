// src/Pages/Orders.jsx
import React, { useState, useEffect, useContext } from "react";
import Select from "react-select";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./Orders.module.css";

export default function Orders() {
  const { user } = useContext(AppContext);

  // Завантажені дані
  const [workers, setWorkers] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Поля форми
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rate, setRate] = useState("");
  const [builder, setBuilder] = useState("");
  const [notes, setNotes] = useState("");
  const [storageUrl, setStorageUrl] = useState("");
  const [workOrderNum, setWorkOrderNum] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Підвантажуємо список працівників і компаній
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let { data: wData, error: wErr } = await supabase
          .from("workers")
          .select("id, name")
          .eq("role", "worker")
          .order("name", { ascending: true });
        if (wErr) throw wErr;
        setWorkers(wData);

        let { data: cData, error: cErr } = await supabase
          .from("companies")
          .select("id, name")
          .order("name", { ascending: true });
        if (cErr) throw cErr;
        setCompanies(cData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Вставка нового замовлення
  const handleAddJob = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1) Створюємо job
      const { data: newJob, error: insertError } = await supabase
        .from("jobs")
        .insert([
          {
            address,
            date,
            rate: rate ? Number(rate) : null,
            client: builder,
            notes: notes || null,
            storage_url: storageUrl || null,
            work_order_number: workOrderNum || null,
            company_id: selectedCompany?.value || null,
          },
        ])
        .select()
        .single();
      if (insertError) throw insertError;

      // 2) Додаємо зв’язки у job_workers (за наявності)
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
      setRate("");
      setBuilder("");
      setNotes("");
      setStorageUrl("");
      setWorkOrderNum("");
      setSelectedWorkers([]);
      setSelectedCompany(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const workerOptions = workers.map((w) => ({
    value: w.id,
    label: w.name,
  }));
  const companyOptions = companies.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Add New Order</h2>
      <form onSubmit={handleAddJob} className={styles.form}>
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={styles.input}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles.input}
        />

        <input
          type="number"
          placeholder="Rate"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className={styles.input}
        />

        <input
          type="text"
          placeholder="Builder"
          value={builder}
          onChange={(e) => setBuilder(e.target.value)}
          className={styles.input}
        />

        <input
          type="text"
          placeholder="Work Order #"
          value={workOrderNum}
          onChange={(e) => setWorkOrderNum(e.target.value)}
          className={styles.input}
        />

        <input
          type="text"
          placeholder="Storage URL"
          value={storageUrl}
          onChange={(e) => setStorageUrl(e.target.value)}
          className={styles.input}
        />

        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={styles.textarea}
        />

        <Select
          options={companyOptions}
          value={selectedCompany}
          onChange={setSelectedCompany}
          placeholder="Select company..."
          isClearable
          className={styles.select}
        />

        <Select
          isMulti
          options={workerOptions}
          value={workerOptions.filter((o) => selectedWorkers.includes(o.value))}
          onChange={(sel) =>
            setSelectedWorkers(sel ? sel.map((s) => s.value) : [])
          }
          placeholder="Select workers..."
          className={styles.select}
          menuPortalTarget={document.body}
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          }}
        />

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Saving…" : "Add Order"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
