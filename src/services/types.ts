/** Service layer result types */

export interface ServiceContext {
  userId: string;
  roleId: string;
  ipAddress?: string;
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
