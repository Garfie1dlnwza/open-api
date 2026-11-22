const IP_LITERAL = /^(\d{1,3}\.){3}\d{1,3}$|^\[.*\]$/;
// Internal-only suffixes. The URL parser already normalises hex/octal/decimal IPs to dotted form.
const INTERNAL_SUFFIXES = [".local", ".localdomain", ".internal", ".intranet", ".lan", ".home", ".corp", ".svc", ".cluster.local"];
const HOSTNAME = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Shared by baseUrl and redirectHosts so both obey the same rules. Returns an error or null. */
export function publicHostError(hostname: string): string | null {
  const host = hostname.toLowerCase();
  if (IP_LITERAL.test(host)) return "must be a hostname, not an IP address";
  if (host === "localhost" || INTERNAL_SUFFIXES.some((s) => host.endsWith(s))) return "must be a public hostname";
  if (!HOSTNAME.test(host)) return "must be a fully-qualified hostname without port or path";
  return null;
}
