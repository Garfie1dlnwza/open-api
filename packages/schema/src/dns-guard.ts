import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/** Node-only. Used by the health script to refuse hosts that resolve to non-public addresses. */

const V4_BLOCKS: [string, number][] = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
];

const v4ToInt = (ip: string): number => ip.split(".").reduce((n, part) => n * 256 + Number(part), 0);

const inV4Block = (ip: string, [base, bits]: [string, number]): boolean => {
  const size = 2 ** (32 - bits);
  return Math.floor(v4ToInt(ip) / size) === Math.floor(v4ToInt(base) / size);
};

/** Expands an IPv6 literal to eight 16-bit groups (handles "::" and a trailing dotted IPv4). */
function expandV6(ip: string): number[] | null {
  let text = ip.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  const tail = text.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (tail) {
    const n = v4ToInt(tail[1]);
    text = text.replace(tail[1], `${Math.floor(n / 65536).toString(16)}:${(n % 65536).toString(16)}`);
  }
  const [head, rest, extra] = text.split("::");
  if (extra !== undefined) return null;
  const left = head ? head.split(":") : [];
  const right = rest ? rest.split(":") : [];
  const fill = rest === undefined ? 0 : 8 - left.length - right.length;
  if (fill < 0 || (rest === undefined && left.length !== 8)) return null;
  const groups = [...left, ...Array(fill).fill("0"), ...right].map((g) => parseInt(g, 16));
  return groups.length === 8 && groups.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? groups : null;
}

export function isPublicAddress(ip: string): boolean {
  const family = isIP(ip.replace(/^\[|\]$/g, ""));
  if (family === 4) return !V4_BLOCKS.some((block) => inV4Block(ip, block));
  if (family !== 6) return false;

  const g = expandV6(ip);
  if (!g) return false;
  const embeddedV4 = `${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`;
  const isMapped = g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff;
  const isNat64 = g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0);
  if (isMapped || isNat64) return isPublicAddress(embeddedV4);
  if (g.every((x) => x === 0) || (g.slice(0, 7).every((x) => x === 0) && g[7] === 1)) return false; // :: and ::1
  if ((g[0] & 0xfe00) === 0xfc00) return false; // fc00::/7 unique local
  if ((g[0] & 0xffc0) === 0xfe80) return false; // fe80::/10 link local
  if ((g[0] & 0xff00) === 0xff00) return false; // multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return false; // documentation
  return true;
}

/** True only when every address the name resolves to is public. A literal IP is checked directly. */
export async function hostResolvesPublicly(hostname: string): Promise<boolean> {
  const bare = hostname.replace(/^\[|\]$/g, "");
  if (isIP(bare)) return isPublicAddress(bare);
  try {
    const addresses = await lookup(bare, { all: true });
    return addresses.length > 0 && addresses.every((a) => isPublicAddress(a.address));
  } catch {
    return false;
  }
}
