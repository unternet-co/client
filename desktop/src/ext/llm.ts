import { createOpenAI } from "@ai-sdk/openai";
import { createOllama } from "ollama-ai-provider";

export const DEFAULT_MODEL_OLLAMA = "qwen2.5-coder:3b";
export const DEFAULT_MODEL_OPENAI = "gpt-4o";

export interface modelOptions {
  type?: string;
  model?: string;
  apiKey?: string;
  baseURL?: string;
}

export function createModel({
  type = "openai",
  model,
  apiKey = import.meta.env.APP_OPENAI_API_KEY,
  baseURL,
}: modelOptions = {}) {
  if (type === "ollama" || !apiKey) {
    return createOllama({
      baseURL,
    })(model || DEFAULT_MODEL_OLLAMA);
  } else {
    return createOpenAI({
      apiKey,
      baseURL,
      compatibility: "strict",
    })(model || DEFAULT_MODEL_OPENAI);
  }
}
