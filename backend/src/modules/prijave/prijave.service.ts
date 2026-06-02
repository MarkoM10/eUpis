import {
  deletePrijava,
  getPrijavaByKey,
  insertPrijava,
  listPrijave,
  updatePrijava,
  updatePrijavaStatus,
} from "./prijave.repository";
import { ApiError } from "../../shared/apiError";
import {
  findKandidatByJmbg,
  getNextKandidatSerijskiBroj,
  insertKandidat,
  updateKandidat,
} from "../kandidati/kandidati.repository";
import type {
  PrijavaKey,
  PrijavaMutationInput,
  PrijavaRecord,
  StudentKandidatSetupInput,
  PrijavaStatusUpdateInput,
} from "../../types/modules/prijave";
import type { UserRole } from "../../types/modules/auth";
import { normalizeSchoolYear } from "../../utils/utils";

export const listPrijaveService = async (
  query: Record<string, unknown>,
): Promise<{ rows: PrijavaRecord[]; page: number; pageSize: number }> => {
  return listPrijave(query);
};

export const getPrijavaService = async (key: PrijavaKey): Promise<PrijavaRecord> => {
  return getPrijavaByKey(key);
};

export const addStudentKandidatiService = async (
  payload: StudentKandidatSetupInput,
): Promise<void> => {
  const jmbg = payload.jmbg ?? "";
  const imePrezime = payload.imePrezime ?? "";
  const kandidat = payload.kandidat ?? {
    emailVrednost: null,
    adresaUlica: null,
    adresaBroj: null,
    adresaGrad: null,
  };

  const existing = await findKandidatByJmbg(jmbg);

  if (existing) {
    await updateKandidat(jmbg, {
      jmbg,
      imePrezime,
      emailVrednost: kandidat.emailVrednost ?? "",
      adresaUlica: kandidat.adresaUlica ?? "",
      adresaBroj: kandidat.adresaBroj ?? 0,
      adresaGrad: kandidat.adresaGrad ?? "",
      tipKandidata: existing.tipKandidata,
      serijskiBroj: existing.serijskiBroj,
    });
    return;
  }

  const nextSerijskiBroj = await getNextKandidatSerijskiBroj();

  await insertKandidat({
    jmbg,
    imePrezime,
    emailVrednost: kandidat.emailVrednost ?? "",
    adresaUlica: kandidat.adresaUlica ?? "",
    adresaBroj: kandidat.adresaBroj ?? 0,
    adresaGrad: kandidat.adresaGrad ?? "",
    tipKandidata: "MASTER",
    serijskiBroj: nextSerijskiBroj,
  });
};

export const createPrijavaService = async (
  payload: PrijavaMutationInput,
  actorRole: UserRole,
  actorUserId?: number,
): Promise<PrijavaKey> => {
  const payloadWithOwner: PrijavaMutationInput = {
    ...payload,
    skolskaGodina: payload.skolskaGodina,
    konkursniRok: payload.konkursniRok,
    idKorisnika: actorRole === "student" ? (actorUserId ?? null) : (payload.idKorisnika ?? null),
  };

  if (actorRole === "student") {
    if (!actorUserId) {
      throw new ApiError(401, "Autentikacija", "Korisnik nije autentifikovan.");
    }
  }

  return insertPrijava(payloadWithOwner);
};

export const updatePrijavaService = async (
  key: PrijavaKey,
  payload: PrijavaMutationInput,
): Promise<void> => {
  await updatePrijava(key, {
    ...payload,
    skolskaGodina: normalizeSchoolYear(payload.skolskaGodina),
  });
};

export const updatePrijavaStatusService = async (
  key: PrijavaKey,
  payload: PrijavaStatusUpdateInput,
): Promise<void> => {
  await updatePrijavaStatus(key, payload);
};

export const deletePrijavaService = async (key: PrijavaKey): Promise<void> => {
  await deletePrijava(key);
};
