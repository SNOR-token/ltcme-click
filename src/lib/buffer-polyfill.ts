import { Buffer } from "buffer";

const currentBuffer = (globalThis as typeof globalThis & { Buffer?: typeof Buffer }).Buffer;

if (!currentBuffer?.alloc || !currentBuffer?.from || !currentBuffer?.isBuffer) {
  (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
}

export { Buffer };