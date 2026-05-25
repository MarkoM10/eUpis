export const getTodayDateISO = (): string => {
  return new Date().toISOString().slice(0, 10);
};

export const getCurrentYearString = (): string => {
  return String(new Date().getFullYear());
};

export const formatDateOnly = (value: string | null | undefined, fallback = "-"): string => {
  if (!value) {
    return fallback;
  }

  return value.slice(0, 10);
};

export const formatDateTime = (value: string | null, locale = "sr-RS", fallback = "-"): string => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale);
};

export const formatTimeLabel = (value: string | null | undefined): string => {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("sr-RS", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const toTimestamp = (value: string | null | undefined): number => {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const buildProgramLabel = (nazivPrograma: string | null, modul: string | null): string => {
  if (!nazivPrograma || !modul) {
    return "-";
  }

  return `${nazivPrograma} | ${modul}`.slice(0, 100);
};

export const triggerFileDownload = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const getPrijavaRowKey = (brojPrijave: number, skolskaGodina: string): string => {
  return `${brojPrijave}|${skolskaGodina}`;
};

export const getDocumentActionKey = (
  brojPrijave: number,
  skolskaGodina: string,
  documentType: string,
): string => {
  return `${brojPrijave}|${skolskaGodina}|${documentType}`;
};
