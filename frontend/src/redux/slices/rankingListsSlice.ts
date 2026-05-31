import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { toApiClientError } from "../../services/api";
import { listRankingListsRequest } from "../../services/rankingListsService";
import type { RankingListSummary } from "../../types/models/upis";

interface RankingListsState {
  rows: RankingListSummary[];
  searchSchoolYear: string;
  searchCompetitionName: string;
  searchProgramName: string;
  isLoading: boolean;
  errorMessage: string | null;
  oracleDetails?: string;
}

const initialState: RankingListsState = {
  rows: [],
  searchSchoolYear: "",
  searchCompetitionName: "",
  searchProgramName: "",
  isLoading: false,
  errorMessage: null,
  oracleDetails: undefined,
};

export const loadRankingLists = createAsyncThunk<
  RankingListSummary[],
  void,
  { state: RootState; rejectValue: { message: string; oracleDetails?: string } }
>("rankingLists/load", async (_arg, { getState, rejectWithValue }) => {
  const state = getState();
  const token = state.auth.token;

  if (!token) {
    return [];
  }

  try {
    const response = await listRankingListsRequest(token, {
      skolskaGodina: state.rankingLists.searchSchoolYear || undefined,
      nazivKonkursa: state.rankingLists.searchCompetitionName || undefined,
      nazivPrograma: state.rankingLists.searchProgramName || undefined,
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

const rankingListsSlice = createSlice({
  name: "rankingLists",
  initialState,
  reducers: {
    setSearchSchoolYear: (state, action: PayloadAction<string>) => {
      state.searchSchoolYear = action.payload;
    },
    setSearchCompetitionName: (state, action: PayloadAction<string>) => {
      state.searchCompetitionName = action.payload;
    },
    setSearchProgramName: (state, action: PayloadAction<string>) => {
      state.searchProgramName = action.payload;
    },
    clearRankingListsError: (state) => {
      state.errorMessage = null;
      state.oracleDetails = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadRankingLists.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = null;
        state.oracleDetails = undefined;
      })
      .addCase(loadRankingLists.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rows = action.payload;
      })
      .addCase(loadRankingLists.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.errorMessage = action.payload.message;
          state.oracleDetails = action.payload.oracleDetails;
        }
      });
  },
});

export const {
  setSearchSchoolYear,
  setSearchCompetitionName,
  setSearchProgramName,
  clearRankingListsError,
} = rankingListsSlice.actions;

export default rankingListsSlice.reducer;
