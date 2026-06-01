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
import { validateKonkursForPrijavaService } from "../konkurs/konkurs.service";

export const listPrijaveService = async (
  query: Record<string, unknown>,
): Promise<{ rows: PrijavaRecord[]; page: number; pageSize: number }> => {
  return listPrijave(query);
};

export const getPrijavaService = async (key: PrijavaKey): Promise<PrijavaRecord> => {
  return getPrijavaByKey(key);
};

const ensureRequiredKandidatSetupFields = (payload: StudentKandidatSetupInput): void => {
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
      `Za kreiranje kandidata obavezna su polja: ${missingFields.join(", ")}.`,
    );
  }
};

export const addStudentKandidatiService = async (
  payload: StudentKandidatSetupInput,
): Promise<void> => {
  ensureRequiredKandidatSetupFields(payload);

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

const ensureProgramSelected = (idPrograma: number | null): void => {
  if (!idPrograma || !Number.isFinite(idPrograma) || idPrograma <= 0) {
    throw new ApiError(
      400,
      "Nedostaje studijski program",
      "Za prijavu je obavezno izabrati studijski program i modul.",
    );
  }
};

const ensureKonkursSelected = (idKonkursa: number | null): void => {
  if (!idKonkursa || !Number.isFinite(idKonkursa) || idKonkursa <= 0) {
    throw new ApiError(400, "Nedostaje konkurs", "Za prijavu je obavezno izabrati konkurs.");
  }
};

export const createPrijavaService = async (
  payload: PrijavaMutationInput,
  actorRole: UserRole,
  actorUserId?: number,
): Promise<PrijavaKey> => {
  ensureProgramSelected(payload.idPrograma);
  ensureKonkursSelected(payload.idKonkursa);

  const konkursValidation = await validateKonkursForPrijavaService(
    payload.idKonkursa as number,
    payload.idPrograma as number,
  );

  const payloadWithOwner: PrijavaMutationInput = {
    ...payload,
    skolskaGodina: normalizeSchoolYear(konkursValidation.skolskaGodina),
    konkursniRok: konkursValidation.konkursniRok,
    idKorisnika: actorRole === "student" ? (actorUserId ?? null) : (payload.idKorisnika ?? null),
  };

  if (actorRole === "student") {
    if (!actorUserId) {
      throw new ApiError(401, "Autentikacija", "Korisnik nije autentifikovan.");
    }

    await ensureKandidatExists(payloadWithOwner.jmbg ?? null);
  } else {
    await ensureKandidatExists(payloadWithOwner.jmbg ?? null);
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
  const allowedStatuses = new Set(["Podneta", "Odobrena", "Odbijena"]);

  if (!payload.statusPrijave || !allowedStatuses.has(payload.statusPrijave)) {
    throw new ApiError(
      400,
      "Neispravan status prijave",
      "Dozvoljene vrednosti su: Podneta, Odobrena, Odbijena.",
    );
  }

  await updatePrijavaStatus(key, payload);
};

export const deletePrijavaService = async (key: PrijavaKey): Promise<void> => {
  await deletePrijava(key);
};
