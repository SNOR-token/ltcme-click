import { Buffer } from "buffer";

type BufferGlobal = typeof globalThis & {
  Buffer?: typeof Buffer;
  global?: typeof globalThis;
};

export function ensureBuffer(): typeof Buffer {
  const target = globalThis as BufferGlobal;
  const currentBuffer = target.Buffer;

  if (!currentBuffer?.alloc || !currentBuffer?.allocUnsafe || !currentBuffer?.from || !currentBuffer?.isBuffer) {
    target.Buffer = Buffer;
  }

  if (!target.global) {
    target.global = globalThis;
  }

  return target.Buffer ?? Buffer;
}

ensureBuffer();

export { Buffer };