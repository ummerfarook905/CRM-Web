
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../store/auth/AuthSlice";
import servicesReducer from "../services/ServicesSlice";
import bookingsReducer from "../services/BookingsSlice"; 
import categoriesReducer from "../services/CategoriesSlice"; // Import the bookings reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    services: servicesReducer,
    bookings: bookingsReducer,
    categories: categoriesReducer,
 // Add the bookings reducer here
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
