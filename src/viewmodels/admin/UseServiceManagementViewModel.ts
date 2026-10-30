
import { useCallback, useEffect, useMemo, useState } from "react";

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
  duration: "120",
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
    const duration = Number(serviceForm.duration);

    if (!serviceForm.name.trim() || !serviceForm.category) {
      setNotice("Please enter a service name and select a category.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setNotice("Please enter a valid service price.");
      return;
    }

    if (!Number.isFinite(duration) || duration < 5 || duration > 1440) {
      setNotice("Please enter a duration between 5 and 1440 minutes.");
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
