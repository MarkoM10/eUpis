export class ApiError extends Error {
  statusCode: number;
  userTitle: string;
  userMessage: string;
  oracleDetails?: string;

  constructor(
    statusCode: number,
    userTitle: string,
    userMessage: string,
    oracleDetails?: string,
  ) {
    super(userMessage);
    this.statusCode = statusCode;
    this.userTitle = userTitle;
    this.userMessage = userMessage;
    this.oracleDetails = oracleDetails;
  }
}
