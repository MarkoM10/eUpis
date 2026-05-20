import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.ts";
import kandidatiReducer from "../features/kandidati/kandidatiSlice.ts";
import prijaveReducer from "../features/prijave/prijaveSlice.ts";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    kandidati: kandidatiReducer,
    prijave: prijaveReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
