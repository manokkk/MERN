import { configureStore } from "@reduxjs/toolkit";
import orderReducer from "./slices/orderSlice";
// import userReducer, { initializeUser } from "./slices/userSlice";
// import cartReducer from "./slices/cartSlice";

export const store = configureStore({
  reducer: {
    order: orderReducer,
    // user: userReducer,
    // cart: cartReducer,
  },
});

// Load user from AsyncStorage when app starts
// store.dispatch(initializeUser());

export default store;
