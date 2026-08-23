import {
  ApiError as ApiErrorSchema,
  type ApiError,
} from '../../../shared/api-contract/src/generated/zod/schemas.js';

/**
 * Transport boundary used by the generated Calendar API client.
 *
 * The module is stateless. It validates every non-2xx body against the generated ApiError schema,
 * exposes stable machine-readable failures to React Query, and leaves request execution and
 * response-envelope construction to the implementation.
 */

/** Generated public body returned by every unsuccessful Calendar API operation. */
export type ApiErrorBody = ApiError;

/**
 * Converts an unknown non-2xx response body into the public API error contract.
 * Invalid server responses become INTERNAL_ERROR without exposing transport internals.
 */
export const parseApiError = (value: unknown): ApiErrorBody => {
  const parsedError = ApiErrorSchema.safeParse(value);
  return parsedError.success
    ? parsedError.data
    : {
        code: 'INTERNAL_ERROR',
        message: 'Сервер вернул некорректный ответ.',
      };
};

/**
 * Error thrown for every non-2xx Calendar API response.
 * It is structurally compatible with ApiError while retaining HTTP status and the original body.
 */
export interface ApiRequestErrorShape extends Error, ApiErrorBody {
  /** HTTP status received from the server. */
  readonly status: number;
  /** Validated API error body retained for consumers that prefer an explicit payload property. */
  readonly body: ApiErrorBody;
}

/** Executes one generated API request and returns Orval's response envelope. */
export type HttpClient = <T>(
  url: string, // relative Calendar API URL generated from TypeSpec
  options: RequestInit, // method, headers, body and cancellation signal supplied by Orval
) => Promise<T>;
