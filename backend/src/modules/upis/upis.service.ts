import { ApiError } from "../../shared/apiError";
import { findKorisnikByUsername, findLatestPrijavaForKorisnik } from "../auth/auth.repository";
import type {
  EnrollmentContractDownloadRecord,
  EnrollmentFinalizationRecord,
  EnrollmentFinalizationSummaryRecord,
  GenerateRankingInput,
  PendingEnrollmentFinalizationRow,
  RankingItem,
  RankingListSummary,
  SaveExamScoreInput,
  StudentAdmissionStatus,
  StudyProgramOption,
} from "../../types/modules/upis";
import {
  createRankingList,
  confirmEnrollmentFinalization,
  getEnrollmentFinalizationSummary,
  findPrijavaForExam,
  getEnrollmentContractDownload,
  getEnrollmentFinalizationByPrijava,
  findRankingItemByPrijava,
  findRankingListByProgramAndYear,
  getRankingListById,
  insertExamScore,
  listEligiblePrijave,
  listPendingEnrollmentFinalizations,
  listRankingItemsByListId,
  listRankingLists,
  listStudyPrograms,
  upsertSignedEnrollmentContract,
  updateRankingItemRank,
  updateRankingItemStatus,
  updateRankingListCandidateCount,
  updateRankingListSeats,
  updateRankingItemStudyProgram,
  updateRankingListStudyProgram,
} from "./upis.repository";
import { normalizeSchoolYear } from "../../utils/utils";

const allowedEnrollmentStatuses = new Set(["BodoviUneti", "Odobrena", "Odbijena"]);
const finalizedEnrollmentStatuses = new Set(["Odobrena", "Odbijena"]);

const toProgramLabel = (nazivPrograma: string | null, modul: string | null): string => {
  if (!nazivPrograma || !modul) {
    return "-";
  }

  return `${nazivPrograma} | ${modul}`.slice(0, 100);
};

const ensurePositiveNumber = (value: number, title: string, message: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ApiError(400, title, message);
  }

  return value;
};

const isOracleUniqueConstraintError = (error: unknown): error is Error & { errorNum?: number } => {
  return error instanceof Error && "errorNum" in error && error.errorNum === 1;
};

const isFinalRankingGenerated = (items: RankingItem[]): boolean => {
  return (
    items.length > 0 &&
    items.every((item) => item.status != null && finalizedEnrollmentStatuses.has(item.status))
  );
};

const buildFinalRankingLockedMessage = (
  studijskiProgram: string,
  skolskaGodina: string,
): string => {
  return `Konacna rang lista za ${studijskiProgram} u skolskoj godini ${skolskaGodina} je vec generisana i ne moze se ponovo generisati.`;
};

const buildGeneratedIndexNumber = (skolskaGodina: string, brojPrijave: number): string => {
  const year = normalizeSchoolYear(skolskaGodina);
  const serial = String(brojPrijave).padStart(5, "0");
  return `EUP-${year}-${serial}`;
};

const ensureStudentIsApprovedForEnrollment = async (
  username: string,
): Promise<{
  brojPrijave: number;
  skolskaGodina: string;
}> => {
  const korisnik = await findKorisnikByUsername(username);
  if (!korisnik) {
    throw new ApiError(404, "Korisnik nije pronadjen", "Nije pronadjen aktivni korisnik.");
  }

  const latestPrijava = await findLatestPrijavaForKorisnik(korisnik.idKorisnika);
  if (!latestPrijava) {
    throw new ApiError(404, "Prijava nije pronadjena", "Nemate aktivnu prijavu za upis.");
  }

  const rankingItem = await findRankingItemByPrijava(latestPrijava.brojPrijave);
  if (!rankingItem || rankingItem.status !== "Odobrena") {
    throw new ApiError(
      403,
      "Nije dozvoljeno",
      "Potpisani ugovor mozete otpremiti tek kada budete odobreni za upis.",
    );
  }

  return {
    brojPrijave: latestPrijava.brojPrijave,
    skolskaGodina: latestPrijava.skolskaGodina,
  };
};

