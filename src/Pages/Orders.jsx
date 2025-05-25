// src/Pages/Orders.jsx
import React, { useState, useEffect, useContext } from "react";
import Select from "react-select";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./Orders.module.css";
import { useToast } from "@chakra-ui/react"; // <--- НОВИЙ ІМПОРТ

export default function Orders() {
  const { user, addActivity } = useContext(AppContext);
  const toast = useToast(); // <--- ІНІЦІАЛІЗАЦІЯ TOAST

  const [workers, setWorkers] = useState([]);
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sf, setSf] = useState("");
  const [rate, setRate] = useState("");
  const [client, setClient] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [storageInfo, setStorageInfo] = useState("");
  const [adminInstructions, setAdminInstructions] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [jobOrderPhotoFile, setJobOrderPhotoFile] = useState(null);
  const [jobOrderPhotoPreview, setJobOrderPhotoPreview] = useState(null);

  const [loading, setLoading] = useState(false); // Загальне завантаження даних (worker, companies)
  const [formSubmitting, setFormSubmitting] = useState(false); // Для процесу відправки форми
  const [error, setError] = useState(null); // Для відображення помилок під формою, якщо потрібно

  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [workersRes, companiesRes] = await Promise.all([
          supabase
            .from("workers")
            .select("id, name")
            .order("name", { ascending: true }),
          supabase
            .from("companies")
            .select("id, name")
            .order("name", { ascending: true }),
        ]);

        if (workersRes.error) throw workersRes.error;
        setWorkers(workersRes.data || []);

        if (companiesRes.error) throw companiesRes.error;
        setCompanies(companiesRes.data || []);
      } catch (err) {
        const errorMsg = `Failed to load initial data: ${err.message}`;
        setError(errorMsg); // Встановлюємо помилку для можливого відображення під формою
        toast({
          title: "Error Loading Data",
          description: errorMsg,
          status: "error",
          duration: 7000,
          isClosable: true,
          position: "top-right",
        });
        setWorkers([]);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]); // Додаємо toast до залежностей, хоча він стабільний, але для повноти

  const handleJobOrderPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setJobOrderPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setJobOrderPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setJobOrderPhotoFile(null);
      setJobOrderPhotoPreview(null);
    }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!address.trim() || !date) {
      const errorMsg = "Address and Date are required.";
      setError(errorMsg); // Залишаємо для можливого локального відображення помилки
      toast({
        title: "Validation Error",
        description: errorMsg,
        status: "warning", // 'warning' для помилок валідації
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }

    setError(null);
    setFormSubmitting(true);
    try {
      if (!user || typeof user.id !== "string" || !uuidRegex.test(user.id)) {
        const errorMsg = "User ID is invalid. Cannot create job.";
        setError(errorMsg);
        toast({
          title: "Authentication Error",
          description: errorMsg,
          status: "error",
          duration: 7000,
          isClosable: true,
          position: "top-right",
        });
        setFormSubmitting(false);
        return;
      }

      let jobOrderPhotoUrl = null;
      if (jobOrderPhotoFile) {
        const fileExt = jobOrderPhotoFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.${fileExt}`;
        const filePath = `job-order-specific/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("job-order-photos")
          .upload(filePath, jobOrderPhotoFile);

        if (uploadError)
          throw new Error(
            `Failed to upload job order photo: ${uploadError.message}`
          );
        const { data: urlData } = supabase.storage
          .from("job-order-photos")
          .getPublicUrl(filePath);
        jobOrderPhotoUrl = urlData.publicUrl;
      }

      const jobData = {
        address,
        date,
        sf: sf ? Number(sf) : null,
        rate: rate ? Number(rate) : null,
        client,
        notes,
        created_by: user.id,
        work_order_number: workOrderNumber || null,
        storage_info: storageInfo || null,
        admin_instructions: adminInstructions || null,
        company_id: selectedCompany ? selectedCompany.value : null,
        job_order_photo_url: jobOrderPhotoUrl,
      };

      const { data: newJob, error: insertError } = await supabase
        .from("jobs")
        .insert([jobData])
        .select()
        .single();
      if (insertError) throw insertError;

      let invoiceCreationMessage = "";
      if (newJob && newJob.id) {
        const sfValue = parseFloat(newJob.sf);
        const rateValue = parseFloat(newJob.rate);

        if (
          !isNaN(sfValue) &&
          !isNaN(rateValue) &&
          sfValue > 0 &&
          rateValue > 0
        ) {
          const calculatedInvoiceAmount = sfValue * rateValue;
          const currentDateForInvoice = new Date().toISOString().slice(0, 10);

          const { error: invoiceInsertError } = await supabase
            .from("invoices")
            .insert([
              {
                job_id: newJob.id,
                invoice_date: currentDateForInvoice,
                amount: calculatedInvoiceAmount,
              },
            ]);

          if (invoiceInsertError) {
            console.error(
              "Failed to create automatic invoice:",
              invoiceInsertError.message
            );
            invoiceCreationMessage = ` Auto-invoice creation failed.`;
            addActivity(
              `Order #${newJob.id} created. Auto-invoice creation failed: ${invoiceInsertError.message}`
            );
            toast({
              title: "Invoice Warning",
              description: `Order #${newJob.id} created, but auto-invoice creation failed: ${invoiceInsertError.message}`,
              status: "warning",
              duration: 7000,
              isClosable: true,
              position: "top-right",
            });
          } else {
            invoiceCreationMessage = ` Auto-invoice for $${calculatedInvoiceAmount.toFixed(
              2
            )} generated.`;
            addActivity(
              `Order #${
                newJob.id
              } created. Auto-invoice for $${calculatedInvoiceAmount.toFixed(
                2
              )} generated.`
            );
          }
        } else {
          invoiceCreationMessage = ` Auto-invoice not generated (invalid SF/Rate).`;
          addActivity(
            `Order #${newJob.id} created. Auto-invoice not generated (invalid sf/rate).`
          );
        }
      }

      if (selectedWorkers.length > 0 && newJob) {
        const relations = selectedWorkers.map((workerOption) => {
          if (
            !workerOption ||
            typeof workerOption.value !== "string" ||
            !uuidRegex.test(workerOption.value)
          ) {
            throw new Error(
              `Invalid worker ID found: ${
                workerOption?.value || "undefined"
              }. Cannot assign worker.`
            );
          }
          return {
            job_id: newJob.id,
            worker_id: workerOption.value,
          };
        });
        const { error: relError } = await supabase
          .from("job_workers")
          .insert(relations);
        if (relError) throw relError;
      }

      setAddress("");
      setDate(new Date().toISOString().slice(0, 10));
      setSf("");
      setRate("");
      setClient("");
      setNotes("");
      setSelectedWorkers([]);
      setWorkOrderNumber("");
      setStorageInfo("");
      setAdminInstructions("");
      setSelectedCompany(null);
      setJobOrderPhotoFile(null);
      setJobOrderPhotoPreview(null);

      toast({
        title: "Order Created",
        description: `Job #${newJob.id} added successfully.${invoiceCreationMessage}`,
        status: "success",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
      addActivity(
        `User ${user.name || user.id} created new order #${
          newJob.id
        }: ${address}.${invoiceCreationMessage}`
      );
    } catch (err) {
      console.error("Error in handleAddJob:", err);
      const errorMsg =
        err.message || "An unexpected error occurred while creating the order.";
      setError(errorMsg);
      toast({
        title: "Error Creating Order",
        description: errorMsg,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const workerOptions = workers.map((w) => ({ value: w.id, label: w.name }));
  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  if (loading) {
    // Показуємо завантаження, поки вантажаться працівники/компанії
    return <div className={styles.loading}>Loading initial data...</div>;
  }

  return (
    <div className={styles.homePage}>
      <h1 className={styles.title}>Create New Order</h1>
      {error && !formSubmitting && <p className={styles.error}>{error}</p>}{" "}
      {/* Помилка завантаження даних */}
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
          placeholder="Square Footage (Optional)"
          value={sf}
          onChange={(e) => setSf(e.target.value)}
          className={styles.formInput}
          step="any"
        />
        <input
          type="number"
          placeholder="Rate (Optional)"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className={styles.formInput}
          step="any"
        />
        <input
          type="text"
          placeholder="Builder (Optional)"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className={styles.formInput}
        />
        <input
          type="text"
          placeholder="Work Order # (Optional)"
          value={workOrderNumber}
          onChange={(e) => setWorkOrderNumber(e.target.value)}
          className={styles.formInput}
        />
        <textarea
          placeholder="Storage Info (Optional)"
          value={storageInfo}
          onChange={(e) => setStorageInfo(e.target.value)}
          className={styles.formTextarea}
        />
        <textarea
          placeholder="Admin Instructions (Optional)"
          value={adminInstructions}
          onChange={(e) => setAdminInstructions(e.target.value)}
          className={styles.formTextarea}
        />
        <div>
          <label htmlFor="jobOrderPhoto" className={styles.formLabel}>
            Job Order Photo (Optional):
          </label>
          <input
            type="file"
            id="jobOrderPhoto"
            accept="image/*"
            onChange={handleJobOrderPhotoChange}
            className={styles.fileInput}
          />
          {jobOrderPhotoPreview && (
            <div className={styles.previewContainer}>
              <img
                src={jobOrderPhotoPreview}
                alt="Job Order Preview"
                className={styles.previewImg}
              />
            </div>
          )}
        </div>
        <textarea
          placeholder="Notes (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={styles.formTextarea}
        />
        <div className={styles.selectWrapper}>
          <Select
            options={companyOptions}
            value={selectedCompany}
            onChange={(selectedOption) => setSelectedCompany(selectedOption)}
            placeholder="Select Company (Optional)"
            isClearable
            isLoading={loading}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: 40,
                fontSize: "0.9rem",
              }),
              menu: (base) => ({ ...base, width: "100%", zIndex: 9998 }),
              menuList: (base) => ({
                ...base,
                maxHeight: "50vh",
                overflowY: "auto",
              }),
              menuPortal: (base) => ({ ...base, zIndex: 9998 }),
            }}
          />
        </div>
        <div className={styles.selectWrapper}>
          <Select
            isMulti
            options={workerOptions}
            value={selectedWorkers}
            onChange={(selectedOptions) =>
              setSelectedWorkers(selectedOptions || [])
            }
            placeholder="Select workers (Optional)"
            isLoading={loading}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: 40,
                fontSize: "0.9rem",
              }),
              menu: (base) => ({ ...base, width: "100%", zIndex: 9999 }),
              menuList: (base) => ({
                ...base,
                maxHeight: "50vh",
                overflowY: "auto",
              }),
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        </div>
        <button
          type="submit"
          className={styles.formButton}
          disabled={formSubmitting || loading} // Також деактивуємо, якщо йде завантаження початкових даних
        >
          {formSubmitting ? "Adding Job…" : "Add Job"}
        </button>
      </form>
    </div>
  );
}
