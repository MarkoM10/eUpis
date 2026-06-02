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

  return error.message;
};
