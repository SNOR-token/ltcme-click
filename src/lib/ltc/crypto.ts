// Password-based AES-GCM encryption via WebCrypto. Runs in browser only.

const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 250_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function toB64(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface Encrypted {
  v: 1;
  s: string; // salt b64
  n: string; // nonce b64
  c: string; // ciphertext b64
}

export async function encryptString(plain: string, password: string): Promise<Encrypted> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce as BufferSource },
      key,
      enc.encode(plain) as BufferSource,
    ),
  );
  return { v: 1, s: toB64(salt), n: toB64(nonce), c: toB64(ct) };
}

export async function decryptString(payload: Encrypted, password: string): Promise<string> {
  const salt = fromB64(payload.s);
  const nonce = fromB64(payload.n);
  const ct = fromB64(payload.c);
  const key = await deriveKey(password, salt);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce as BufferSource },
    key,
    ct as BufferSource,
  );
  return dec.decode(pt);
}