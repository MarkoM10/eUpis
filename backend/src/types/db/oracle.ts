export type OracleLikeError = Error & {
  errorNum?: number;
  offset?: number;
};
