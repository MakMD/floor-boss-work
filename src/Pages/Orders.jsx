import React from "react";
import Select from "react-select";
import { useOrderForm } from "../hooks/useOrderForm"; // <-- ІМПОРТ ХУКА
import styles from "./Orders.module.css";

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
      ? `0 0 0 3px var(--accent-focus-ring, rgba(59, 130, 246, 0.25))`
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
  const { formState, setters, handlers, data, uiState } = useOrderForm();

  const {
    address,
    date,
    sf,
    rate,
    client,
    notes,
    workOrderNumber,
    storageInfo,
    adminInstructions,
    selectedWorkers,
    selectedCompany,
    jobOrderPhotoPreview,
  } = formState;

  const {
    setAddress,
    setDate,
    setSf,
    setRate,
    setClient,
    setNotes,
    setWorkOrderNumber,
    setStorageInfo,
    setAdminInstructions,
    setSelectedWorkers,
    setSelectedCompany,
  } = setters;

  const { handleAddJob, handleJobOrderPhotoChange } = handlers;
  const { workerOptions, companyOptions } = data;
  const { loading, formSubmitting, error } = uiState;

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
