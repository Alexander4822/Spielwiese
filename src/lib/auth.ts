import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { getEnvSecret } from "./env";

export const SESSION_COOKIE_NAME = "app_session";
export const CSRF_COOKIE_NAME = "csrf_token";

const SESSION_TTL_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  sub: "single-user";
  sid: string;
  exp: number;
};

function base64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);

  return Buffer.from(`${normalized}${padding}`, "base64");
}

export function createSessionToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: "single-user",
    sid: randomBytes(8).toString("hex"),
    exp: now + SESSION_TTL_SECONDS,
  };

  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", getEnvSecret("AUTH_SECRET"))
    .update(encodedPayload)
    .digest();

  return `${encodedPayload}.${base64Url(signature)}`;
}

export function verifySessionToken(token?: string): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [payloadPart, signaturePart] = token.split(".");

  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expected = createHmac("sha256", getEnvSecret("AUTH_SECRET"))
    .update(payloadPart)
    .digest();

  const incoming = decodeBase64Url(signaturePart);

  if (incoming.length !== expected.length || !timingSafeEqual(incoming, expected)) {
    return null;
  }

  const payload = JSON.parse(decodeBase64Url(payloadPart).toString("utf-8")) as SessionPayload;
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp < now) {
    return null;
  }

  return payload;
}

export function verifyPassword(candidate: string): boolean {
  const serializedHash = getEnvSecret("APP_PASSWORD_HASH");
  const [algorithm, saltHex, digestHex] = serializedHash.split(":");

  if (algorithm !== "scrypt" || !saltHex || !digestHex) {
    throw new Error("APP_PASSWORD_HASH must use format scrypt:<saltHex>:<digestHex>");
  }

  const computed = scryptSync(candidate, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(digestHex, "hex");

  return computed.length === expected.length && timingSafeEqual(computed, expected);
}

export function createCsrfToken(): string {
  return randomBytes(24).toString("hex");
}
