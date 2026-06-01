/** Helpers para Server-Sent Events (SSE) hacia el navegador. */

export const SSE_HEADERS: Record<string, string> = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  // NOTA: no seteamos `Connection: keep-alive` — es hop-by-hop y es inválido bajo HTTP/2 (Next en prod).
  // Evita buffering en proxies (nginx) que romperían el streaming.
  "X-Accel-Buffering": "no",
};

/** Serializa un evento SSE con nombre + payload JSON. */
export function formatSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
