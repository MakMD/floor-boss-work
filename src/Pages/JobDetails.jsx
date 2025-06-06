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
  Info as InfoIcon,
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
  MapPin as MapPinIcon,
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

  const updateStatus = async (fieldsToUpdate) => {
    setActionLoading(true);
    setError(null);

    try {
      const { error: jobErr } = await supabase
        .from("jobs")
        .update(fieldsToUpdate)
        .eq("id", jobId);

      if (jobErr) throw jobErr;

      setJob((prevJob) => ({ ...prevJob, ...fieldsToUpdate }));

      const updatedFieldsString = Object.entries(fieldsToUpdate)
        .map(([key, value]) => `${key} to "${value}"`)
        .join(", ");

      toast({
        title: "Status Updated",
        description: `Job status updated: ${updatedFieldsString}.`,
        status: "success",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });

      const actor = user?.name || user?.email || `User ID: ${user?.id}`;
      const activityMessage = `${actor} updated job #${jobId}: set ${updatedFieldsString}`;

      if (typeof addActivity === "function") {
        addActivity({
          message: activityMessage,
          jobId: jobId,
          details: {
            ...fieldsToUpdate,
            action: "status_update",
          },
        });
      }

      if (fieldsToUpdate.worker_status === "in_progress" && user?.id) {
        const startWorkMessage = `Worker ${actor} started order #${jobId}`;
        await supabase
          .from("job_updates")
          .insert([
            { job_id: jobId, worker_id: user.id, message: startWorkMessage },
          ]);
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
            worker_status: data.worker_status || "not_started",
            admin_status: data.admin_status || "pending",
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
    { path: "materials", label: "Materials", icon: <Briefcase size={16} /> },
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
            </p>
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
                  job.worker_status === "not_started"
                    ? styles.badgeNotStarted
                    : job.worker_status === "in_progress"
                    ? styles.badgeInProgress
                    : styles.badgeDoneGrey
                }`}
              >
                {job.worker_status === "not_started"
                  ? "Not Started"
                  : job.worker_status === "in_progress"
                  ? "In Progress"
                  : "Work Done"}
              </div>
              <div className={styles.statusActions}>
                {user.role === "worker" &&
                  job.worker_status === "not_started" && (
                    <button
                      className={styles.actionBtn}
                      onClick={() =>
                        updateStatus({ worker_status: "in_progress" })
                      }
                      disabled={actionLoading || loading}
                    >
                      <PlayCircle size={16} /> Start Work
                    </button>
                  )}
                {user.role === "worker" &&
                  job.worker_status === "in_progress" && (
                    <button
                      className={styles.actionBtn}
                      onClick={() => updateStatus({ worker_status: "done" })}
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
                    job.admin_status === "pending" &&
                    job.worker_status === "done"
                      ? styles.badgeInProgress
                      : job.admin_status === "approved"
                      ? styles.badgeDoneGreen
                      : job.admin_status === "rejected"
                      ? styles.badgeError
                      : styles.badgeNotStarted
                  }`}
                >
                  {job.admin_status === "pending" &&
                  job.worker_status === "done"
                    ? "Pending Approval"
                    : job.admin_status === "approved"
                    ? "Approved"
                    : job.admin_status === "rejected"
                    ? "Rejected"
                    : "Awaiting Worker Action"}
                </div>
                <div className={styles.statusActions}>
                  {job.worker_status === "done" &&
                    job.admin_status === "pending" && (
                      <>
                        <button
                          className={styles.actionBtn}
                          onClick={() =>
                            updateStatus({ admin_status: "approved" })
                          }
                          disabled={actionLoading || loading}
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button
                          className={styles.rejectBtn}
                          onClick={() =>
                            updateStatus({
                              admin_status: "rejected",
                              worker_status: "in_progress",
                            })
                          }
                          disabled={actionLoading || loading}
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </>
                    )}
                  {job.admin_status === "rejected" && (
                    <button
                      className={styles.actionBtn}
                      onClick={() =>
                        updateStatus({
                          worker_status: "not_started",
                          admin_status: "pending",
                        })
                      }
                      disabled={actionLoading || loading}
                    >
                      <AlertTriangle size={16} /> Re-open Job
                    </button>
                  )}
                  {user.role === "admin" &&
                    job.worker_status !== "done" &&
                    job.admin_status !== "approved" && (
                      <button
                        className={styles.actionBtn}
                        style={{ backgroundColor: "#ffc107", color: "#212529" }}
                        onClick={() => updateStatus({ worker_status: "done" })}
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
