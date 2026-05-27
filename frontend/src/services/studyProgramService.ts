import axios from "axios";
import type { ApiSuccess } from "../types/api/common";
import type { StudyProgramOption } from "../types/models/upis";
import { buildApiUrl } from "./api";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const listStudyProgramsRequest = async (
  token: string,
  idFakulteta?: number,
): Promise<ApiSuccess<{ rows: StudyProgramOption[] }>> => {
  const response = await axios.get<ApiSuccess<{ rows: StudyProgramOption[] }>>(
    buildApiUrl("/upis/programi"),
    {
      headers: authHeaders(token),
      params: {
        idFakulteta: idFakulteta ?? undefined,
      },
    },
  );

  return response.data;
};
