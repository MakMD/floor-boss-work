// src/Pages/Orders.jsx
import React, { useState, useEffect, useContext } from "react";
import Select from "react-select";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import styles from "./Orders.module.css";
import { useToast } from "@chakra-ui/react";
// import { Briefcase, Settings, FileText, Paperclip, Users, Info, DollarSign, CalendarDays, MapPin } from 'lucide-react';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "var(--bg-input, #fff)",
    borderColor: state.isFocused
      ? "var(--accent, #3b82f6)"
      : "var(--border-light, #e2e8f0)",
    borderRadius: "6px",
    padding: "0.27rem 0.3rem",
    minHeight: "calc(0.65rem * 2 + 0.9rem * 1.5 + 2px)",
    boxShadow: state.isFocused
      ? `0 0 0 3px var(--accent-focus-ring, rgba(59, 130, 246, 0.2))`
      : "none",
    "&:hover": {
      borderColor: state.isFocused
        ? "var(--accent, #3b82f6)"
        : "var(--border-medium, #ced4da)",
    },
    fontSize: "0.95rem",
    color: "var(--text-dark, #1f2937)",
  }),
  input: (provided) => ({
    ...provided,
    color: "var(--text-dark, #1f2937)",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "var(--bg-white, #fff)",
    borderRadius: "6px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    zIndex: 10000,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "var(--accent, #3b82f6)"
      : state.isFocused
      ? "var(--surface-hover, #f1f5f9)"
      : "var(--bg-white, #fff)",
    color: state.isSelected ? "white" : "var(--text-dark, #1f2937)",
    "&:active": {
      backgroundColor: "var(--accent-dark, #2563eb)",
    },
    fontSize: "0.9rem",
    padding: "0.6rem 0.9rem",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "var(--text-dark, #1f2937)",
    fontSize: "0.95rem",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "var(--fg-muted, #6b7280)",
    fontSize: "0.95rem",
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "var(--accent-bg-light, #e0e7ff)",
    borderRadius: "4px",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "var(--accent-dark, #3730a3)",
    fontWeight: "500",
    fontSize: "0.85rem",
    paddingLeft: "0.5rem",
    paddingRight: "0.3rem",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "var(--accent-dark, #3730a3)",
    "&:hover": {
      backgroundColor: "var(--accent-hover-light, #c7d2fe)",
      color: "var(--accent-dark, #3730a3)",
    },
  }),
};

