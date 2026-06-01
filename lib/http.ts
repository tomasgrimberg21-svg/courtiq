/** Helpers de respuesta JSON para route handlers. */
export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

export function errorJson(message: string, status = 400, headers: Record<string, string> = {}): Response {
  return json({ error: message }, status, headers);
}

/** Sanitiza texto libre: colapsa caracteres de control (\p{Cc}) y recorta longitud. */
export function sanitizeText(value: unknown, maxLen = 200): string {
  if (typeof value !== "string") return "";
  return value.replace(/\p{Cc}/gu, " ").trim().slice(0, maxLen);
}
