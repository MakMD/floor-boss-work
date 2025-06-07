import { useState, useEffect, useContext, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { AppContext } from "../components/App/App";
import { useToast } from "@chakra-ui/react";

const uuidRegex =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function useOrderForm() {
  const { user, addActivity } = useContext(AppContext);
  const toast = useToast();

  // Стан для полів форми
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
  const [jobOrderPhotoFile, setJobOrderPhotoFile] = useState(null);
  const [jobOrderPhotoPreview, setJobOrderPhotoPreview] = useState(null);

  // Стан для даних, що завантажуються
  const [workers, setWorkers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Завантаження даних для селектів
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

  const resetForm = () => {
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
  };

  const handleAddJob = useCallback(
    async (e) => {
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
          throw new Error("User ID is invalid. Cannot create job.");
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
          client,
          notes,
          created_by: user.id,
          sf: sf ? Number(sf) : null,
          rate: rate ? Number(rate) : null,
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
              invoiceCreationMessage = ` Auto-invoice creation failed.`;
            } else {
              invoiceCreationMessage = ` Auto-invoice for $${calculatedInvoiceAmount.toFixed(
                2
              )} generated.`;
            }
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

        toast({
          title: "Order Created",
          description: `Job #${newJob.id} added successfully.${invoiceCreationMessage}`,
          status: "success",
          duration: 7000,
          isClosable: true,
          position: "top-right",
        });

        if (typeof addActivity === "function") {
          addActivity({
            action_type: "ORDER_CREATED",
            jobId: newJob.id,
            details: { address: newJob.address, client: newJob.client },
          });
        }

        resetForm();
      } catch (err) {
        console.error("Error in handleAddJob:", err);
        setError(err.message);
        toast({
          title: "Error Creating Order",
          description: err.message,
          status: "error",
          duration: 7000,
          isClosable: true,
          position: "top-right",
        });
      } finally {
        setFormSubmitting(false);
      }
    },
    [
      user,
      addActivity,
      toast,
      address,
      date,
      sf,
      rate,
      client,
      notes,
      selectedWorkers,
      workOrderNumber,
      storageInfo,
      adminInstructions,
      selectedCompany,
      jobOrderPhotoFile,
    ]
  );

  const workerOptions = workers.map((w) => ({ value: w.id, label: w.name }));
  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  return {
    formState: {
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
    },
    setters: {
      setAddress,
      setDate,
      setSf,
      setRate,
      setClient,
      setNotes,
      setSelectedWorkers,
      setWorkOrderNumber,
      setStorageInfo,
      setAdminInstructions,
      setSelectedCompany,
    },
    handlers: {
      handleAddJob,
      handleJobOrderPhotoChange,
    },
    data: {
      workerOptions,
      companyOptions,
    },
    uiState: {
      loading,
      formSubmitting,
      error,
    },
  };
}
