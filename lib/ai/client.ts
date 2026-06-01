import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env";

let client: Anthropic | null = null;

/** Cliente Anthropic singleton. La API key vive SOLO server-side. */
export function anthropic(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: serverEnv().ANTHROPIC_API_KEY });
  }
  return client;
}

/** Modelo runtime configurado (alias vigente, sin sufijo de fecha). */
export function model(): string {
  return serverEnv().ANTHROPIC_MODEL;
}
