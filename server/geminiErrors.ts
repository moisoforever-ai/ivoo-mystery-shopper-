/**
 * Translates internal Gemini error signals into clear, actionable messages for the client.
 *
 * IMPORTANT: this NEVER fabricates evaluation data. When Gemini can't be reached or fails,
 * the caller must surface an error to the user instead of inventing a transcript/score.
 *
 * This lives in its own file (separate from server.ts) specifically so it can be unit tested
 * without importing server.ts — importing server.ts directly starts a real Express server.
 */
export function friendlyGeminiErrorMessage(err: any): string {
  const raw = err?.message || String(err || "Error desconocido");

  if (raw === "AUTH_NO_KEY") {
    return "No hay una clave de API de Gemini configurada en el servidor (GEMINI_API_KEY). Configúrala en las variables de entorno para poder auditar audios.";
  }
  if (raw === "AUTH_INVALID_KEY") {
    return "La clave de API de Gemini configurada en el servidor no es válida o fue rechazada. Verifica la variable GEMINI_API_KEY.";
  }
  if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("429")) {
    return "Se agotó la cuota disponible de Gemini para procesar este audio. Intenta de nuevo en unos minutos o revisa el plan de la API.";
  }
  if (raw.includes("UNAVAILABLE") || raw.includes("503") || raw.includes("overloaded") || raw.includes("high demand")) {
    return "Gemini está temporalmente saturado y no respondió tras varios reintentos. Intenta de nuevo en unos minutos.";
  }

  return `No se pudo completar el análisis con Gemini: ${raw}`;
}
