// Application-level encryption for Plaid access tokens (spec §4 — "stored encrypted
// at rest, never sent to the client"). AES-256-GCM with a key from ENCRYPTION_KEY.
//
// ENCRYPTION_KEY must be 32 bytes, supplied as 64 hex chars or 44-char base64.
// Generate one with:  openssl rand -hex 32
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { env } from "@/lib/env";

const ALGO = "aes-256-gcm";
const IV_LEN = 12; // 96-bit nonce recommended for GCM

function getKey(): Buffer {
  const raw = env.encryptionKey();
  // Accept hex (64 chars) or base64.
  const key =
    /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must decode to 32 bytes (use `openssl rand -hex 32`).",
    );
  }
  return key;
}

// Returns "iv.ciphertext.authTag", all base64.
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${enc.toString("base64")}.${tag.toString("base64")}`;
}

export function decrypt(payload: string): string {
  const [ivB64, dataB64, tagB64] = payload.split(".");
  if (!ivB64 || !dataB64 || !tagB64) {
    throw new Error("Malformed encrypted payload");
  }
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
