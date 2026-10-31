
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";

import {
  useAppDispatch,
  useAppSelector,
} from "../../app/Hooks";

import {
  deleteService,
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
import { fetchWorkOrders } from "../../services/WorkMonitoringSlice";

import type { Booking } from "../../services/BookingsSlice";

import type { Category } from "../../services/CategoriesSlice";

import {
  fetchCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from "../../services/CategoriesSlice";


type ActiveTab = "bookings" | "services" | "categories";

const initialServiceForm = {
  name: "",
  category: "",
  description: "",
  duration: "1",
  durationUnit: "days" as "days" | "months",
  price: "0",
  status: "Active" as Service["status"],
  requiresMaintenance: false,
  defaultMaintenanceFrequency: "",
};

const initialScheduleForm = {
  date: "",
  time: "09:00",
  managerId: "",
  employeeIds: [] as string[],
  notes: "",
};

interface ManagerOption { id: string; name: string }

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

  const [selectedBookingId, setSelectedBookingId] = useState<Booking["id"] | null>(null);
  const selectedBooking = bookings.find((booking) => String(booking.id) === String(selectedBookingId)) ?? null;
  const setSelectedBooking = useCallback((booking: Booking | null) => {
    setSelectedBookingId(booking?.id ?? null);
  }, []);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [managersError, setManagersError] = useState("");

  const [editingService, setEditingService] =
    useState<Service | null>(null);
  
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] =
  useState<Category | null>(null);
  const [notice, setNotice] = useState("");

  const [serviceForm, setServiceForm] = useState(initialServiceForm);
  const [scheduleForm, setScheduleForm] = useState(initialScheduleForm);

  // Initial API loading
  useEffect(() => {
    dispatch(fetchServices());
    dispatch(fetchBookings());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    const loadManagers = async () => {
      setManagersLoading(true);
      setManagersError("");
      try {
        const response = await api.get("/managers", { params: { page: 1, limit: 100 } });
        const root = response.data as Record<string, unknown>;
        const data = root.data as Record<string, unknown> | unknown[] | undefined;
        const rows = Array.isArray(data)
          ? data
          : data && typeof data === "object" && Array.isArray(data.data)
            ? data.data as unknown[]
            : data && typeof data === "object" && Array.isArray(data.items)
              ? data.items as unknown[]
              : [];
        const options = rows.flatMap((value): ManagerOption[] => {
          if (!value || typeof value !== "object") return [];
          const manager = value as Record<string, unknown>;
          const user = manager.user as Record<string, unknown> | undefined;
          if (typeof manager.id !== "string" || user?.isActive !== true) return [];
          const name = [user.firstName, user.lastName].filter((part): part is string => typeof part === "string").join(" ");
          return [{ id: manager.id, name: name || String(manager.title || "Manager") }];
        });
        if (active) setManagers(options);
      } catch (error) {
        if (active) {
          const data = (error as { response?: { data?: { message?: unknown } } })?.response?.data;
          setManagersError(Array.isArray(data?.message) ? data.message.join(", ") : typeof data?.message === "string" ? data.message : "Unable to load managers.");
        }
      } finally {
        if (active) setManagersLoading(false);
      }
    };
    void loadManagers();
    return () => { active = false; };
  }, []);

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
    id: Booking["id"],
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
    const durationMatch = service.duration.match(/^(\d+(?:\.\d+)?)\s*(days?|months?)$/i);
    const durationValue = durationMatch?.[1] ?? "1";
    const durationUnit = durationMatch?.[2]?.toLowerCase().startsWith("month") ? "months" : "days";
    setEditingService(service);
    setServiceForm({
      name: service.name,
      category: service.categoryId,
      description: service.description,
      duration: durationValue,
      durationUnit,
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
    const durationAmount = Number(serviceForm.duration);
    const duration = durationAmount * (serviceForm.durationUnit === "months" ? 30 : 1) * 24 * 60;

    if (!serviceForm.name.trim() || !serviceForm.category) {
      setNotice("Please enter a service name and select a category.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setNotice("Please enter a valid service price.");
      return;
    }

    if (!Number.isFinite(durationAmount) || durationAmount <= 0) {
      setNotice("Please enter an estimated duration greater than zero.");
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
        estimatedDuration: duration,
        basePrice: price,
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

  const handleDeleteService = async (id: number | string) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this service?"
  );

  if (!confirmed) return;

  try {
    await dispatch(deleteService(id)).unwrap();
    setNotice("Service deleted successfully.");
  } catch (error) {
    setNotice(
      typeof error === "string"
        ? error
        : "Failed to delete service."
    );
  }
};

  // Category actions
  
const openAddCategory = () => {
  setEditingCategory(null);
  setCategoryName("");
  setCategoryModal(true);
};

const openEditCategory = (category: Category) => {
  setEditingCategory(category);
  setCategoryName(category.name);
  setCategoryModal(true);
};

const addCategory = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  const value = categoryName.trim();

  if (!value) {
    setNotice("Please enter a category name.");
    return;
  }

  const duplicate = categories.some(
    (category) =>
      category.name.toLowerCase() === value.toLowerCase() &&
      category.id !== editingCategory?.id
  );

  if (duplicate) {
    setNotice("That category already exists.");
    return;
  }

  try {
    if (editingCategory) {
      await dispatch(
        updateCategory({
          id: editingCategory.id,
          name: value,
        })
      ).unwrap();

      setNotice("Category updated successfully.");
    } else {
      await dispatch(createCategory(value)).unwrap();
      setNotice("Category added successfully.");
    }

    setCategoryName("");
    setEditingCategory(null);
    setCategoryModal(false);
  } catch (error) {
    setNotice(
      typeof error === "string"
        ? error
        : editingCategory
          ? "Failed to update category."
          : "Failed to create category."
    );
  }
};


  
  const handleDeleteCategory = async (id: string) => {
    const category = categories.find((item) => item.id === id);

    if (!category) {
      setNotice("Category not found.");
      return;
    }

    const servicesUsingCategory = services.filter(
      (service) => String(service.categoryId) === String(id)
    );

    if (servicesUsingCategory.length > 0) {
      setNotice(
        `Cannot delete "${category.name}" because ${servicesUsingCategory.length} service(s) use this category.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the category "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      await dispatch(deleteCategory(id)).unwrap();
      setNotice("Category deleted successfully.");
    } catch (error) {
      setNotice(
        typeof error === "string"
          ? error
          : "Failed to delete category."
      );
    }
  };


  // Scheduling actions
  const openSchedule = (booking: Booking) => {
    setScheduleBooking(booking);
    setScheduleForm({
      date: booking.scheduledDate || booking.requestedDate,
      time: booking.scheduledTime || "09:00",
      managerId: booking.managerId,
      employeeIds: booking.employeeIds,
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
      (!scheduleForm.managerId && scheduleForm.employeeIds.length === 0)
    ) {
      setNotice("Please select a manager or at least one employee.");
      return;
    }

    try {
      const [hours, minutes] = scheduleForm.time.split(":").map(Number);
      const end = new Date(2000, 0, 1, hours, minutes + scheduleBooking.serviceDurationMinutes);
      const scheduledEndTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;

      if (scheduleBooking.workOrderId) {
        await api.patch(`/work-orders/${encodeURIComponent(scheduleBooking.workOrderId)}/schedule`, {
          scheduledDate: scheduleForm.date,
          scheduledStartTime: scheduleForm.time,
          scheduledEndTime,
        });

        if (scheduleForm.managerId && scheduleForm.managerId !== scheduleBooking.managerId) {
          await api.patch(`/work-orders/${encodeURIComponent(scheduleBooking.workOrderId)}/manager`, {
            managerId: scheduleForm.managerId,
          });
        }

        const newEmployeeIds = scheduleForm.employeeIds.filter((id) => !scheduleBooking.employeeIds.includes(id));
        if (newEmployeeIds.length) {
          await api.post("/work-assignments", {
            workOrderId: scheduleBooking.workOrderId,
            employeeIds: newEmployeeIds,
          });
        }
      } else {
        if (scheduleBooking.status === "Pending") {
          await dispatch(updateBooking({ id: scheduleBooking.id, updates: { status: "Approved" } })).unwrap();
          setScheduleBooking((current) => current ? { ...current, status: "Approved" } : current);
        } else if (scheduleBooking.status !== "Approved" && scheduleBooking.status !== "Scheduled") {
          throw new Error(`Cannot create a work order for a ${scheduleBooking.status} booking.`);
        }

        await api.post("/work-orders", {
          bookingId: String(scheduleBooking.id),
          scheduledDate: scheduleForm.date,
          scheduledStartTime: scheduleForm.time,
          scheduledEndTime,
          ...(scheduleForm.managerId ? { managerId: scheduleForm.managerId } : {}),
          ...(scheduleForm.employeeIds.length ? { employeeIds: scheduleForm.employeeIds } : {}),
          ...(scheduleForm.notes.trim() ? { instructions: scheduleForm.notes.trim() } : {}),
        });
      }

      await Promise.all([
        dispatch(fetchBookings()).unwrap(),
        dispatch(fetchWorkOrders({ page: 1, limit: 20 })).unwrap(),
      ]);

      setScheduleBooking(null);
      setNotice("Schedule and assignments saved successfully.");
    } catch (error) {
      const responseMessage = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
      setNotice(typeof error === "string"
        ? error
        : Array.isArray(responseMessage)
          ? responseMessage.join(", ")
          : typeof responseMessage === "string"
            ? responseMessage
            : error instanceof Error ? error.message : "Failed to schedule service.");
    }
  };

  return {
    services: services ?? [],
    bookings: bookings ?? [],
    categories: categories ?? [],
    servicesLoading,
    servicesError,

    activeTab,
    setActiveTab,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filteredBookings: filteredBookings ?? [],
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
    managers,
    managersLoading,
    managersError,
    editingService,
    categoryName,
    setCategoryName,
    editingCategory,
    openAddCategory,
    openEditCategory,
    serviceForm,
    setServiceForm,
    scheduleForm,
    setScheduleForm,
    notice,
    setNotice,

    openAddService,
    openEditService,
    handleDeleteService,
    saveService,
    addCategory,
    handleDeleteCategory,
    openSchedule,
    saveSchedule,
    approveBooking,
    rejectBooking,
  };
}
