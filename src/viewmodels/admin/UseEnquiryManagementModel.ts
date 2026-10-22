import { useEffect, useMemo, useState } from "react";

import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import { fetchEnquiries } from "../../services/EnquiriesSlice";
import type {
  Enquiry,
  EnquiryStatus,
} from "../../models/admin/Enquiry";

export function useEnquiryManagementViewModel() {
  const dispatch = useAppDispatch();

  const {
    items: enquiries,
    loading,
    error,
  } = useAppSelector((state) => state.enquiries);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | EnquiryStatus
  >("All");

  useEffect(() => {
    void dispatch(fetchEnquiries());
  }, [dispatch]);

  const filteredEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enquiries.filter((enquiry: Enquiry) => {
      const matchesSearch = [
        enquiry.reference,
        enquiry.customerName,
        enquiry.company,
        enquiry.phone,
        enquiry.email,
        enquiry.service,
        enquiry.location,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );

      const matchesStatus =
        statusFilter === "All" ||
        enquiry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [enquiries, search, statusFilter]);

  return {
    enquiries,
    filteredEnquiries,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    totalEnquiries: enquiries.length,
    newEnquiries: enquiries.filter(
      (item) => item.status === "New"
    ).length,
    assignedEnquiries: enquiries.filter(
      (item) => item.status === "Assigned"
    ).length,
    convertedEnquiries: enquiries.filter(
      (item) => item.status === "Converted"
    ).length,
  };
}