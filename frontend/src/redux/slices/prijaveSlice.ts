import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { toApiClientError } from "../../services/api";
import { listFakultetiRequest } from "../../services/metaService";
import { listPrijaveRequest } from "../../services/prijaveService";
import type { FakultetOption } from "../../types/models/fakultet";
import type { Prijava } from "../../types/models/prijava";

interface PrijaveState {
  rows: Prijava[];
  fakulteti: FakultetOption[];
  search: string;
  sortValue: string;
  statusFilter: string;
  isLoadingRows: boolean;
  isLoadingFakulteti: boolean;
  errorMessage: string | null;
  oracleDetails?: string;
}

const initialState: PrijaveState = {
  rows: [],
  fakulteti: [],
  search: "",
  sortValue: "broj_prijave:asc",
  statusFilter: "svi",
  isLoadingRows: false,
  isLoadingFakulteti: false,
  errorMessage: null,
  oracleDetails: undefined,
};

export const loadPrijaveRows = createAsyncThunk<
  Prijava[],
  void,
  { state: RootState; rejectValue: { message: string; oracleDetails?: string } }
>("prijave/loadRows", async (_arg, { getState, rejectWithValue }) => {
  const state = getState();
  const token = state.auth.token;
  const role = state.auth.role;

  if (!token || role !== "admin") {
    return [];
  }

  const [sortBy, sortDirectionRaw] = state.prijave.sortValue.split(":");
  const sortDirection = sortDirectionRaw === "desc" ? "desc" : "asc";

  try {
    const response = await listPrijaveRequest(token, {
      search: state.prijave.search || undefined,
      sortBy,
      sortDirection,
      status_prijave: state.prijave.statusFilter === "svi" ? undefined : state.prijave.statusFilter,
    });

    return response.data.rows;
  } catch (error) {
    const parsed = toApiClientError(error);
    return rejectWithValue({
      message: `${parsed.title}: ${parsed.message}`,
      oracleDetails: parsed.oracleDetails,
    });
  }
});

export const loadFakulteti = createAsyncThunk<FakultetOption[], void, { state: RootState }>(
  "prijave/loadFakulteti",
  async (_arg, { getState }) => {
    const token = getState().auth.token;
    if (!token) {
      return [];
    }

    try {
      const response = await listFakultetiRequest(token);
      return response.data.rows;
    } catch {
      return [];
    }
  },
);

const prijaveSlice = createSlice({
  name: "prijave",
  initialState,
  reducers: {
    setPrijavaSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setPrijavaSortValue: (state, action: PayloadAction<string>) => {
      state.sortValue = action.payload;
    },
    setPrijavaStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
    },
    clearPrijaveError: (state) => {
      state.errorMessage = null;
      state.oracleDetails = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPrijaveRows.pending, (state) => {
        state.isLoadingRows = true;
        state.errorMessage = null;
        state.oracleDetails = undefined;
      })
      .addCase(loadPrijaveRows.fulfilled, (state, action) => {
        state.isLoadingRows = false;
        state.rows = action.payload;
      })
      .addCase(loadPrijaveRows.rejected, (state, action) => {
        state.isLoadingRows = false;
        if (action.payload) {
          state.errorMessage = action.payload.message;
          state.oracleDetails = action.payload.oracleDetails;
        }
      })
      .addCase(loadFakulteti.pending, (state) => {
        state.isLoadingFakulteti = true;
      })
      .addCase(loadFakulteti.fulfilled, (state, action) => {
        state.isLoadingFakulteti = false;
        state.fakulteti = action.payload;
      })
      .addCase(loadFakulteti.rejected, (state) => {
        state.isLoadingFakulteti = false;
        state.fakulteti = [];
      });
  },
});

export const { setPrijavaSearch, setPrijavaSortValue, setPrijavaStatusFilter, clearPrijaveError } =
  prijaveSlice.actions;

export default prijaveSlice.reducer;
