import { ApiError } from "../shared/apiError";

export const normalizeSchoolYear = (value: string, fieldLabel = "Skolska godina"): string => {
  const trimmed = value.trim();
  if (!/^\d{4}$/.test(trimmed)) {
    throw new ApiError(
      400,
      "Neispravna skolska godina",
      `${fieldLabel} mora biti u formatu YYYY, na primer 2026.`,
    );
  }

  return trimmed;
};
