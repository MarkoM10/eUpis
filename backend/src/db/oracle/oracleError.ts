type OracleLikeError = Error & {
  errorNum?: number;
  offset?: number;
};

const hasOracleShape = (error: unknown): error is OracleLikeError => {
  return error instanceof Error && "errorNum" in error;
};

export const extractOracleDetails = (error: unknown): string | undefined => {
  if (!hasOracleShape(error)) {
    return undefined;
  }

  const parts: string[] = [error.message];

  if (typeof error.errorNum === "number") {
    parts.push(`errorNum=${error.errorNum}`);
  }

  if (typeof error.offset === "number") {
    parts.push(`offset=${error.offset}`);
  }

  return parts.join(" | ");
};
