import "dotenv/config";
import { describe, expect, it } from "vitest";
import { encryptSession, decryptSession } from "./session";

describe("session encrypt/decrypt", () => {
  it("round-trips a payload", async () => {
    const token = await encryptSession({ userId: "emp_123", role: "ADMIN" });
    const payload = await decryptSession(token);
    expect(payload).toEqual({ userId: "emp_123", role: "ADMIN" });
  });

  it("rejects a tampered token", async () => {
    const token = await encryptSession({ userId: "emp_123", role: "EMPLOYEE" });
    const tampered = `${token.slice(0, -2)}xx`;
    const payload = await decryptSession(tampered);
    expect(payload).toBeNull();
  });

  it("returns null for an undefined token", async () => {
    expect(await decryptSession(undefined)).toBeNull();
  });
});
