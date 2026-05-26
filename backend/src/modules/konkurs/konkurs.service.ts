import { ApiError } from "../../shared/apiError";
import type {
  ActiveKonkursOption,
  CreateKonkursInput,
  KonkursRecord,
  KonkursStatus,
} from "../../types/modules/konkurs";
import {
  findKonkursById,
  getNextKonkursId,
  getNextKonkursStavkaId,
  insertKonkurs,
  insertKonkursStavka,
  isProgramInKonkurs,
  listActiveKonkursiWithStavke,
  listKonkursiWithStavke,
  updateKonkursStatus,
} from "./konkurs.repository";

const normalizeStatus = (status: string | undefined): KonkursStatus => {
  if (!status) {
    return "Nacrt";
  }

  if (
    status === "Nacrt" ||
    status === "Aktivan" ||
    status === "Zatvoren" ||
    status === "Arhiviran"
  ) {
    return status;
  }

  throw new ApiError(
    400,
    "Neispravan status konkursa",
    "Dozvoljene vrednosti su: Nacrt, Aktivan, Zatvoren, Arhiviran.",
  );
};

const toLegacyStatusKonkursa = (status: KonkursStatus): "Aktivan" | "Zatvoren" | null => {
  if (status === "Aktivan") {
    return "Aktivan";
  }

  if (status === "Zatvoren") {
    return "Zatvoren";
  }

  return null;
};

