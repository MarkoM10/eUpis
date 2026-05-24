import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import kandidatiReducer from "./slices/kandidatiSlice";
import prijaveReducer from "./slices/prijaveSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    kandidati: kandidatiReducer,
    prijave: prijaveReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
