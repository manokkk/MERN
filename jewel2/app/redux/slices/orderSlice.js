import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// API Base URL
const API_URL = "http://192.168.0.159:4000/api/order";

// 🔹 Fetch Orders for Logged-in User (GET /get/:userId)
export const fetchUserOrders = createAsyncThunk(
  "order/getUserOrders",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/get/${userId}`);
      console.log("Fetched Orders Response:", JSON.stringify(response.data, null, 2)); // Debug response
      return response.data.orders;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// 🔹 Fetch All Orders (GET)
export const fetchOrders = createAsyncThunk("order/fetchOrders", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/get`);
    return response.data.orders;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

// 🔹 Create Order (POST)
export const createOrder = createAsyncThunk("order/createOrder", async (orderData, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_URL}/new`, orderData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const orderSlice = createSlice({
  name: "order",
  initialState: { orders: [], status: "idle", error: null },
  reducers: {
    clearOrders: (state) => {
      state.orders = [];
    },
    resetOrderStatus: (state) => {
      state.status = "idle"; // 🔹 Reset status after handling success
      state.error = null; // 🔹 Clear error to prevent old errors from showing
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Orders Cases
      .addCase(fetchUserOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.orders = action.payload; // Store only the logged-in user's orders
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Fetch All Orders Cases
      .addCase(fetchOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Create Order Cases
      .addCase(createOrder.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.orders.push(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearOrders, resetOrderStatus } = orderSlice.actions;
export default orderSlice.reducer;
