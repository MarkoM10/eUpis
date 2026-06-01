import {
  deleteKandidat,
  getKandidatByJmbg,
  listKandidati,
  updateKandidat,
} from "./kandidati.repository";
import type { KandidatMutationInput, KandidatRecord } from "../../types/modules/kandidati";

export const listKandidatiService = async (
  query: Record<string, unknown>,
): Promise<{ rows: KandidatRecord[]; page: number; pageSize: number }> => {
  return listKandidati(query);
};

export const getKandidatService = async (jmbg: string): Promise<KandidatRecord> => {
  return getKandidatByJmbg(jmbg);
};

export const updateKandidatService = async (
  jmbg: string,
  payload: KandidatMutationInput,
): Promise<void> => {
  await updateKandidat(jmbg, payload);
};

export const deleteKandidatService = async (jmbg: string): Promise<void> => {
  await deleteKandidat(jmbg);
};