const ensureRankingList = async (
  idKonkursa: number | null,
  idPrograma: number,
  studijskiProgram: string,
  skolskaGodina: string,
  brojMesta: number,
): Promise<RankingListSummary> => {
  const existing = await findRankingListByProgramAndYear(
    idPrograma,
    skolskaGodina,
    idKonkursa ?? undefined,
  );

  if (existing) {
    if (existing.brojMesta !== brojMesta) {
      await updateRankingListSeats(existing.idRangListe, brojMesta);

      return {
        ...existing,
        brojMesta,
      };
    }

    return existing;
  }

  let idRangListe: number;
  try {
    idRangListe = await createRankingList(
      idKonkursa,
      idPrograma,
      studijskiProgram,
      skolskaGodina,
      brojMesta,
    );
  } catch (error) {
    if (isOracleUniqueConstraintError(error)) {
      const concurrentExisting = await findRankingListByProgramAndYear(idPrograma, skolskaGodina);

      if (concurrentExisting) {
        return concurrentExisting;
      }
    }

    throw error;
  }

  return {
    idRangListe,
    idKonkursa,
    idPrograma,
    nazivPrograma: null,
    modul: null,
    studijskiProgram,
    skolskaGodina,
    brojMesta,
    ukupnoKandidata: 0,
  };
};

