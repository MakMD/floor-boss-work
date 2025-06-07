import { useState, useEffect, useContext, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { AppContext } from "../components/App/App";
import { useToast } from "@chakra-ui/react";

export function useJobDetails(jobId) {
  const { user, addActivity } = useContext(AppContext);
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobDetails = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      setError("No job ID provided.");
      return;
    }
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
            console.error("Error fetching company name:", companyError.message);
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
  }, [jobId, toast]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const updateStatus = useCallback(
    async (fieldsToUpdate) => {
      if (!job) return;

      setActionLoading(true);
      setError(null);

      const oldStatus = {
        worker_status: job.worker_status,
        admin_status: job.admin_status,
      };

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

        if (typeof addActivity === "function") {
          addActivity({
            action_type: "STATUS_CHANGED",
            jobId: jobId,
            details: {
              changes: fieldsToUpdate,
              previous_status: oldStatus,
            },
          });
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
    },
    [job, jobId, addActivity, toast]
  );

  return {
    job,
    companyName,
    loading,
    actionLoading,
    error,
    updateStatus,
  };
}
