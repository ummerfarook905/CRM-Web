
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  useAppDispatch,
  useAppSelector,
} from "../../app/Hooks";

import {
  fetchServices,
  createService,
  updateService,
} from "../../services/ServicesSlice";

import type {
  Service,
  CreateServicePayload,
} from "../../models/admin/Service";

import {
  fetchBookings,
  updateBooking,
} from "../../services/BookingsSlice";

import type { Booking } from "../../services/BookingsSlice";

import {
  fetchCategories,
  createCategory,
} from "../../services/CategoriesSlice";


type ActiveTab = "bookings" | "services" | "categories";

const initialServiceForm = {
  name: "",
  category: "",
  description: "",
  duration: "2 hours",
  price: "0",
  status: "Active" as Service["status"],
  requiresMaintenance: false,
  defaultMaintenanceFrequency: "",
};

const initialScheduleForm = {
  date: "",
  time: "09:00",
  assignedTo: "",
  notes: "",
};

export function useServiceManagementViewModel() {
  const dispatch = useAppDispatch();

  const services = useAppSelector((state) => state.services.items);
  const servicesLoading = useAppSelector((state) => state.services.loading);
  const servicesError = useAppSelector((state) => state.services.error);

  const bookings = useAppSelector((state) => state.bookings.items);
  const categories = useAppSelector((state) => state.categories.items);

  const [activeTab, setActiveTab] = useState<ActiveTab>("bookings");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [serviceModal, setServiceModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);

  const [scheduleBooking, setScheduleBooking] =
    useState<Booking | null>(null);

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  const [editingService, setEditingService] =
    useState<Service | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [notice, setNotice] = useState("");

  const [serviceForm, setServiceForm] = useState(initialServiceForm);
  const [scheduleForm, setScheduleForm] = useState(initialScheduleForm);

  // Initial API loading
  useEffect(() => {
    dispatch(fetchServices());
    dispatch(fetchBookings());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Resolve a booking's service
  const getService = useCallback(
    (id: number | string) =>
      services.find((service) => String(service.id) === String(id)),
    [services]
  );

  // Search and filter bookings
  const filteredBookings = useMemo(() => {
    const query = search.toLowerCase().trim();

    return bookings.filter((booking) => {
      const service = getService(booking.serviceId);

      const matchesSearch =
        !query ||
        [
          booking.reference,
          booking.customer,
          booking.company,
          booking.location,
          service?.name ?? "",
          booking.assignedTo,
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === "All" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, getService, search, statusFilter]);

  // Summary data
  const pendingBookings = bookings.filter(
    (booking) => booking.status === "Pending"
  ).length;

  const scheduledBookings = bookings.filter(
    (booking) => booking.status === "Scheduled"
  ).length;

  const activeWork = bookings.filter(
    (booking) => booking.status === "In Progress"
  ).length;

  // Booking actions
  const handleBookingUpdate = async (
    id: number,
    updates: Partial<Booking>
  ) => {
    try {
      await dispatch(updateBooking({ id, updates })).unwrap();
      setNotice("Booking updated successfully.");
    } catch (error) {
      setNotice(
        typeof error === "string"
          ? error
          : "Failed to update booking."
      );
    }
  };

  const approveBooking = (booking: Booking) =>
    handleBookingUpdate(booking.id, { status: "Approved" });

  const rejectBooking = (booking: Booking) =>
    handleBookingUpdate(booking.id, { status: "Rejected" });

  // Service form actions
  const openAddService = () => {
    setEditingService(null);
    setServiceForm({
      ...initialServiceForm,
      category: categories[0]?.id ?? "",
    });
    setServiceModal(true);
  };

  const openEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      category: service.categoryId,
      description: service.description,
      duration: service.duration,
      price: String(service.price),
      status: service.status,
      requiresMaintenance: service.requiresMaintenance ?? false,
      defaultMaintenanceFrequency:
        service.defaultMaintenanceFrequency ?? "",
    });
    setServiceModal(true);
  };

  const closeServiceModal = () => setServiceModal(false);

  const saveService = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const price = Number(serviceForm.price);

    if (!serviceForm.name.trim() || !serviceForm.category) {
      setNotice("Please enter a service name and select a category.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setNotice("Please enter a valid service price.");
      return;
    }

    if (
      serviceForm.requiresMaintenance &&
      !serviceForm.defaultMaintenanceFrequency
    ) {
      setNotice("Please select a maintenance frequency.");
      return;
    }

    const payload: CreateServicePayload = {
        name: serviceForm.name.trim(),
        categoryId: serviceForm.category,
        description: serviceForm.description.trim(),
        estimatedDuration: serviceForm.duration,
        basePrice: price,
        image: null,
        requiresMaintenance: serviceForm.requiresMaintenance,
        defaultMaintenanceFrequency: serviceForm.requiresMaintenance
            ? serviceForm.defaultMaintenanceFrequency || null
            : null,
        isActive: serviceForm.status === "Active",
    };

    try {
      if (editingService) {
        await dispatch(
          updateService({
            id: editingService.id,
            ...payload,
          })
        ).unwrap();

        setNotice("Service updated successfully.");
      } else {
        await dispatch(createService(payload)).unwrap();
        setNotice("Service added successfully.");
      }

      setServiceModal(false);
    } catch (error) {
      setNotice(
        typeof error === "string"
          ? error
          : "Failed to save service. Check the API response."
      );
    }
  };

  // Category actions
  const addCategory = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const value = categoryName.trim();

    if (!value) return;

    if (
      categories.some(
        (category) =>
          category.name.toLowerCase() === value.toLowerCase()
      )
    ) {
      setNotice("That category already exists.");
      return;
    }

    try {
      await dispatch(createCategory(value)).unwrap();
      setCategoryName("");
      setCategoryModal(false);
      setNotice("Category added successfully.");
    } catch (error) {
      setNotice(
        typeof error === "string"
          ? error
          : "Failed to create category."
      );
    }
  };

  // Scheduling actions
  const openSchedule = (booking: Booking) => {
    setScheduleBooking(booking);
    setScheduleForm({
      date: booking.scheduledDate,
      time: booking.scheduledTime || "09:00",
      assignedTo: booking.assignedTo,
      notes: booking.notes,
    });
  };

  const saveSchedule = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !scheduleBooking ||
      !scheduleForm.date ||
      !scheduleForm.time ||
      !scheduleForm.assignedTo
    ) {
      setNotice("Please complete the date, time, and assignee.");
      return;
    }

    try {
      await dispatch(
        updateBooking({
          id: scheduleBooking.id,
          updates: {
            scheduledDate: scheduleForm.date,
            scheduledTime: scheduleForm.time,
            assignedTo: scheduleForm.assignedTo,
            notes: scheduleForm.notes,
            status: "Scheduled",
          },
        })
      ).unwrap();

      setScheduleBooking(null);
      setNotice("Service scheduled and assigned successfully.");
    } catch (error) {
      setNotice(
        typeof error === "string"
          ? error
          : "Failed to schedule service."
      );
    }
  };

  return {
    services,
    bookings,
    categories,
    servicesLoading,
    servicesError,

    activeTab,
    setActiveTab,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filteredBookings,
    getService,

    pendingBookings,
    scheduledBookings,
    activeWork,

    serviceModal,
    setServiceModal,
    closeServiceModal,
    categoryModal,
    setCategoryModal,
    scheduleBooking,
    setScheduleBooking,
    selectedBooking,
    setSelectedBooking,
    editingService,
    categoryName,
    setCategoryName,
    serviceForm,
    setServiceForm,
    scheduleForm,
    setScheduleForm,
    notice,
    setNotice,

    openAddService,
    openEditService,
    saveService,
    addCategory,
    openSchedule,
    saveSchedule,
    approveBooking,
    rejectBooking,
  };
}