const calculateRanks = (items: RankingItem[]): Array<{ idStavke: number; rangMesto: number }> => {
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

export const listStudyProgramsService = async (
  idFakulteta?: number,
): Promise<StudyProgramOption[]> => {
  return listStudyPrograms(idFakulteta);
};

export const listEligiblePrijaveService = async (skolskaGodina?: string) => {
  return listEligiblePrijave(skolskaGodina ? normalizeSchoolYear(skolskaGodina) : undefined);
};

export const listEligiblePrijaveByKonkursService = async (
  idKonkursa: number,
  skolskaGodina?: string,
) => {
  return listEligiblePrijave(
    skolskaGodina ? normalizeSchoolYear(skolskaGodina) : undefined,
    idKonkursa,
  );
};

export const saveExamScoreService = async (
  payload: SaveExamScoreInput,
): Promise<{ idStavke: number }> => {
  const normalizedSchoolYear = normalizeSchoolYear(payload.skolskaGodina);
  const brojPoena = Number(payload.brojPoena);
  if (!Number.isFinite(brojPoena) || brojPoena < 0 || brojPoena > 100) {
    throw new ApiError(400, "Neispravan broj poena", "Broj poena mora biti izmedju 0 i 100.");
  }

  const prijava = await findPrijavaForExam(payload.brojPrijave, normalizedSchoolYear);
  if (!prijava) {
    throw new ApiError(404, "Prijava nije pronadjena", "Ne postoji trazena prijava.");
  }

  if (!prijava.idPrograma) {
    throw new ApiError(
      400,
      "Prijava nije povezana sa programom",
      "Nije moguce evidentirati rezultat dok prijava nema izabran studijski program.",
    );
  }

  if (prijava.rankingStatus != null) {
    throw new ApiError(
      409,
      "Rezultat ispita vec postoji",
      "Za ovu prijavu je vec sacuvan rezultat. Dozvoljen je samo jedan pokusaj.",
    );
  }

  if (
    (prijava as { statusPrijave?: string }).statusPrijave &&
    (prijava as { statusPrijave?: string }).statusPrijave !== "Odobrena"
  ) {
    throw new ApiError(
      400,
      "Prijava nije Odobrena",
      "Rezultat ispita se moze uneti samo za prijave sa statusom Odobrena.",
    );
  }

  const programs = await listStudyPrograms();
  const matchedProgram = programs.find((program) => program.idPrograma === prijava.idPrograma);

  if (!matchedProgram) {
    throw new ApiError(
      400,
      "Program nije pronadjen",
      "Program iz prijave nije pronadjen u sifarniku studijskih programa.",
    );
  }

  const seats = matchedProgram?.brojDostupnihMesta ?? 0;
  const studijskiProgram = toProgramLabel(matchedProgram.nazivPrograma, matchedProgram.modul);
  const rankingList = await ensureRankingList(
    prijava.idKonkursa ?? null,
    prijava.idPrograma,
    studijskiProgram,
    normalizedSchoolYear,
    seats > 0 ? seats : 1,
  );

  const idStavke = await insertExamScore({
    idRangListe: rankingList.idRangListe,
    brojPrijave: payload.brojPrijave,
    idPrograma: prijava.idPrograma,
    imePrezime: prijava.imePrezime,
    brojPoena,
  });

  return { idStavke };
};

export const generateRankingService = async (
  payload: GenerateRankingInput,
): Promise<{
  idRangListe: number;
  totalCandidates: number;
  approvedCount: number;
  rejectedCount: number;
}> => {
  const idPrograma = ensurePositiveNumber(
    Number(payload.idPrograma),
    "Neispravan program",
    "ID programa mora biti validan pozitivan broj.",
  );
  const normalizedSchoolYear = normalizeSchoolYear(payload.skolskaGodina);
  const idKonkursa =
    payload.idKonkursa != null && Number.isFinite(Number(payload.idKonkursa))
      ? Number(payload.idKonkursa)
      : undefined;

  const programs = await listStudyPrograms();
  const program = programs.find((entry) => entry.idPrograma === idPrograma);
  if (!program) {
    throw new ApiError(404, "Program nije pronadjen", "Nije pronadjen trazeni studijski program.");
  }

  const brojMesta = ensurePositiveNumber(
    Number(payload.brojMesta),
    "Neispravan broj mesta",
    "Broj dostupnih mesta za izabrani konkurs i program mora biti veci od 0.",
  );

  const studijskiProgram = toProgramLabel(program.nazivPrograma, program.modul);
  const existingRankingList = await findRankingListByProgramAndYear(
    idPrograma,
    normalizedSchoolYear,
    idKonkursa,
  );

  if (existingRankingList) {
    const existingItems = await listRankingItemsByListId(existingRankingList.idRangListe);

    if (isFinalRankingGenerated(existingItems)) {
      throw new ApiError(
        409,
        "Konacna rang lista je vec generisana",
        buildFinalRankingLockedMessage(studijskiProgram, normalizedSchoolYear),
      );
    }
  }

  const eligibleRows = await listEligiblePrijave(normalizedSchoolYear, idKonkursa);
  const programEligibleRows = eligibleRows.filter(
    (row) => row.idPrograma === idPrograma && (idKonkursa == null || row.idKonkursa === idKonkursa),
  );

  if (programEligibleRows.length === 0) {
    throw new ApiError(
      400,
      "Nema odobrenih prijava",
      "Za izabrani studijski program nema odobrenih prijava za obradu.",
    );
  }

  const missingScores = programEligibleRows.filter((row) => row.examPoints == null);
  if (missingScores.length > 0) {
    throw new ApiError(
      400,
      "Nisu uneti svi bodovi",
      "Pre generisanja konacne rang liste potrebno je uneti bodove za sve odobrene prijave izabranog studijskog programa.",
    );
  }

  const rankingList = await ensureRankingList(
    idKonkursa ?? programEligibleRows[0]?.idKonkursa ?? null,
    idPrograma,
    studijskiProgram,
    normalizedSchoolYear,
    brojMesta,
  );

  const items = await listRankingItemsByListId(rankingList.idRangListe);
  if (items.length === 0) {
    throw new ApiError(
      400,
      "Nema rezultata ispita",
      "Nije moguce generisati rang listu bez unetih rezultata ispita.",
    );
  }

  const { approvedCount, rejectedCount } = await finalizeRankingService(rankingList.idRangListe);

  return {
    idRangListe: rankingList.idRangListe,
    totalCandidates: items.length,
    approvedCount,
    rejectedCount,
  };
};

export const finalizeRankingService = async (
  idRangListe: number,
): Promise<{ approvedCount: number; rejectedCount: number }> => {
  const rankingList = await getRankingListById(idRangListe);
  if (!rankingList) {
    throw new ApiError(404, "Rang lista nije pronadjena", "Ne postoji trazena rang lista.");
  }

  const items = await listRankingItemsByListId(idRangListe);
  if (items.length === 0) {
    throw new ApiError(400, "Rang lista je prazna", "Nema kandidata za finalizaciju.");
  }

  if (isFinalRankingGenerated(items)) {
    throw new ApiError(
      409,
      "Konacna rang lista je vec generisana",
      buildFinalRankingLockedMessage(
        rankingList.studijskiProgram ?? "izabrani studijski program",
        rankingList.skolskaGodina ?? "izabranu skolsku godinu",
      ),
    );
  }

  const effectiveSeats = ensurePositiveNumber(
    Number(rankingList.brojMesta ?? 0),
    "Neispravan broj mesta",
    "Broj dostupnih mesta na rang listi mora biti veci od 0.",
  );

  const computedRanks = calculateRanks(items);
  for (const entry of computedRanks) {
    await updateRankingItemRank(entry.idStavke, entry.rangMesto);
  }

  const validScores = items
    .map((item) => item.brojPoena)
    .filter((value): value is number => value != null);
  let cutoffScore: number | null = null;
  const seats = effectiveSeats;

  if (seats > 0 && validScores.length > 0) {
    if (validScores.length >= seats) {
      cutoffScore = validScores[seats - 1] ?? null;
    } else {
      cutoffScore = validScores[validScores.length - 1] ?? null;
    }
  }

  let approvedCount = 0;
  let rejectedCount = 0;

  for (const item of items) {
    const score = item.brojPoena;
    const status =
      cutoffScore != null && score != null && score >= cutoffScore ? "Odobrena" : "Odbijena";

    if (!allowedEnrollmentStatuses.has(status)) {
      continue;
    }

    if (status === "Odobrena") {
      approvedCount += 1;
    } else {
      rejectedCount += 1;
    }

    await updateRankingItemStatus(item.idStavke, status);
  }

  await updateRankingListCandidateCount(idRangListe, items.length);

  return {
    approvedCount,
    rejectedCount,
  };
};

export const listRankingListsService = async (
  idKonkursa?: number,
  idPrograma?: number,
  skolskaGodina?: string,
): Promise<RankingListSummary[]> => {
  return listRankingLists(
    idKonkursa,
    idPrograma,
    skolskaGodina ? normalizeSchoolYear(skolskaGodina) : undefined,
  );
};

export const listRankingItemsService = async (idRangListe: number): Promise<RankingItem[]> => {
  return listRankingItemsByListId(idRangListe);
};

export const updateRankingListStudyProgramService = async (input: {
  idRangListe: number;
  studijskiProgram: string;
}): Promise<void> => {
  if (!Number.isFinite(input.idRangListe) || input.idRangListe <= 0) {
    throw new ApiError(400, "Neispravan identifikator", "ID rang liste mora biti validan.");
  }

  await updateRankingListStudyProgram(input.idRangListe, input.studijskiProgram);
};

export const updateRankingItemStudyProgramService = async (input: {
  idStavke: number;
  studijskiProgram: string;
}): Promise<void> => {
  if (!Number.isFinite(input.idStavke) || input.idStavke <= 0) {
    throw new ApiError(400, "Neispravan identifikator", "ID stavke mora biti validan.");
  }

  await updateRankingItemStudyProgram(input.idStavke, input.studijskiProgram);
};

export const uploadSignedEnrollmentContractService = async (input: {
  username: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileContent: Buffer;
}): Promise<EnrollmentFinalizationRecord> => {
  if (!input.fileContent.length) {
    throw new ApiError(400, "Fajl nedostaje", "Potrebno je izabrati potpisani ugovor.");
  }

  const latest = await ensureStudentIsApprovedForEnrollment(input.username);

  return upsertSignedEnrollmentContract({
    brojPrijave: latest.brojPrijave,
    skolskaGodina: latest.skolskaGodina,
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    fileContent: input.fileContent,
  });
};

export const downloadStudentSignedEnrollmentContractService = async (
  username: string,
): Promise<EnrollmentContractDownloadRecord> => {
  const latest = await ensureStudentIsApprovedForEnrollment(username);
  return getEnrollmentContractDownload(latest.brojPrijave, latest.skolskaGodina);
};

export const downloadEnrollmentContractByPrijavaService = async (
  brojPrijave: number,
  skolskaGodina: string,
): Promise<EnrollmentContractDownloadRecord> => {
  return getEnrollmentContractDownload(brojPrijave, skolskaGodina);
};

export const listPendingEnrollmentFinalizationsService = async (
  skolskaGodina?: string,
  idKonkursa?: number,
): Promise<PendingEnrollmentFinalizationRow[]> => {
  return listPendingEnrollmentFinalizations(
    skolskaGodina ? normalizeSchoolYear(skolskaGodina) : undefined,
    idKonkursa,
  );
};

export const getEnrollmentFinalizationSummaryService = async (
  skolskaGodina?: string,
): Promise<EnrollmentFinalizationSummaryRecord> => {
  return getEnrollmentFinalizationSummary(
    skolskaGodina ? normalizeSchoolYear(skolskaGodina) : undefined,
  );
};

export const confirmEnrollmentFinalizationService = async (input: {
  brojPrijave: number;
  skolskaGodina: string;
  adminUserId: number;
}): Promise<EnrollmentFinalizationRecord> => {
  const rankingItem = await findRankingItemByPrijava(input.brojPrijave);
  if (!rankingItem || rankingItem.status !== "Odobrena") {
    throw new ApiError(
      400,
      "Upis nije odobren",
      "Finalizacija je moguca samo za studenta koji ima status Odobrena na konacnoj rang listi.",
    );
  }

  const finalization = await getEnrollmentFinalizationByPrijava(
    input.brojPrijave,
    input.skolskaGodina,
  );
  if (!finalization || !finalization.hasSignedContract) {
    throw new ApiError(
      400,
      "Potpisani ugovor nedostaje",
      "Pre finalizacije je neophodno da student otpremi potpisani ugovor o studiranju.",
    );
  }

  if (finalization.statusUpisa === "UpisZavrsen" && finalization.brojIndeksa) {
    throw new ApiError(
      409,
      "Upis je vec finalizovan",
      `Student je vec upisan pod brojem indeksa ${finalization.brojIndeksa}.`,
    );
  }

  const brojIndeksa = buildGeneratedIndexNumber(input.skolskaGodina, input.brojPrijave);

  return confirmEnrollmentFinalization({
    brojPrijave: input.brojPrijave,
    skolskaGodina: input.skolskaGodina,
    brojIndeksa,
    adminUserId: input.adminUserId,
  });
};

export const getStudentAdmissionStatusService = async (
  username: string,
): Promise<StudentAdmissionStatus> => {
  const korisnik = await findKorisnikByUsername(username);
  const latestPrijava = korisnik ? await findLatestPrijavaForKorisnik(korisnik.idKorisnika) : null;

  if (!latestPrijava) {
    return {
      stage: "NemaPrijave",
      prijavaStatus: null,
      brojPrijave: null,
      skolskaGodina: null,
      idPrograma: null,
      studijskiProgram: null,
      brojPoena: null,
      rangMesto: null,
      enrollmentStatus: null,
      enrollmentFinalizationStatus: "NijePrimenljivo",
      hasSignedContract: false,
      signedContractUploadedAt: null,
      brojIndeksa: null,
      datumUpisa: null,
    };
  }

  if (latestPrijava.statusPrijave !== "Odobrena") {
    return {
      stage: "CekaObraduPrijave",
      prijavaStatus: latestPrijava.statusPrijave,
      brojPrijave: latestPrijava.brojPrijave,
      skolskaGodina: latestPrijava.skolskaGodina,
      idPrograma: null,
      studijskiProgram: null,
      brojPoena: null,
      rangMesto: null,
      enrollmentStatus: null,
      enrollmentFinalizationStatus: "NijePrimenljivo",
      hasSignedContract: false,
      signedContractUploadedAt: null,
      brojIndeksa: null,
      datumUpisa: null,
    };
  }

  const rankingItem = await findRankingItemByPrijava(latestPrijava.brojPrijave);

  if (!rankingItem) {
    return {
      stage: "OdobrenaBezBodova",
      prijavaStatus: latestPrijava.statusPrijave,
      brojPrijave: latestPrijava.brojPrijave,
      skolskaGodina: latestPrijava.skolskaGodina,
      idPrograma: null,
      studijskiProgram: null,
      brojPoena: null,
      rangMesto: null,
      enrollmentStatus: null,
      enrollmentFinalizationStatus: "NijePrimenljivo",
      hasSignedContract: false,
      signedContractUploadedAt: null,
      brojIndeksa: null,
      datumUpisa: null,
    };
  }

  if (rankingItem.status === "Odobrena") {
    const finalization = await getEnrollmentFinalizationByPrijava(
      latestPrijava.brojPrijave,
      latestPrijava.skolskaGodina,
    );

    if (finalization?.statusUpisa === "UpisZavrsen" && finalization.brojIndeksa) {
      return {
        stage: "UpisZavrsen",
        prijavaStatus: latestPrijava.statusPrijave,
        brojPrijave: latestPrijava.brojPrijave,
        skolskaGodina: latestPrijava.skolskaGodina,
        idPrograma: rankingItem.idPrograma,
        studijskiProgram: rankingItem.studijskiProgram,
        brojPoena: rankingItem.brojPoena,
        rangMesto: rankingItem.rangMesto,
        enrollmentStatus: rankingItem.status,
        enrollmentFinalizationStatus: "UpisZavrsen",
        hasSignedContract: finalization.hasSignedContract,
        signedContractUploadedAt: finalization.signedContractUploadedAt,
        brojIndeksa: finalization.brojIndeksa,
        datumUpisa: finalization.datumUpisa,
      };
    }

    return {
      stage: "OdobrenUpis",
      prijavaStatus: latestPrijava.statusPrijave,
      brojPrijave: latestPrijava.brojPrijave,
      skolskaGodina: latestPrijava.skolskaGodina,
      idPrograma: rankingItem.idPrograma,
      studijskiProgram: rankingItem.studijskiProgram,
      brojPoena: rankingItem.brojPoena,
      rangMesto: rankingItem.rangMesto,
      enrollmentStatus: rankingItem.status,
      enrollmentFinalizationStatus: finalization?.hasSignedContract
        ? "UgovorOtpremljen"
        : "UgovorNedostaje",
      hasSignedContract: finalization?.hasSignedContract ?? false,
      signedContractUploadedAt: finalization?.signedContractUploadedAt ?? null,
      brojIndeksa: finalization?.brojIndeksa ?? null,
      datumUpisa: finalization?.datumUpisa ?? null,
    };
  }

  if (rankingItem.status === "Odbijena") {
    return {
      stage: "UpisOdbijen",
      prijavaStatus: latestPrijava.statusPrijave,
      brojPrijave: latestPrijava.brojPrijave,
      skolskaGodina: latestPrijava.skolskaGodina,
      idPrograma: rankingItem.idPrograma,
      studijskiProgram: rankingItem.studijskiProgram,
      brojPoena: rankingItem.brojPoena,
      rangMesto: rankingItem.rangMesto,
      enrollmentStatus: rankingItem.status,
      enrollmentFinalizationStatus: "NijePrimenljivo",
      hasSignedContract: false,
      signedContractUploadedAt: null,
      brojIndeksa: null,
      datumUpisa: null,
    };
  }

  return {
    stage: "CekaKonacnuOdluku",
    prijavaStatus: latestPrijava.statusPrijave,
    brojPrijave: latestPrijava.brojPrijave,
    skolskaGodina: latestPrijava.skolskaGodina,
    idPrograma: rankingItem.idPrograma,
    studijskiProgram: rankingItem.studijskiProgram,
    brojPoena: rankingItem.brojPoena,
    rangMesto: rankingItem.rangMesto,
    enrollmentStatus: rankingItem.status,
    enrollmentFinalizationStatus: "NijePrimenljivo",
    hasSignedContract: false,
    signedContractUploadedAt: null,
    brojIndeksa: null,
    datumUpisa: null,
  };
};
