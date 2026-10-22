import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { initialCustomers, type Customer } from "../models/admin/Customer";

interface CustomerState {
  customers: Customer[];
}

const initialState: CustomerState = {
  customers: initialCustomers,
};

const customerSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.customers.findIndex(
        (customer) => customer.id === action.payload.id
      );

      if (index !== -1) {
        state.customers[index] = action.payload;
      }
    },

    deleteCustomer: (state, action: PayloadAction<number>) => {
      state.customers = state.customers.filter(
        (customer) => customer.id !== action.payload
      );
    },
  },
});

export const { updateCustomer, deleteCustomer } = customerSlice.actions;

export default customerSlice.reducer;