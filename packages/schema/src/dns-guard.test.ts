import { describe, expect, it } from "vitest";
import { isPublicAddress } from "./dns-guard.ts";

describe("isPublicAddress", () => {
  it.each(["8.8.8.8", "1.1.1.1", "203.150.1.1", "2606:4700:4700::1111", "2001:4860:4860::8888"])("accepts %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(true);
  });

  it.each([
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255",
    "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "ff02::1", "2001:db8::1",
    "::ffff:127.0.0.1", "::ffff:169.254.169.254", "::ffff:7f00:1", "64:ff9b::a00:1", "[::1]",
    "not-an-ip", "1.2.3", "",
  ])("rejects %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  it("keeps the boundaries of private ranges exact", () => {
    expect(isPublicAddress("172.15.255.255")).toBe(true);
    expect(isPublicAddress("172.32.0.0")).toBe(true);
    expect(isPublicAddress("100.63.255.255")).toBe(true);
    expect(isPublicAddress("100.128.0.0")).toBe(true);
  });
});
