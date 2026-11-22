import type { Param } from "./entry.ts";

const SAFE_PATH_VALUE = /^[A-Za-z0-9._~-]+$/;
const DATE_VALUE = /^\d{4}-\d{2}-\d{2}$/;
// Intentional: rejects control characters in user-supplied parameter values.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/**
 * Catalog patterns use a deliberately small grammar: literals, escapes such as \d, character
 * classes, ".", and quantifiers ? * + {n} {n,m} on single atoms. No groups, alternation,
 * backreferences or lookaround, so there is nothing to nest and no exponential backtracking.
 * (Detecting dangerous regexes is a losing game; not allowing them is not.)
 */
const ATOM = String.raw`(?:[^\\^$.|?*+()[\]{}]|\\[dDwWsS.\-/\\^$|?*+()[\]{}]|\.|\[\^?(?:[^\]\\]|\\.)+\])`;
const QUANT = String.raw`(?:\?|\*|\+|\{\d{1,2}(?:,\d{1,2})?\})?`;
const SAFE_PATTERN = new RegExp(`^\\^?(?:${ATOM}${QUANT})+\\$?$`);
const TOKEN = new RegExp(`(${ATOM})(${QUANT})`, "g");

const MAX_PATTERN_LENGTH = 120;
const MAX_UNBOUNDED_QUANTIFIERS = 3;
const MAX_REPEAT = 64;
/** Values checked against a pattern are short; this also bounds the polynomial worst case. */
export const MAX_PATTERN_VALUE_LENGTH = 64;

/** Compiles a catalog pattern fully anchored, or returns why it was refused. */
export function compileParamPattern(source: string): RegExp | string {
  if (source.length > MAX_PATTERN_LENGTH) return `pattern is longer than ${MAX_PATTERN_LENGTH} characters`;
  if (!SAFE_PATTERN.test(source)) return "pattern uses syntax outside the allowed subset (no groups, alternation or backreferences)";

  const body = source.replace(/^\^/, "").replace(/(?<!\\)\$$/, "");
  let unbounded = 0;
  for (const [, , quant] of body.matchAll(TOKEN)) {
    if (quant === "*" || quant === "+") unbounded++;
    const repeat = quant.match(/^\{(\d+)(?:,(\d+))?\}$/);
    if (repeat && Math.max(Number(repeat[1]), Number(repeat[2] ?? 0)) > MAX_REPEAT) return `repeat counts must be at most ${MAX_REPEAT}`;
  }
  if (unbounded > MAX_UNBOUNDED_QUANTIFIERS) return `at most ${MAX_UNBOUNDED_QUANTIFIERS} unbounded quantifiers (* or +) are allowed`;

  try {
    return new RegExp(`^(?:${source})$`);
  } catch {
    return "pattern is not a valid regular expression";
  }
}

/** Returns an error message, or null when the value is acceptable for the parameter. */
export function validateParamValue(param: Param, value: string): string | null {
  if (CONTROL_CHARS.test(value)) return "contains control characters";
  if (param.in === "path" && (!SAFE_PATH_VALUE.test(value) || value === "." || value === "..")) {
    return "path values may only contain letters, digits and . _ ~ -";
  }
  if (param.enum && !param.enum.includes(value)) return `must be one of: ${param.enum.join(", ")}`;
  if (param.pattern) {
    if (value.length > MAX_PATTERN_VALUE_LENGTH) return `must be at most ${MAX_PATTERN_VALUE_LENGTH} characters`;
    const regex = compileParamPattern(param.pattern);
    if (typeof regex === "string" || !regex.test(value)) return "does not match the required pattern";
  }

  switch (param.type) {
    case "integer":
      if (!/^-?\d+$/.test(value)) return "must be an integer";
      break;
    case "number":
      if (value.trim() === "" || !Number.isFinite(Number(value))) return "must be a number";
      break;
    case "boolean":
      if (value !== "true" && value !== "false") return "must be true or false";
      break;
    case "date":
      if (!DATE_VALUE.test(value) || Number.isNaN(Date.parse(value))) return "must be a date (YYYY-MM-DD)";
      break;
    default:
      break;
  }

  if (param.type === "integer" || param.type === "number") {
    const n = Number(value);
    if (param.min !== undefined && n < param.min) return `must be at least ${param.min}`;
    if (param.max !== undefined && n > param.max) return `must be at most ${param.max}`;
  } else {
    if (param.min !== undefined && value.length < param.min) return `must be at least ${param.min} characters`;
    if (param.max !== undefined && value.length > param.max) return `must be at most ${param.max} characters`;
  }
  return null;
}

export type ResolvedParams =
  | { ok: true; values: Record<string, string> }
  | { ok: false; name: string; message: string };

/** Applies defaults, rejects unknown names and validates every value against its declaration. */
export function resolveParams(params: Param[], input: Record<string, string>): ResolvedParams {
  const known = new Set(params.map((p) => p.name));
  for (const name of Object.keys(input)) {
    if (!known.has(name)) return { ok: false, name, message: "unknown parameter" };
  }
  const values: Record<string, string> = {};
  for (const param of params) {
    const raw = input[param.name];
    const value = raw === undefined || raw === "" ? param.default : raw;
    if (value === undefined) {
      if (param.required) return { ok: false, name: param.name, message: "required" };
      continue;
    }
    const error = validateParamValue(param, value);
    if (error) return { ok: false, name: param.name, message: error };
    values[param.name] = value;
  }
  return { ok: true, values };
}
