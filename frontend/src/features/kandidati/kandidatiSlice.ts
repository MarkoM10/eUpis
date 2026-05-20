import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { toApiClientError } from "../../services/httpClient";
import { listKandidatiRequest } from "../../services/kandidatiService";
import type { Kandidat } from "../../types/models/kandidat";

interface KandidatiState {
  rows: Kandidat[];
  search: string;
  sortValue: string;
  tipKandidataFilter: string;
  isLoading: boolean;
  errorMessage: string | null;
  oracleDetails?: string;
}

const initialState: KandidatiState = {
  rows: [],
  search: "",
  sortValue: "ime_prezime:asc",
  tipKandidataFilter: "svi",
  isLoading: false,
  errorMessage: null,
  oracleDetails: undefined,
};

export const loadKandidati = createAsyncThunk<
  Kandidat[],
  void,
  { state: RootState; rejectValue: { message: string; oracleDetails?: string } }
>("kandidati/load", async (_arg, { getState, rejectWithValue }) => {
  const state = getState();
  const token = state.auth.token;

  if (!token) {
    return [];
  }

  const [sortBy, sortDirectionRaw] = state.kandidati.sortValue.split(":");
  const sortDirection = sortDirectionRaw === "desc" ? "desc" : "asc";

  try {
    const response = await listKandidatiRequest(token, {
      search: state.kandidati.search || undefined,
      sortBy,
      sortDirection,
      tip_kandidata:
        state.kandidati.tipKandidataFilter === "svi"
          ? undefined
          : state.kandidati.tipKandidataFilter,
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

const kandidatiSlice = createSlice({
  name: "kandidati",
  initialState,
  reducers: {
    setKandidatiSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setKandidatiSortValue: (state, action: PayloadAction<string>) => {
      state.sortValue = action.payload;
    },
    setTipKandidataFilter: (state, action: PayloadAction<string>) => {
      state.tipKandidataFilter = action.payload;
    },
    clearKandidatiError: (state) => {
      state.errorMessage = null;
      state.oracleDetails = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadKandidati.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = null;
        state.oracleDetails = undefined;
      })
      .addCase(loadKandidati.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rows = action.payload;
      })
      .addCase(loadKandidati.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.errorMessage = action.payload.message;
          state.oracleDetails = action.payload.oracleDetails;
        }
      });
  },
});

export const {
  setKandidatiSearch,
  setKandidatiSortValue,
  setTipKandidataFilter,
  clearKandidatiError,
} = kandidatiSlice.actions;

export default kandidatiSlice.reducer;
