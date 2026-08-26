import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const DEFAULT_AI_BASE_URL = "https://api.openai.com/v1";

export function createAiProvider(apiKey: string) {
  const baseURL = process.env.AI_BASE_URL?.trim() || DEFAULT_AI_BASE_URL;

  return createOpenAICompatible({
    name: "ltcme-ai",
    baseURL: baseURL.replace(/\/+$/, ""),
    headers: {
      Authorization: "Bearer " + apiKey,
    },
  });
}

export function getAiModelName(): string {
  return process.env.AI_MODEL?.trim() || "gpt-4.1-mini";
}
