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
  PrijavaStatusUpdateInput,
} from "../../types/modules/prijave";
import type { UserRole } from "../../types/modules/auth";

export const listPrijaveService = async (
  query: Record<string, unknown>,
): Promise<{ rows: PrijavaRecord[]; page: number; pageSize: number }> => {
  return listPrijave(query);
};

export const getPrijavaService = async (key: PrijavaKey): Promise<PrijavaRecord> => {
  return getPrijavaByKey(key);
};

const ensureRequiredStudentFields = (payload: PrijavaMutationInput): void => {
  const missingFields: string[] = [];

  if (!payload.jmbg) {
    missingFields.push("jmbg");
  }
  if (!payload.imePrezime) {
    missingFields.push("imePrezime");
  }
  if (!payload.kandidat?.emailVrednost) {
    missingFields.push("kandidat.emailVrednost");
  }
  if (!payload.kandidat?.adresaUlica) {
    missingFields.push("kandidat.adresaUlica");
  }
  if (!payload.kandidat?.adresaGrad) {
    missingFields.push("kandidat.adresaGrad");
  }
  if (payload.kandidat?.adresaBroj == null) {
    missingFields.push("kandidat.adresaBroj");
  }

  if (missingFields.length) {
    throw new ApiError(
      400,
      "Nedostaju podaci kandidata",
      `Za studentsku prijavu obavezna su polja: ${missingFields.join(", ")}.`,
    );
  }
};

const ensureStudentKandidatFromPrijava = async (payload: PrijavaMutationInput): Promise<void> => {
  ensureRequiredStudentFields(payload);

  const jmbg = payload.jmbg as string;
  const imePrezime = payload.imePrezime as string;
  const kandidat = payload.kandidat as {
    emailVrednost: string;
    adresaUlica: string;
    adresaBroj: number;
    adresaGrad: string;
  };

  const existing = await findKandidatByJmbg(jmbg);

  if (existing) {
    await updateKandidat(jmbg, {
      jmbg,
      imePrezime,
      emailVrednost: kandidat.emailVrednost,
      adresaUlica: kandidat.adresaUlica,
      adresaBroj: kandidat.adresaBroj,
      adresaGrad: kandidat.adresaGrad,
      tipKandidata: existing.tipKandidata,
      serijskiBroj: existing.serijskiBroj,
    });
    return;
  }

  const nextSerijskiBroj = await getNextKandidatSerijskiBroj();

  await insertKandidat({
    jmbg,
    imePrezime,
    emailVrednost: kandidat.emailVrednost,
    adresaUlica: kandidat.adresaUlica,
    adresaBroj: kandidat.adresaBroj,
    adresaGrad: kandidat.adresaGrad,
    tipKandidata: "MASTER",
    serijskiBroj: nextSerijskiBroj,
  });
};

const ensureKandidatExists = async (jmbg: string | null): Promise<void> => {
  if (!jmbg) {
    throw new ApiError(
      400,
      "Nedostaje JMBG kandidata",
      "Za kreiranje prijave potrebno je uneti JMBG kandidata.",
    );
  }

  const existing = await findKandidatByJmbg(jmbg);
  if (!existing) {
    throw new ApiError(400, "Kandidat nije pronadjen", "Uneti JMBG ne postoji u tabeli Kandidat.");
  }
};

export const createPrijavaService = async (
  payload: PrijavaMutationInput,
  actorRole: UserRole,
): Promise<PrijavaKey> => {
  if (actorRole === "student") {
    await ensureStudentKandidatFromPrijava(payload);
  } else {
    await ensureKandidatExists(payload.jmbg ?? null);
  }

  return insertPrijava(payload);
};

export const updatePrijavaService = async (
  key: PrijavaKey,
  payload: PrijavaMutationInput,
): Promise<void> => {
  await updatePrijava(key, payload);
};

export const updatePrijavaStatusService = async (
  key: PrijavaKey,
  payload: PrijavaStatusUpdateInput,
): Promise<void> => {
  const allowedStatuses = new Set(["Submitted", "Eligible", "Rejected"]);

  if (!payload.statusPrijave || !allowedStatuses.has(payload.statusPrijave)) {
    throw new ApiError(
      400,
      "Neispravan status prijave",
      "Dozvoljene vrednosti su: Submitted, Eligible, Rejected.",
    );
  }

  await updatePrijavaStatus(key, payload);
};

export const deletePrijavaService = async (key: PrijavaKey): Promise<void> => {
  await deletePrijava(key);
};