export default function Orders() {
  // <--- ПЕРЕКОНАЙТЕСЯ, ЩО 'export default' ТУТ ПРИСУТНІЙ
  const { user, addActivity } = useContext(AppContext);
  const toast = useToast();

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

  const [loading, setLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
        setError(errorMsg);
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
  }, [toast]);

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
      setError(errorMsg);
      toast({
        title: "Validation Error",
        description: errorMsg,
        status: "warning",
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
          }
        } else {
          invoiceCreationMessage = ` Auto-invoice not generated (invalid SF/Rate).`;
        }
      }

      if (selectedWorkers.length > 0 && newJob) {
        const relations = selectedWorkers.map((workerOption) => ({
          job_id: newJob.id,
          worker_id: workerOption.value,
        }));
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

      const creationLogMessage = `User ${
        user.name || user.email || user.id
      } created new order #${newJob.id}: ${address}.`;
      // Перевіряємо, чи addActivity - функція, перед її викликом (якщо ви вирішили її не передавати з AppContext)
      if (typeof addActivity === "function") {
        addActivity({
          message: `${creationLogMessage}${
            invoiceCreationMessage
              ? invoiceCreationMessage
              : " No invoice generated."
          }`,
          jobId: newJob.id,
          details: {
            address: newJob.address,
            client: newJob.client,
            invoice_info: invoiceCreationMessage || "Not applicable",
          },
        });
      }
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

  return (
    <div className={styles.newOrdersPageWrapper}>
      <h1 className={styles.mainTitle}>Create New Order</h1>

      {loading && (
        <p className={styles.loadingMessage}>
          Loading initial data for selects...
        </p>
      )}
      {error && !loading && !formSubmitting && (
        <p className={styles.errorMessage}>{error}</p>
      )}

      <form onSubmit={handleAddJob} className={styles.newOrderForm}>
        <section className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Primary Order Information</h2>
          <div className={styles.fieldsGrid}>
            <div className={styles.formField}>
              <label htmlFor="address" className={styles.formLabel}>
                Address*
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className={styles.formInput}
                disabled={formSubmitting}
              />
            </div>
            <div className={styles.formField}>
              <label htmlFor="date" className={styles.formLabel}>
                Date*
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={styles.formInput}
                disabled={formSubmitting}
              />
            </div>
            <div className={styles.formField}>
              <label htmlFor="client" className={styles.formLabel}>
                Builder (Client)
              </label>
              <input
                id="client"
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className={styles.formInput}
                disabled={formSubmitting}
              />
            </div>
            <div className={styles.formField}>
              <label htmlFor="workOrderNumber" className={styles.formLabel}>
                Work Order #
              </label>
              <input
                id="workOrderNumber"
                type="text"
                value={workOrderNumber}
                onChange={(e) => setWorkOrderNumber(e.target.value)}
                className={styles.formInput}
                disabled={formSubmitting}
              />
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Job Details & Assignment</h2>
          <div className={styles.fieldsGrid}>
            <div className={styles.formField}>
              <label htmlFor="sf" className={styles.formLabel}>
                Square Footage
              </label>
              <input
                id="sf"
                type="number"
                value={sf}
                onChange={(e) => setSf(e.target.value)}
                className={styles.formInput}
                step="any"
                disabled={formSubmitting}
              />
            </div>
            <div className={styles.formField}>
              <label htmlFor="rate" className={styles.formLabel}>
                Rate
              </label>
              <input
                id="rate"
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className={styles.formInput}
                step="any"
                disabled={formSubmitting}
              />
            </div>
            <div className={styles.formField}>
              <label htmlFor="company" className={styles.formLabel}>
                Company
              </label>
              <Select
                id="company"
                options={companyOptions}
                value={selectedCompany}
                onChange={setSelectedCompany}
                placeholder="Select Company..."
                isClearable
                isLoading={loading}
                isDisabled={formSubmitting}
                styles={customSelectStyles}
                menuPosition="fixed"
              />
            </div>
            <div className={styles.formField}>
              <label htmlFor="workers" className={styles.formLabel}>
                Assign Workers
              </label>
              <Select
                id="workers"
                isMulti
                options={workerOptions}
                value={selectedWorkers}
                onChange={(opts) => setSelectedWorkers(opts || [])}
                placeholder="Select workers..."
                isLoading={loading}
                isDisabled={formSubmitting}
                styles={customSelectStyles}
                menuPosition="fixed"
              />
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Additional Notes & Files</h2>
          <div className={styles.fieldsGridOneCol}>
            <div className={styles.formField}>
              <label htmlFor="storageInfo" className={styles.formLabel}>
                Storage Info
              </label>
              <textarea
                id="storageInfo"
                value={storageInfo}
                onChange={(e) => setStorageInfo(e.target.value)}
                className={styles.formTextarea}
                rows="3"
                disabled={formSubmitting}
              ></textarea>
            </div>
            <div className={styles.formField}>
              <label htmlFor="adminInstructions" className={styles.formLabel}>
                Admin Instructions
              </label>
              <textarea
                id="adminInstructions"
                value={adminInstructions}
                onChange={(e) => setAdminInstructions(e.target.value)}
                className={styles.formTextarea}
                rows="3"
                disabled={formSubmitting}
              ></textarea>
            </div>
            <div className={styles.formField}>
              <label htmlFor="notes" className={styles.formLabel}>
                General Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.formTextarea}
                rows="3"
                disabled={formSubmitting}
              ></textarea>
            </div>
            <div className={styles.formField}>
              <label htmlFor="jobOrderPhoto" className={styles.formLabel}>
                Job Order Photo
              </label>
              <input
                id="jobOrderPhoto"
                type="file"
                accept="image/*"
                onChange={handleJobOrderPhotoChange}
                className={styles.fileInput}
                disabled={formSubmitting}
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
          </div>
        </section>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={formSubmitting || loading}
          >
            {formSubmitting ? "Creating Order…" : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
