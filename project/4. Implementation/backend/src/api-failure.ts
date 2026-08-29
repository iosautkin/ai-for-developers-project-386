import type { ApiError } from '@calendar/api-contract/schemas';

import type { ApiFailureShape, ApiFailureStatus } from './api-failure.contract.js';

/** Expected business or request failure that may be returned to an API consumer. */
export class ApiFailure extends Error implements ApiFailureShape {
  readonly body: ApiError;
  readonly statusCode: ApiFailureStatus;

  constructor(statusCode: ApiFailureStatus, body: ApiError) {
    super(body.message);
    this.name = 'ApiFailure';
    this.statusCode = statusCode;
    this.body = body;
  }
}
