// Cloudflare Workers AI provider.
//
// Uses the native `env.AI` binding (no API key, no external server) via the
// workers-ai-provider package, which is compatible with the Vercel AI SDK's
// streamText(). Inference runs on Cloudflare's edge — free up to the daily
// Neuron allocation on the Workers Free plan.

import { env } from "cloudflare:workers";

export const DEFAULT_AI_MODEL = "@cf/openai/gpt-oss-20b";
export const FALLBACK_AI_MODEL = "@cf/zai-org/glm-4.7-flash";

/**
 * Resolve the active Workers AI model id. Override with the CF_AI_MODEL env var.
 * Falls back to a lighter model if the primary is unavailable.
 */
export function getAiModelName(): string {
  return process.env.CF_AI_MODEL?.trim() || DEFAULT_AI_MODEL;
}

export function getAiFallbackModelName(): string {
  return process.env.CF_AI_FALLBACK_MODEL?.trim() || FALLBACK_AI_MODEL;
}

/**
 * Lazily create the Workers AI provider bound to env.AI.
 * Imported inside server handlers only — never ship to the client bundle.
 */
export async function getAiModel() {
  const { createWorkersAI } = await import("workers-ai-provider");
  const workersai = createWorkersAI({ binding: env.AI as any });
  return workersai(getAiModelName());
}

export async function getAiFallbackModel() {
  const { createWorkersAI } = await import("workers-ai-provider");
  const workersai = createWorkersAI({ binding: env.AI as any });
  return workersai(getAiFallbackModelName());
}
