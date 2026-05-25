import { ApiError } from "../shared/apiError";

export const normalizeSchoolYear = (value: string, fieldLabel = "Skolska godina"): string => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})/);

  if (!match) {
    throw new ApiError(
      400,
      "Neispravna skolska godina",
      `${fieldLabel} mora biti u formatu YYYY, na primer 2026.`,
    );
  }

  return match[1];
};
