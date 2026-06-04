import { ApiError } from "../../shared/apiError";
import type { RankingItem } from "../../types/modules/upis";
import { normalizeSchoolYear } from "../utils";

const finalizedEnrollmentStatuses = new Set(["Odobrena", "Odbijena"]);

export const toProgramLabel = (nazivPrograma: string | null, modul: string | null): string => {
  if (!nazivPrograma || !modul) {
    return "-";
  }

  return `${nazivPrograma} | ${modul}`.slice(0, 100);
};

export const ensurePositiveNumber = (value: number, title: string, message: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ApiError(400, title, message);
  }

  return value;
};

export const isOracleUniqueConstraintError = (
  error: unknown,
): error is Error & { errorNum?: number } => {
  return error instanceof Error && "errorNum" in error && error.errorNum === 1;
};

export const isFinalRankingGenerated = (items: RankingItem[]): boolean => {
  return (
    items.length > 0 &&
    items.every((item) => item.status != null && finalizedEnrollmentStatuses.has(item.status))
  );
};

export const buildFinalRankingLockedMessage = (
  studijskiProgram: string,
  skolskaGodina: string,
): string => {
  return `Konacna rang lista za ${studijskiProgram} u skolskoj godini ${skolskaGodina} je vec generisana i ne moze se ponovo generisati.`;
};

export const buildGeneratedIndexNumber = (skolskaGodina: string, brojPrijave: number): string => {
  const year = normalizeSchoolYear(skolskaGodina);
  const serial = String(brojPrijave).padStart(5, "0");
  return `EUP-${year}-${serial}`;
};

export const calculateRanks = (
  items: RankingItem[],
): Array<{ idStavke: number; rangMesto: number }> => {
  let previousScore: number | null = null;
  let rank = 0;

  return items.map((item, index) => {
    const currentScore = item.brojPoena;

    if (currentScore !== previousScore) {
      rank = index + 1;
      previousScore = currentScore;
    }

    return {
      idStavke: item.idStavke,
      rangMesto: rank,
    };
  });
};
