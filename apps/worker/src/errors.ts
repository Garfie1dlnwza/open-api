import type { PlaygroundErrorCode } from "@thai-open-api/schema";

/** HTTP status the Worker answers with for each playground error code. */
export const ERROR_STATUS: Record<PlaygroundErrorCode, number> = {
  invalid_request: 400,
  origin_not_allowed: 403,
  unknown_api: 404,
  unknown_endpoint: 404,
  invalid_param: 422,
  missing_auth: 422,
  invalid_auth: 422,
  rate_limited: 429,
  upstream_timeout: 504,
  upstream_unreachable: 502,
  redirect_blocked: 502,
  unsupported_media: 502,
  not_found: 404,
  method_not_allowed: 405,
};
