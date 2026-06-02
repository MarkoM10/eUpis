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

  return "Nacrt";
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

const toSchoolYearLabel = (godinaKonkursa: number): string => String(godinaKonkursa);

const mapRowsToKonkursi = (
  rows: Awaited<ReturnType<typeof listKonkursiWithStavke>>,
): KonkursRecord[] => {
  const byId = new Map<number, KonkursRecord>();

  rows.forEach((row) => {
    const existing = byId.get(row.ID_KONKURSA);

    if (!existing) {
      byId.set(row.ID_KONKURSA, {
        idKonkursa: row.ID_KONKURSA,
        idFakulteta: row.ID_FAKULTETA,
        nazivFakulteta: row.NAZIV_FAKULTETA,
        godinaKonkursa: row.GODINA_KONKURSA,
        konkursniRok: row.KONKURSNI_ROK,
        datumOd: row.DATUM_OD.toISOString().slice(0, 10),
        datumDo: row.DATUM_DO.toISOString().slice(0, 10),
        status: normalizeStatus(row.STATUS_KONKURSA ?? undefined),
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
    idFakulteta: k.idFakulteta,
    nazivFakulteta: k.nazivFakulteta,
    godinaKonkursa: k.godinaKonkursa,
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
  const statusKonkursa = normalizeStatus(payload.status);
  const godinaKonkursa = Math.trunc(payload.godinaKonkursa);

  if (!Number.isFinite(godinaKonkursa) || godinaKonkursa < 1900 || godinaKonkursa > 3000) {
    throw new ApiError(400, "Neispravna godina konkursa", "Godina konkursa mora biti broj.");
  }

  const idKonkursa = await getNextKonkursId();

  await insertKonkurs({
    idKonkursa,
    idFakulteta: Math.trunc(payload.idFakulteta),
    godinaKonkursa,
    rokZaPrijavu: payload.datumDo,
    statusKonkursa,
    konkursniRok: payload.konkursniRok.trim(),
    datumOd: payload.datumOd.trim(),
    datumDo: payload.datumDo.trim(),
    createdByUserId: actorUserId ?? null,
  });

  for (const stavka of payload.stavke) {
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

  await updateKonkursStatus(idKonkursa, normalized);
};

export const validateKonkursForPrijavaService = async (
  idKonkursa: number,
  idPrograma: number,
): Promise<{ skolskaGodina: string; konkursniRok: string }> => {
  const konkurs = await findKonkursById(idKonkursa);

  if (!konkurs) {
    throw new ApiError(400, "Konkurs nije pronadjen", "Izabrani konkurs ne postoji.");
  }

  if (normalizeStatus(konkurs.STATUS_KONKURSA ?? undefined) !== "Aktivan") {
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
    skolskaGodina: toSchoolYearLabel(konkurs.GODINA_KONKURSA),
    konkursniRok: konkurs.KONKURSNI_ROK,
  };
};
