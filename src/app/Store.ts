
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../store/auth/AuthSlice";
import servicesReducer from "../services/ServicesSlice";
import bookingsReducer from "../services/BookingsSlice"; 
import categoriesReducer from "../services/CategoriesSlice";
import enquiriesReducer from "../services/EnquiriesSlice";
import serviceRequestsReducer from "../services/ServiceRequestsSlice"; 
import customerReducer from "../services/CustomerSlice";// Import the bookings reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    services: servicesReducer,
    bookings: bookingsReducer,
    categories: categoriesReducer,
    enquiries: enquiriesReducer,
    serviceRequests: serviceRequestsReducer,
    customers: customerReducer
 // Add the bookings reducer here
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
