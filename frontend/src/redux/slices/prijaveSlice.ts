import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { toApiClientError } from "../../services/api";
import { listFakultetiRequest } from "../../services/metaService";
import { listPrijaveRequest } from "../../services/prijaveService";
import type { FakultetOption } from "../../types/models/fakultet";
import type { Prijava, PrijavaListResponse } from "../../types/models/prijava";

interface PrijaveState {
  rows: Prijava[];
  fakulteti: FakultetOption[];
  search: string;
  sortValue: string;
  statusFilter: string;
  partitionFilter: string;
  page: number;
  pageSize: number;
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
  partitionFilter: "sve",
  page: 1,
  pageSize: 10,
  isLoadingRows: false,
  isLoadingFakulteti: false,
  errorMessage: null,
  oracleDetails: undefined,
};

export const loadPrijaveRows = createAsyncThunk<
  PrijavaListResponse,
  void,
  { state: RootState; rejectValue: { message: string; oracleDetails?: string } }
>("prijave/loadRows", async (_arg, { getState, rejectWithValue }) => {
  const state = getState();
  const token = state.auth.token;
  const role = state.auth.role;

  if (!token || role !== "admin") {
    return {
      rows: [],
      page: state.prijave.page,
      pageSize: state.prijave.pageSize,
    };
  }

  const [sortBy, sortDirectionRaw] = state.prijave.sortValue.split(":");
  const sortDirection = sortDirectionRaw === "desc" ? "desc" : "asc";

  try {
    const response = await listPrijaveRequest(token, {
      search: state.prijave.search || undefined,
      sortBy,
      sortDirection,
      status_prijave: state.prijave.statusFilter === "svi" ? undefined : state.prijave.statusFilter,
      partition:
        state.prijave.partitionFilter === "sve" ? undefined : state.prijave.partitionFilter,
      page: state.prijave.page,
      pageSize: state.prijave.pageSize,
    });

    return response.data;
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
      state.page = 1;
    },
    setPrijavaSortValue: (state, action: PayloadAction<string>) => {
      state.sortValue = action.payload;
      state.page = 1;
    },
    setPrijavaStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    setPrijavaPartitionFilter: (state, action: PayloadAction<string>) => {
      state.partitionFilter = action.payload;
      state.page = 1;
    },
    setPrijavaPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setPrijavaPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.page = 1;
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
        state.rows = action.payload.rows;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
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

export const {
  setPrijavaSearch,
  setPrijavaSortValue,
  setPrijavaStatusFilter,
  setPrijavaPartitionFilter,
  setPrijavaPage,
  setPrijavaPageSize,
  clearPrijaveError,
} = prijaveSlice.actions;

export default prijaveSlice.reducer;
