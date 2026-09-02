// Cloudflare Workers AI provider.
// The AI binding is supplied by src/server.ts at request time.
// No cloudflare:workers or @cloudflare/workers import is required.

import { createWorkersAI } from "workers-ai-provider";

export const DEFAULT_AI_MODEL = "@cf/openai/gpt-oss-20b";
export const FALLBACK_AI_MODEL = "@cf/zai-org/glm-4.7-flash";

type CloudflareAI = {
  run: (...args: any[]) => Promise<any>;
};

function getAI(): CloudflareAI {
  const ai = (globalThis as any).__CF_AI__;

  if (!ai) {
    throw new Error("Cloudflare Workers AI binding is unavailable");
  }

  return ai;
}

export function getAiModelName(): string {
  return process.env.CF_AI_MODEL?.trim() || DEFAULT_AI_MODEL;
}

export function getAiFallbackModelName(): string {
  return (
    process.env.CF_AI_FALLBACK_MODEL?.trim() ||
    FALLBACK_AI_MODEL
  );
}

export function getAiModel() {
  const workersai = createWorkersAI({
    binding: getAI(),
  });

  return workersai(getAiModelName());
}

export function getAiFallbackModel() {
  const workersai = createWorkersAI({
    binding: getAI(),
  });

  return workersai(getAiFallbackModelName());
}
