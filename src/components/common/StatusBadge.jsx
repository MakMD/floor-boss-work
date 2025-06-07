import React from "react";
import styles from "./StatusBadge.module.css";

/**
 * Визначає текст та CSS-клас для статусу на основі станів worker та admin.
 * @param {string} workerStatus - Статус з боку працівника ('not_started', 'in_progress', 'done').
 * @param {string} adminStatus - Статус з боку адміністратора ('pending', 'approved', 'rejected').
 * @returns {{text: string, className: string}} - Об'єкт з текстом та класом для бейджа.
 */
const getStatusInfo = (workerStatus, adminStatus) => {
  if (adminStatus === "approved") {
    return { text: "Approved", className: styles.statusApproved };
  }
  if (adminStatus === "rejected") {
    return { text: "Rejected", className: styles.statusRejected };
  }
  if (workerStatus === "done") {
    return { text: "Pending Approval", className: styles.statusPending };
  }
  if (workerStatus === "in_progress") {
    return { text: "In Progress", className: styles.statusInProgress };
  }
  if (workerStatus === "not_started") {
    return { text: "Not Started", className: styles.statusNotStarted };
  }

  return { text: "Unknown", className: styles.statusUnknown };
};

/**
 * Універсальний компонент для відображення статусу замовлення.
 * @param {{
 * workerStatus: 'not_started' | 'in_progress' | 'done',
 * adminStatus: 'pending' | 'approved' | 'rejected'
 * }} props
 */
const StatusBadge = ({ workerStatus, adminStatus }) => {
  const { text, className } = getStatusInfo(workerStatus, adminStatus);

  return <span className={`${styles.statusBadge} ${className}`}>{text}</span>;
};

export default StatusBadge;
