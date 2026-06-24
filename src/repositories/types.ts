/** Shared repository contracts */

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RepositoryError {
  code: string;
  message: string;
  details?: unknown;
}

export type RepositoryResult<T> =
  | { success: true; data: T }
  | { success: false; error: RepositoryError };
