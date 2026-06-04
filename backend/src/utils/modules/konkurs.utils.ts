import { ApiError } from "../../shared/apiError";
import type { KonkursRecord, KonkursStatus } from "../../types/modules/konkurs";
import type { KonkursWithStavkaRow } from "../../types/modules/konkursRepository";

export const parseGodinaKonkursa = (value: unknown): number | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !raw.trim().length) {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.trunc(parsed);
};

export const toSkolskaGodinaFromKonkursYear = (
  godinaKonkursa: number | undefined,
): string | undefined => {
  if (godinaKonkursa == null || !Number.isFinite(godinaKonkursa)) {
    return undefined;
  }

  return String(godinaKonkursa);
};

export const normalizeKonkursStatus = (status: string | undefined): KonkursStatus => {
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

export const parseIsoDateStrict = (value: string, fieldLabel: string): Date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, "Neispravan datum", `${fieldLabel} mora biti u formatu YYYY-MM-DD.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Neispravan datum", `${fieldLabel} nije validan datum.`);
  }

  return date;
};

export const toSchoolYearLabel = (godinaKonkursa: number): string => String(godinaKonkursa);

export const mapRowsToKonkursi = (rows: KonkursWithStavkaRow[]): KonkursRecord[] => {
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
        status: normalizeKonkursStatus(row.STATUS_KONKURSA ?? undefined),
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