const parseIsoDateStrict = (value: string, fieldLabel: string): Date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, "Neispravan datum", `${fieldLabel} mora biti u formatu YYYY-MM-DD.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Neispravan datum", `${fieldLabel} nije validan datum.`);
  }

  return date;
};

const extractLegacyGodinaKonkursa = (skolskaGodina: string): number => {
  const normalized = skolskaGodina.trim();
  const match = normalized.match(/^(\d{4})/);

  if (!match) {
    throw new ApiError(
      400,
      "Neispravna skolska godina",
      "Skolska godina mora poceti cetvorocifrenom godinom (npr. 2025/2026).",
    );
  }

  return Number(match[1]);
};

const mapRowsToKonkursi = (
  rows: Awaited<ReturnType<typeof listKonkursiWithStavke>>,
): KonkursRecord[] => {
  const byId = new Map<number, KonkursRecord>();

  rows.forEach((row) => {
    const existing = byId.get(row.ID_KONKURSA);

    if (!existing) {
      byId.set(row.ID_KONKURSA, {
        idKonkursa: row.ID_KONKURSA,
        skolskaGodina: row.SKOLSKA_GODINA,
        konkursniRok: row.KONKURSNI_ROK,
        datumOd: row.DATUM_OD.toISOString().slice(0, 10),
        datumDo: row.DATUM_DO.toISOString().slice(0, 10),
        status: row.STATUS,
        stavke:
          row.ID_STAVKE_KONKURSA == null ||
          row.ID_PROGRAMA == null ||
          row.BROJ_DOSTUPNIH_MESTA == null
            ? []
            : [
                {
                  idStavkeKonkursa: row.ID_STAVKE_KONKURSA,
                  idKonkursa: row.ID_KONKURSA,
                  idPrograma: row.ID_PROGRAMA,
                  nazivPrograma: row.NAZIV_PROGRAMA,
                  modul: row.MODUL,
                  brojDostupnihMesta: row.BROJ_DOSTUPNIH_MESTA,
                },
              ],
      });
      return;
    }

    if (
      row.ID_STAVKE_KONKURSA != null &&
      row.ID_PROGRAMA != null &&
      row.BROJ_DOSTUPNIH_MESTA != null
    ) {
      existing.stavke.push({
        idStavkeKonkursa: row.ID_STAVKE_KONKURSA,
        idKonkursa: row.ID_KONKURSA,
        idPrograma: row.ID_PROGRAMA,
        nazivPrograma: row.NAZIV_PROGRAMA,
        modul: row.MODUL,
        brojDostupnihMesta: row.BROJ_DOSTUPNIH_MESTA,
      });
    }
  });

  return Array.from(byId.values());
};

export const listKonkursiService = async (): Promise<KonkursRecord[]> => {
  const rows = await listKonkursiWithStavke();
  return mapRowsToKonkursi(rows);
};

export const listActiveKonkursiService = async (): Promise<ActiveKonkursOption[]> => {
  const rows = await listActiveKonkursiWithStavke();
  return mapRowsToKonkursi(rows).map((k) => ({
    idKonkursa: k.idKonkursa,
    skolskaGodina: k.skolskaGodina,
    konkursniRok: k.konkursniRok,
    datumOd: k.datumOd,
    datumDo: k.datumDo,
    stavke: k.stavke.map((s) => ({
      idStavkeKonkursa: s.idStavkeKonkursa,
      idPrograma: s.idPrograma,
      nazivPrograma: s.nazivPrograma,
      modul: s.modul,
      brojDostupnihMesta: s.brojDostupnihMesta,
    })),
  }));
};

export const createKonkursService = async (
  payload: CreateKonkursInput,
  actorUserId?: number,
): Promise<{ idKonkursa: number }> => {
  if (!payload.skolskaGodina?.trim()) {
    throw new ApiError(400, "Nedostaje skolska godina", "Skolska godina je obavezna.");
  }

  if (!payload.konkursniRok?.trim()) {
    throw new ApiError(400, "Nedostaje konkursni rok", "Konkursni rok je obavezan.");
  }

  if (!payload.datumOd || !payload.datumDo) {
    throw new ApiError(400, "Nedostaju datumi konkursa", "Datum od i datum do su obavezni.");
  }

  const datumOd = parseIsoDateStrict(payload.datumOd, "Datum od");
  const datumDo = parseIsoDateStrict(payload.datumDo, "Datum do");

  if (datumOd.getTime() > datumDo.getTime()) {
    throw new ApiError(400, "Neispravan period konkursa", "Datum od ne moze biti posle datuma do.");
  }

  if (!Array.isArray(payload.stavke) || payload.stavke.length === 0) {
    throw new ApiError(
      400,
      "Nedostaju stavke konkursa",
      "Potrebno je uneti bar jedan program/modul.",
    );
  }

  const status = normalizeStatus(payload.status);
  const godinaKonkursaLegacy = extractLegacyGodinaKonkursa(payload.skolskaGodina);
  const statusKonkursaLegacy = toLegacyStatusKonkursa(status);
  const idKonkursa = await getNextKonkursId();

  await insertKonkurs({
    idKonkursa,
    skolskaGodina: payload.skolskaGodina.trim(),
    godinaKonkursaLegacy,
    rokZaPrijavuLegacy: payload.datumDo,
    statusKonkursaLegacy,
    konkursniRok: payload.konkursniRok.trim(),
    datumOd: payload.datumOd.trim(),
    datumDo: payload.datumDo.trim(),
    status,
    createdByUserId: actorUserId ?? null,
  });

  const seenPrograms = new Set<number>();

  for (const stavka of payload.stavke) {
    if (!Number.isFinite(stavka.idPrograma) || stavka.idPrograma <= 0) {
      throw new ApiError(400, "Neispravan program", "idPrograma mora biti pozitivan broj.");
    }

    if (!Number.isFinite(stavka.brojDostupnihMesta) || stavka.brojDostupnihMesta < 0) {
      throw new ApiError(
        400,
        "Neispravan broj mesta",
        "brojDostupnihMesta mora biti broj veci ili jednak nuli.",
      );
    }

    if (seenPrograms.has(stavka.idPrograma)) {
      throw new ApiError(
        400,
        "Duplikat programa",
        "Jedan studijski program/modul moze biti unet samo jednom u okviru konkursa.",
      );
    }

    seenPrograms.add(stavka.idPrograma);

    const idStavkeKonkursa = await getNextKonkursStavkaId();
    await insertKonkursStavka({
      idStavkeKonkursa,
      idKonkursa,
      idPrograma: stavka.idPrograma,
      brojDostupnihMesta: Math.trunc(stavka.brojDostupnihMesta),
    });
  }

  return { idKonkursa };
};

export const updateKonkursStatusService = async (
  idKonkursa: number,
  status: string,
): Promise<void> => {
  const normalized = normalizeStatus(status);
  const konkurs = await findKonkursById(idKonkursa);

  if (!konkurs) {
    throw new ApiError(404, "Konkurs nije pronadjen", "Ne postoji trazeni konkurs.");
  }

  await updateKonkursStatus(idKonkursa, normalized, toLegacyStatusKonkursa(normalized));
};

export const validateKonkursForPrijavaService = async (
  idKonkursa: number,
  idPrograma: number,
): Promise<{ skolskaGodina: string; konkursniRok: string }> => {
  const konkurs = await findKonkursById(idKonkursa);

  if (!konkurs) {
    throw new ApiError(400, "Konkurs nije pronadjen", "Izabrani konkurs ne postoji.");
  }

  if (konkurs.STATUS !== "Aktivan") {
    throw new ApiError(
      400,
      "Konkurs nije aktivan",
      "Prijava je dozvoljena samo na aktivan konkurs.",
    );
  }

  const today = new Date();
  const from = new Date(konkurs.DATUM_OD);
  const to = new Date(konkurs.DATUM_DO);

  if (today < from || today > to) {
    throw new ApiError(
      400,
      "Konkurs nije u toku",
      "Rok za prijavu na ovaj konkurs trenutno nije otvoren.",
    );
  }

  const programAllowed = await isProgramInKonkurs(idKonkursa, idPrograma);
  if (!programAllowed) {
    throw new ApiError(
      400,
      "Program nije deo konkursa",
      "Izabrani studijski program/modul nije dostupan u okviru odabranog konkursa.",
    );
  }

  return {
    skolskaGodina: konkurs.SKOLSKA_GODINA,
    konkursniRok: konkurs.KONKURSNI_ROK,
  };
};
