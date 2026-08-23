import {
  parseApiError,
  type ApiErrorBody,
  type ApiRequestErrorShape,
  type HttpClient,
} from './httpClient.contract.js';

export class ApiRequestError extends Error implements ApiRequestErrorShape {
  readonly status: number;
  readonly body: ApiErrorBody;
  readonly code: ApiErrorBody['code'];
  readonly fieldErrors?: NonNullable<ApiErrorBody['fieldErrors']>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
    this.code = body.code;
    if (body.fieldErrors !== undefined) this.fieldErrors = body.fieldErrors;
  }
}

export const httpClient: HttpClient = async <T>(url: string, options: RequestInit) => {
  const response = await fetch(url, options);
  const text = await response.text();

  let body: unknown;
  try {
    body = text.length > 0 ? JSON.parse(text) : undefined;
  } catch {
    if (response.ok) throw new Error('API returned invalid JSON.');
  }

  if (!response.ok) {
    throw new ApiRequestError(response.status, parseApiError(body));
  }

  return {
    data: body,
    status: response.status,
    headers: response.headers,
  } as T;
};
