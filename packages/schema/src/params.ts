import type { Param } from "./entry.ts";

const SAFE_PATH_VALUE = /^[A-Za-z0-9._~-]+$/;
const DATE_VALUE = /^\d{4}-\d{2}-\d{2}$/;
// Intentional: rejects control characters in user-supplied parameter values.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

// A quantified group containing a quantifier, e.g. (a+)+ or (\w*)*, is the classic backtracking trap.
const NESTED_QUANTIFIER = /\((?:[^()\\]|\\.)*[+*](?:[^()\\]|\\.)*\)[+*{]/;
const BACKREFERENCE = /\\[1-9]|\\k</;
const MAX_PATTERN_LENGTH = 200;

/**
 * Compiles a catalog pattern fully anchored (so "abc" cannot match "xabcx") or returns why it
 * was refused. The nested-quantifier check is a heuristic, not a proof of linear time; values are
 * also capped at maxParamValueLength before they ever reach a pattern.
 */
export function compileParamPattern(source: string): RegExp | string {
  if (source.length > MAX_PATTERN_LENGTH) return `pattern is longer than ${MAX_PATTERN_LENGTH} characters`;
  if (NESTED_QUANTIFIER.test(source) || BACKREFERENCE.test(source)) return "pattern may backtrack catastrophically";
  try {
    // Must compile on its own first: "a)|(b" is only valid once wrapped, and wrapping would
    // let the alternation escape the anchors.
    new RegExp(source);
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
