// src/Pages/Invoices.jsx
import React, { useState, useEffect, useContext, useCallback } from "react"; // <--- ВИПРАВЛЕНО: Додано useCallback
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import styles from "./Invoices.module.css";
import { AppContext } from "../components/App/App";
import { useToast } from "@chakra-ui/react";

export default function Invoices() {
  const { id: jobId } = useParams();
  const { user, addActivity } = useContext(AppContext);
  const toast = useToast();

  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [error, setError] = useState(null);

  const [editingInvoice, setEditingInvoice] = useState(null); // { id, invoice_date, amount }
  const [actionLoading, setActionLoading] = useState(false);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString.replace(/-/g, "/"));
    return date.toISOString().split("T")[0];
  };

  const fetchInvoices = useCallback(async () => {
    if (!jobId) return;
    setLoadingInvoices(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("invoices")
        .select("id, invoice_date, amount, created_at")
        .eq("job_id", jobId)
        .order("invoice_date", { ascending: true });

      if (fetchError) throw fetchError;
      setInvoices(data || []);
    } catch (e) {
      const errorMsg = `Failed to load invoices: ${e.message}`;
      setError(errorMsg);
      toast({
        title: "Error Loading Invoices",
        description: errorMsg,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
      setInvoices([]);
    }
    setLoadingInvoices(false);
  }, [jobId, toast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleEdit = (invoice) => {
    setEditingInvoice({
      ...invoice,
      invoice_date: formatDateForInput(invoice.invoice_date),
    });
  };

  const handleCancelEdit = () => {
    setEditingInvoice(null);
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    if (!editingInvoice || !editingInvoice.id) return;
    if (
      !editingInvoice.invoice_date ||
      isNaN(parseFloat(editingInvoice.amount)) ||
      parseFloat(editingInvoice.amount) <= 0
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please provide a valid date and a positive amount for the invoice.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }

    setActionLoading(true);
    try {
      const { data, error: updateError } = await supabase
        .from("invoices")
        .update({
          invoice_date: editingInvoice.invoice_date,
          amount: parseFloat(editingInvoice.amount),
        })
        .eq("id", editingInvoice.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: "Invoice Updated",
        description: `Invoice #${data.id} for order #${jobId} has been successfully updated.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      addActivity(
        `Admin ${user.name || user.id} updated invoice #${
          data.id
        } for order #${jobId} to amount $${data.amount} on ${data.invoice_date}`
      );
      setEditingInvoice(null);
      await fetchInvoices();
    } catch (err) {
      toast({
        title: "Error Updating Invoice",
        description: `Failed to update invoice: ${err.message}`,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (
      !window.confirm(
        `Are you sure you want to delete invoice #${invoiceId}? This action cannot be undone.`
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId);

      if (deleteError) throw deleteError;

      toast({
        title: "Invoice Deleted",
        description: `Invoice #${invoiceId} for order #${jobId} has been successfully deleted.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      addActivity(
        `Admin ${
          user.name || user.id
        } deleted invoice #${invoiceId} for order #${jobId}`
      );
      await fetchInvoices();
      if (editingInvoice && editingInvoice.id === invoiceId) {
        setEditingInvoice(null);
      }
    } catch (err) {
      toast({
        title: "Error Deleting Invoice",
        description: `Failed to delete invoice: ${err.message}`,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingInvoices) {
    return <p className={styles.loading}>Loading invoices...</p>;
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Invoices for Order #{jobId}</h2>

      {error && <p className={styles.error}>{error}</p>}

      {editingInvoice && user?.role === "admin" && (
        <form
          onSubmit={handleUpdateInvoice}
          className={`${styles.form} ${styles.editForm}`}
        >
          <h3>Edit Invoice #{editingInvoice.id}</h3>
          <input
            type="date"
            value={editingInvoice.invoice_date}
            onChange={(e) =>
              setEditingInvoice({
                ...editingInvoice,
                invoice_date: e.target.value,
              })
            }
            className={styles.input}
            required
            disabled={actionLoading}
          />
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={editingInvoice.amount}
            onChange={(e) =>
              setEditingInvoice({ ...editingInvoice, amount: e.target.value })
            }
            placeholder="Amount"
            className={styles.input}
            required
            disabled={actionLoading}
          />
          <div className={styles.editActions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className={styles.cancelButton}
              disabled={actionLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {invoices.length > 0 ? (
        <ul className={styles.list}>
          {invoices.map((inv) => (
            <li key={inv.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.date}>
                  Date:{" "}
                  {new Date(
                    inv.invoice_date.replace(/-/g, "/")
                  ).toLocaleDateString()}
                </span>
                <span className={styles.amount}>
                  Amount: ${parseFloat(inv.amount).toFixed(2)}
                </span>
              </div>
              {user?.role === "admin" && !editingInvoice && (
                <div className={styles.itemActions}>
                  <button
                    onClick={() => handleEdit(inv)}
                    className={styles.editBtn}
                    disabled={actionLoading}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteInvoice(inv.id)}
                    className={styles.deleteBtn}
                    disabled={actionLoading}
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !error && (
          <p className={styles.noResults}>No invoices found for this job.</p>
        )
      )}
    </div>
  );
}
