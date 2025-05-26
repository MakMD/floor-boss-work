// src/Pages/JobDetails.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  useParams,
  useNavigate,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import styles from "./JobDetails.module.css";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";
import { useToast } from "@chakra-ui/react";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  UserCircle,
  FileText,
  Info as InfoIcon, // Перейменовано Info на InfoIcon для уникнення конфлікту
  Settings,
  DollarSign,
  Users,
  Image as ImageIcon,
  Edit3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PlayCircle,
  StopCircle,
  MapPin as MapPinIcon, // Додано MapPinIcon та перейменовано Info
} from "lucide-react";

export default function JobDetails() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { user, addActivity } = useContext(AppContext);
  const location = useLocation();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateField = async (field, value) => {
    setActionLoading(true);
    setError(null);

    try {
      const { error: jobErr } = await supabase
        .from("jobs")
        .update({ [field]: value })
        .eq("id", jobId);

      if (jobErr) throw jobErr;

      const currentJobState = job;
      setJob((prevJob) => ({
        ...prevJob,
        ...(field === "worker_status" ? { workerStatus: value } : {}),
        ...(field === "admin_status" ? { adminStatus: value } : {}),
      }));

      toast({
        title: "Status Updated",
        description: `${
          field === "worker_status" ? "Worker" : "Admin"
        } status changed to "${value}".`,
        status: "success",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });

      const actor = user?.name || user?.email || `User ID: ${user?.id}`;
      const statusType =
        field === "worker_status" ? "Worker status" : "Admin status";
      const activityMessage = `${actor} set ${statusType.toLowerCase()} to "${value}" for order #${jobId}`;

      if (typeof addActivity === "function") {
        addActivity({
          message: activityMessage,
          jobId: jobId,
          details: {
            fieldUpdated: field,
            newValue: value,
            previousStatus:
              currentJobState[
                field === "worker_status" ? "workerStatus" : "adminStatus"
              ],
          },
        });
      }

      if (field === "worker_status" && value === "in_progress" && user?.id) {
        const startWorkMessage = `Worker ${actor} started order #${jobId}`;
        const { error: updErr } = await supabase.from("job_updates").insert([
          {
            job_id: jobId,
            worker_id: user.id,
            message: startWorkMessage,
          },
        ]);
        if (updErr) {
          console.error("Failed to add job_update for starting work:", updErr);
          toast({
            title: "Activity Log Warning",
            description:
              "Could not log work start to job_updates, but status was updated.",
            status: "warning",
            duration: 5000,
            isClosable: true,
            position: "top-right",
          });
        } else {
          if (typeof addActivity === "function") {
            addActivity({
              message: startWorkMessage,
              jobId: jobId,
              details: { action: "work_started_in_job_updates" },
            });
          }
        }
      }
    } catch (jobErr) {
      const errorMsg = `Failed to update status: ${jobErr.message}`;
      setError(errorMsg);
      toast({
        title: "Error Updating Status",
        description: errorMsg,
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;
      setLoading(true);
      setError(null);
      setCompanyName("");
      try {
        const { data, error: fetchErr } = await supabase
          .from("jobs")
          .select(
            `*, company_id, work_order_number, storage_info, admin_instructions, job_order_photo_url`
          )
          .eq("id", jobId)
          .single();

        if (fetchErr) throw fetchErr;

        if (data) {
          setJob({
            ...data,
            workerStatus: data.worker_status || "not_started",
            adminStatus: data.admin_status || "pending",
          });

          if (data.company_id) {
            const { data: companyData, error: companyError } = await supabase
              .from("companies")
              .select("name")
              .eq("id", data.company_id)
              .single();
            if (companyError) {
              console.error(
                "Error fetching company name:",
                companyError.message
              );
            } else if (companyData) {
              setCompanyName(companyData.name);
            }
          }
        } else {
          setError("Job not found.");
        }
      } catch (err) {
        const errorMsg = `Failed to load job details: ${err.message}`;
        setError(errorMsg);
        toast({
          title: "Error Loading Job Details",
          description: errorMsg,
          status: "error",
          duration: 7000,
          isClosable: true,
          position: "top-right",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [jobId, toast]);

  if (loading && !job)
    return <div className={styles.loading}>Loading job details...</div>;
  if (error && !job)
    return <div className={styles.errorMsg}>Error: {error}</div>;
  if (!job && !loading)
    return <div className={styles.errorMsg}>Job not found.</div>;

  const tabs = [
    {
      path: "photos-after",
      label: "After Photos",
      icon: <ImageIcon size={16} />,
    },
    ...(user?.role === "admin"
      ? [
          {
            path: "job-order-photo",
            label: "Job Order Photo",
            icon: <FileText size={16} />,
          },
        ]
      : []),
    { path: "worker-notes", label: "Worker Notes", icon: <Edit3 size={16} /> },
    ...(user?.role === "admin"
      ? [{ path: "workers", label: "Workers", icon: <Users size={16} /> }]
      : []),
    { path: "invoices", label: "Invoices", icon: <DollarSign size={16} /> },
    { path: "materials", label: "Materials", icon: <Briefcase size={16} /> }, // <--- ВИПРАВЛЕНО НА Briefcase
  ];

  const defaultActiveTabPath = "photos-after";

  return (
    <div className={styles.jobDetails}>
      <div className={styles.headerSection}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          disabled={actionLoading}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className={styles.title}>Order #{job.id}</h1>
      </div>

      <div className={styles.mainContentWrapper}>
        <div className={styles.jobInfoBlock}>
          <p className={styles.detail}>
            <MapPinIcon size={18} className={styles.icon} />
            <strong>Address:</strong> {job.address || "N/A"}
          </p>
          <p className={styles.detail}>
            <UserCircle size={18} className={styles.icon} />
            <strong>Builder:</strong> {job.client || "N/A"}
          </p>
          {job.date && (
            <p className={styles.detail}>
              <CalendarDays size={18} className={styles.icon} />
              <strong>Date:</strong>{" "}
              {new Date(job.date.replace(/-/g, "/")).toLocaleDateString()}
            </p>
          )}
          {job.work_order_number && (
            <p className={styles.detail}>
              <Briefcase size={18} className={styles.icon} />
              <strong>Work Order #:</strong> {job.work_order_number}
            </p> // <--- ВИПРАВЛЕНО НА Briefcase
          )}
          {companyName && (
            <p className={styles.detail}>
              <Users size={18} className={styles.icon} />
              <strong>Company:</strong> {companyName}
            </p>
          )}
          {job.storage_info && (
            <p className={styles.detail}>
              <InfoIcon size={18} className={styles.icon} />
              <strong>Storage Info:</strong> {job.storage_info}
            </p>
          )}
          {job.admin_instructions &&
            (user?.role === "admin" || user?.role === "worker") && (
              <div className={styles.instructionsBlock}>
                <strong>Admin Instructions:</strong>
                <p className={styles.instructionText}>
                  {job.admin_instructions}
                </p>
              </div>
            )}
        </div>

        {job && (
          <div className={styles.statusContainer}>
            <div className={styles.statusGroup}>
              <span className={styles.statusGroupTitle}>Worker Status</span>
              <div
                className={`${styles.badge} ${
                  job.workerStatus === "not_started"
                    ? styles.badgeNotStarted
                    : job.workerStatus === "in_progress"
                    ? styles.badgeInProgress
                    : styles.badgeDoneGrey
                }`}
              >
                {job.workerStatus === "not_started"
                  ? "Not Started"
                  : job.workerStatus === "in_progress"
                  ? "In Progress"
                  : "Work Done"}
              </div>
              <div className={styles.statusActions}>
                {user.role === "worker" &&
                  job.workerStatus === "not_started" && (
                    <button
                      className={styles.actionBtn}
                      onClick={() =>
                        updateField("worker_status", "in_progress")
                      }
                      disabled={actionLoading || loading}
                    >
                      <PlayCircle size={16} /> Start Work
                    </button>
                  )}
                {user.role === "worker" &&
                  job.workerStatus === "in_progress" && (
                    <button
                      className={styles.actionBtn}
                      onClick={() => updateField("worker_status", "done")}
                      disabled={actionLoading || loading}
                    >
                      <StopCircle size={16} /> Finish Work
                    </button>
                  )}
              </div>
            </div>

            {user.role === "admin" && (
              <div className={styles.statusGroup}>
                <span className={styles.statusGroupTitle}>Admin Status</span>
                <div
                  className={`${styles.badge} ${
                    job.adminStatus === "pending" && job.workerStatus === "done"
                      ? styles.badgeInProgress
                      : job.adminStatus === "approved"
                      ? styles.badgeDoneGreen
                      : job.adminStatus === "rejected"
                      ? styles.badgeError
                      : styles.badgeNotStarted
                  }`}
                >
                  {job.adminStatus === "pending" && job.workerStatus === "done"
                    ? "Pending Approval"
                    : job.adminStatus === "approved"
                    ? "Approved"
                    : job.adminStatus === "rejected"
                    ? "Rejected"
                    : "Awaiting Worker Action"}
                </div>
                <div className={styles.statusActions}>
                  {job.workerStatus === "done" &&
                    job.adminStatus === "pending" && (
                      <>
                        <button
                          className={styles.actionBtn}
                          onClick={() =>
                            updateField("admin_status", "approved")
                          }
                          disabled={actionLoading || loading}
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button
                          className={styles.rejectBtn}
                          onClick={() =>
                            updateField("admin_status", "rejected")
                          }
                          disabled={actionLoading || loading}
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </>
                    )}
                  {job.adminStatus === "rejected" && (
                    <button
                      className={styles.actionBtn}
                      onClick={() => {
                        updateField("worker_status", "not_started");
                        updateField("admin_status", "pending");
                      }}
                      disabled={actionLoading || loading}
                    >
                      <AlertTriangle size={16} /> Re-open Job
                    </button>
                  )}
                  {user.role === "admin" &&
                    job.workerStatus !== "done" &&
                    job.adminStatus !== "approved" && (
                      <button
                        className={styles.actionBtn}
                        style={{ backgroundColor: "#ffc107", color: "#212529" }}
                        onClick={() => updateField("worker_status", "done")}
                        disabled={actionLoading || loading}
                      >
                        Force Worker Done
                      </button>
                    )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.tabs}>
          {tabs.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path === "" ? defaultActiveTabPath : path}
              end={path === defaultActiveTabPath}
              className={({ isActive }) => {
                const isBaseForIndexTab =
                  (location.pathname === `/orders/${jobId}` ||
                    location.pathname === `/orders/${jobId}/`) &&
                  path === defaultActiveTabPath;
                return isActive || isBaseForIndexTab
                  ? styles.activeTab
                  : styles.tab;
              }}
              onClick={(e) => actionLoading && e.preventDefault()}
            >
              {icon && <span className={styles.tabIcon}>{icon}</span>}
              {label}
            </NavLink>
          ))}
        </div>

        <div className={styles.content}>
          <Outlet context={{ jobData: job }} />
        </div>
      </div>
    </div>
  );
}
