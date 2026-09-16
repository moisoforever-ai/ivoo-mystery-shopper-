import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, createPartFromUri } from "@google/genai";
import dotenv from "dotenv";
import { friendlyGeminiErrorMessage } from "./server/geminiErrors";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Support large audio uploads (up to 50MB base64)
app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ extended: true, limit: "60mb" }));

// Helper function to get Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("[Gemini Config] GEMINI_API_KEY no configurada o es marcador de posición.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY);
  res.json({
    status: "ok",
    model: "gemini-3.7-flash",
    hasApiKey: hasKey,
    timestamp: new Date().toISOString(),
  });
});

// In-memory store for chunked audio uploads to bypass any proxy body size limits
interface UploadSession {
  sessionId: string;
  totalChunks: number;
  mimeType: string;
  storeName: string;
  city: string;
  recordingDate: string;
  additionalContext: string;
  chunks: (Buffer | null)[];
  createdAt: number;
}

const uploadSessions = new Map<string, UploadSession>();

// Helper function to call Gemini with exponential backoff retries and fallback models for high-demand 503/429 mitigation
async function generateContentWithFallback(params: {
  contents: any;
  config: any;
  preferredModel?: string;
  fallbackModels?: string[];
  maxRetries?: number;
}) {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("AUTH_NO_KEY");
  }

  const modelsToTry = [
    params.preferredModel || "gemini-3.7-flash",
    ...(params.fallbackModels || ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite", "gemini-flash-latest"]),
  ];

  let lastError: any = null;

  for (let m = 0; m < modelsToTry.length; m++) {
    const modelName = modelsToTry[m];
    let attempts = 0;
    const maxAttempts = params.maxRetries || 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`[Gemini Engine] Solicitando modelo ${modelName} (intento ${attempts}/${maxAttempts})...`);
        const response = await client.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || JSON.stringify(err);
        const status = err?.status || err?.code || 0;

        // Check if authentication error (401 / unauthenticated)
        if (
          status === 401 ||
          errMsg.includes("UNAUTHENTICATED") ||
          errMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
          errMsg.includes("invalid authentication") ||
          errMsg.includes("API key not valid")
        ) {
          console.warn(`[Gemini Auth] Error de autenticación en ${modelName}:`, errMsg);
          throw new Error("AUTH_INVALID_KEY");
        }

        const isTransient =
          status === 503 ||
          status === 429 ||
          status === 500 ||
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.includes("high demand") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("overloaded");

        console.warn(`[Gemini Advertencia] ${modelName} falló (intento ${attempts}): ${errMsg}`);

        if (isTransient && attempts < maxAttempts) {
          const delayMs = Math.min(1500 * Math.pow(2, attempts) + Math.random() * 500, 8000);
          console.log(`[Gemini Reintento] Esperando ${Math.round(delayMs)}ms antes de reintentar con ${modelName}...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          // If 404 or all attempts for this model exhausted, advance to next fallback model immediately
          if (m < modelsToTry.length - 1) {
            console.log(`[Gemini Fallback] Cambiando automáticamente al modelo de respaldo: ${modelsToTry[m + 1]}...`);
          }
          break;
        }
      }
    }
  }

  throw lastError || new Error("Todos los modelos de Gemini fallaron al procesar la solicitud.");
}

// Cleanup stale sessions older than 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of uploadSessions.entries()) {
    if (now - session.createdAt > 15 * 60 * 1000) {
      uploadSessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

// Endpoint 1: Init Chunked Upload Session
app.post("/api/gemini/init-session", (req, res) => {
  try {
    const {
      sessionId,
      totalChunks,
      mimeType = "audio/wav",
      storeName = "Tienda Retail",
      city = "Venezuela",
      recordingDate = "Julio 2026",
      additionalContext = "",
    } = req.body;

    if (!sessionId || !totalChunks) {
      return res.status(400).json({ error: "sessionId y totalChunks son requeridos" });
    }

    uploadSessions.set(sessionId, {
      sessionId,
      totalChunks: Number(totalChunks),
      mimeType,
      storeName,
      city,
      recordingDate,
      additionalContext,
      chunks: new Array(Number(totalChunks)).fill(null),
      createdAt: Date.now(),
    });

    res.json({ success: true, sessionId, message: "Sesión de carga inicializada" });
  } catch (error: any) {
    console.error("Error initializing upload session:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint 2: Upload a single small chunk (< 1MB)
app.post("/api/gemini/upload-chunk", (req, res) => {
  try {
    const { sessionId, chunkIndex, chunkBase64 } = req.body;

    if (!sessionId || typeof chunkIndex !== "number" || !chunkBase64) {
      return res.status(400).json({ error: "sessionId, chunkIndex y chunkBase64 son requeridos" });
    }

    const session = uploadSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Sesión de carga no encontrada o expirada" });
    }

    const cleanBase64 = chunkBase64.includes(",")
      ? chunkBase64.split(",")[1]
      : chunkBase64;

    session.chunks[chunkIndex] = Buffer.from(cleanBase64, "base64");

    const receivedCount = session.chunks.filter((c) => c !== null).length;

    res.json({
      success: true,
      chunkIndex,
      receivedCount,
      totalChunks: session.totalChunks,
    });
  } catch (error: any) {
    console.error("Error saving audio chunk:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint 3: Finalize & Process Session with Gemini
app.post("/api/gemini/process-session", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId es requerido" });
    }

    const session = uploadSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada o expirada" });
    }

    // Check if all chunks received
    const missingIndices: number[] = [];
    session.chunks.forEach((chunk, idx) => {
      if (!chunk) missingIndices.push(idx);
    });

    if (missingIndices.length > 0) {
      return res.status(400).json({
        error: `Faltan fragmentos de audio por recibir: [${missingIndices.join(", ")}]`,
      });
    }

    // Concatenate all chunks into one complete buffer. IMPORTANT: we no longer convert this to
    // a base64 string here — that string was ~33% larger than the buffer itself, and holding
    // both in memory at once (plus the JSON-serialized request) is what was crashing the
    // server on longer recordings. We now hand the raw buffer straight to Gemini's Files API.
    const validBuffers = session.chunks as Buffer[];
    const completeBuffer = Buffer.concat(validBuffers);

    // Clean up session from memory
    uploadSessions.delete(sessionId);

    // Call Gemini with full audio data
    const auditResult = await executeGeminiAudioAudit({
      audioBuffer: completeBuffer,
      mimeType: session.mimeType,
      storeName: session.storeName,
      city: session.city,
      recordingDate: session.recordingDate,
      additionalContext: session.additionalContext,
    });

    res.json({
      success: true,
      data: auditResult,
    });
  } catch (error: any) {
    console.error("Error processing chunked session with Gemini:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error al procesar el audio con Gemini",
    });
  }
});

// Helper function for Gemini audio transcription and audit
async function executeGeminiAudioAudit(params: {
  audioBuffer: Buffer;
  mimeType: string;
  storeName: string;
  city: string;
  recordingDate: string;
  additionalContext: string;
}) {
  const { audioBuffer, mimeType, storeName, city, recordingDate, additionalContext } = params;

  let uploadedFileName: string | undefined;

  try {
    let normalizedMime = mimeType || "audio/mp4";
    const lower = (normalizedMime || "").toLowerCase();
    if (lower.includes("wav")) normalizedMime = "audio/wav";
    else if (lower.includes("mp3") || lower.includes("mpeg")) normalizedMime = "audio/mp3";
    else if (lower.includes("ogg") || lower.includes("opus")) normalizedMime = "audio/ogg";
    else if (lower.includes("aac")) normalizedMime = "audio/aac";
    else if (lower.includes("webm")) normalizedMime = "audio/webm";
    else if (lower.includes("flac")) normalizedMime = "audio/flac";
    else normalizedMime = "audio/mp4";

    const client = getGeminiClient();
    if (!client) {
      throw new Error("AUTH_NO_KEY");
    }

    // IMPORTANT: upload the audio through Gemini's Files API instead of embedding it inline
    // as a base64 string in the request body. Building and holding a full base64 string (33%
    // larger than the raw audio) plus the JSON-serialized request in memory at the same time is
    // what was causing the server to run out of RAM and crash on longer recordings — this
    // avoids that altogether by only ever holding the raw buffer, and lets Gemini's own
    // infrastructure hold the audio instead of our 512MB free-tier instance.
    console.log(`[Gemini Engine] Subiendo audio (${normalizedMime}, ${Math.round(audioBuffer.length / 1024)} KB) a Gemini Files API para ${storeName}...`);

    const audioBlob = new Blob([audioBuffer], { type: normalizedMime });
    let uploadedFile = await client.files.upload({
      file: audioBlob,
      config: { mimeType: normalizedMime },
    });
    uploadedFileName = uploadedFile.name;

    // Gemini processes larger audio files asynchronously — poll until it's ready to use.
    const POLL_INTERVAL_MS = 2000;
    const MAX_POLL_MS = 90 * 1000;
    let waited = 0;
    while (uploadedFile.state === "PROCESSING" && waited < MAX_POLL_MS) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      waited += POLL_INTERVAL_MS;
      uploadedFile = await client.files.get({ name: uploadedFile.name! });
    }

    if (uploadedFile.state === "FAILED") {
      throw new Error("Gemini no pudo procesar el archivo de audio subido (falló en su lado).");
    }
    if (uploadedFile.state !== "ACTIVE") {
      throw new Error("El archivo de audio tardó demasiado en quedar listo en Gemini. Intenta de nuevo.");
    }

    const systemPrompt = `Eres el motor de auditoría de la GUÍA IDM — VERSIÓN OPERATIVA COMPLETA, un sistema determinista de evaluación de interacciones comerciales para retail de tecnología y electrodomésticos en Venezuela. Aplicas la metodología oficial IDM a cada audio, palabra por palabra, sin inventar ni inferir lo que no se dijo.

Tu misión:
1. ESCUCHAR ATENTAMENTE CADA PALABRA DE LA GRABACIÓN REAL.
2. TRANSCRIBIR DE FORMA EXHAUSTIVA Y 100% VERBATIM (literal, sin resumir, sin omitir turnos), identificando interlocutores (Mystery Shopper, Vendedor con su nombre real si se menciona, Seguridad, Cajero, Ambiente) y marcas de tiempo [mm:ss].
3. Clasificar la interacción (Fase 0) ANTES de puntuar nada.
4. Puntuar las 8 dimensiones aplicables con máximo rigor y evidencia textual.
5. Ejecutar el detector de momentos comerciales críticos.
6. Aplicar banderas de fallo y determinar la clasificación final.

===============================================================================
FASE 0 — CLASIFICACIÓN PREVIA (obligatoria antes de puntuar)
===============================================================================
Tipo A. Oportunidad comercial: hay intención real o potencial de compra. Se evalúan D1 a D8 (100 pts).
Tipo B. Consulta informativa: solo pide dato/precio, sin intención declarada. Se evalúan D1, D3, D8 (35 pts).
Tipo C. Postventa / reclamo: ya compró; reclama, consulta uso o garantía. Se evalúan D1, D3, D8 (35 pts).
Tipo D. Trámite interno: no hay cliente final. NO EVALUABLE.
Regla: solo el Tipo A genera clasificación de Asesor Smart.

Causales de NO EVALUABLE (usa exactamente "NO_EVALUABLE" en tipoInteraccion):
- Más del 40% del audio ininteligible.
- Interacción comercial efectiva menor a 60 segundos.
- Audio sin identificación posible de roles asesor/cliente.
- Audio cortado antes del cierre de la interacción (nota: esto invalida SOLO si impide clasificar; si solo impide evaluar el cierre, ver regla de audio cortado más abajo).
Cuando sea NO EVALUABLE: dilo explícitamente en notEvaluableReason, deja criteriaBreakdown vacío y no emitas puntaje.

===============================================================================
BLOQUE 1 — LAS 8 DIMENSIONES DE EVALUACIÓN (D1–D8)
===============================================================================
Cada dimensión tiene 4 niveles fijos. Usa el nivel más alto que la evidencia sostenga; en caso de duda entre dos niveles, asigna el inferior. Los "Intermedios permitidos" (3, 8, 12) solo aplican a dimensiones de 15 pts cuando el desempeño cae claramente entre dos niveles.

D1 — actitud: "Actitud e Intención Comercial" (0-15 pts)
  Evalúa: energía, disposición, interés genuino, iniciativa, actitud de servicio, comportamiento proactivo.
  0=Nulo: apático, no saluda, no responde, no muestra interés.
  5=Insuficiente: responde pero pasivo, espera que el cliente conduzca todo.
  10=Aceptable: atiende con disposición, algún intento comercial, sin proactividad sostenida.
  15=Sobresaliente: energía y disposición evidentes, iniciativa, proactivo durante toda la interacción.
  Regla: personalidad tranquila NO es falta de actitud. Se puntúa conducta observable, no estilo personal.

D2 — necesidades: "Detección de Necesidades" (0-15 pts)
  Evalúa: qué necesita, para qué, presupuesto, preferencias, restricciones, contexto de uso.
  0=Nulo: no pregunta nada, asume la necesidad.
  5=Insuficiente: preguntas mecánicas o genéricas aisladas; no usa las respuestas.
  10=Aceptable: indaga lo esencial y lo usa parcialmente para orientar.
  15=Sobresaliente: descubre qué, para qué, presupuesto, preferencias, restricciones y contexto, y los usa para orientar la recomendación.
  Regla: preguntar mecánicamente sin usar la respuesta no supera 5 pts.

D3 — conocimiento: "Conocimiento y Credibilidad" (0-15 pts)
  Evalúa: conocimiento de producto, diferencias entre productos, garantías, condiciones comerciales, financiamiento, exactitud.
  0=Nulo: no conoce el producto, o da información incorrecta o inventada.
  5=Insuficiente: información mínima o vaga; evade responder; errores menores.
  10=Aceptable: información correcta y suficiente en lo principal.
  15=Sobresaliente: dominio claro, explica diferencias, garantías/condiciones/financiamiento exactos y pertinentes.
  REGLA DURA: información inventada presentada como cierta → 0 pts en D3 + FLAG F3.
  Información incorrecta (no inventada, un error real): penaliza dentro del nivel, máximo 5 pts.

D4 — propuesta: "Construcción de Propuesta y Alternativas" (0-15 pts)
  Evalúa si transforma la necesidad detectada en una recomendación.
  0=Nulo: solo muestra productos sin vincularlos a la necesidad.
  5=Insuficiente: recomienda algo pero no explica por qué; no compara; no hay alternativa.
  10=Aceptable: recomienda y justifica; presenta al menos una alternativa.
  15=Sobresaliente: traduce la necesidad en recomendación, explica por qué, compara, presenta alternativas, adapta la propuesta si la primera no funciona.
  Regla: mostrar productos sin explicar por qué son adecuados NO equivale a construir propuesta.

D5 — objeciones: "Manejo de Objeciones y Competencia" (0-15 pts)
  Evalúa manejo de: precio, competencia, falta de stock, marca, presupuesto, dudas, financiamiento, intención de pensarlo/abandonar.
  0=Nulo: no hace ningún intento; ignora la objeción o cede de inmediato.
  5=Insuficiente: intento débil, genérico o evasivo; no aborda la objeción real.
  10=Aceptable: aborda la objeción con un intento comercial razonable; puede no superarla.
  15=Sobresaliente: identifica la objeción real y la trabaja con argumentos, alternativas, equivalencias o financiamiento, manteniendo viva la oportunidad.
  Regla: NO es obligatorio superar la objeción. SÍ es obligatorio evaluar si hubo un intento comercial razonable.

D6 — cierre: "Cierre y Recuperación de la Oportunidad" (0-15 pts)
  Busca: preguntas de cierre, propuesta concreta, invitación a avanzar, reserva, búsqueda de inventario, alternativa, seguimiento, recuperación si el cliente muestra intención de retirarse.
  0=Nulo: no cierra, no invita a avanzar, no recupera.
  5=Insuficiente: cierre débil o solo despedida; ninguna acción de recuperación.
  10=Aceptable: propone avanzar, busca stock, ofrece reserva o alternativa; recuperación parcial.
  15=Sobresaliente: cierre claro y concreto, invitación explícita a avanzar, recuperación activa ante intención de retiro, seguimiento cuando corresponde.
  DISTINCIÓN OBLIGATORIA (campo ventaEstado):
  - "NO_CERRADA": el cliente no compró pero el asesor ejecutó todas las acciones comerciales razonables. NO penaliza D6.
  - "ABANDONADA": existía oportunidad razonable y el asesor permitió que terminara sin intentar cerrar, manejar la objeción, presentar alternativa, buscar solución, ofrecer seguimiento o cualquier acción comercial razonable. Penaliza D6 + FLAG F2. Debes explicar en observation qué evidencia del audio demuestra el abandono.
  - "CERRADA": se concretó la venta o el pago.

D7 — cross_up: "Cross-Selling / Up-Selling" (0-5 pts)
  0=Nulo: no ofrece nada. 2=Insuficiente: oferta irrelevante o mecánica, solo por ofrecer. 3=Aceptable: ofrece complemento relacionado sin vincularlo a la necesidad. 5=Sobresaliente: identifica oportunidad razonable y la vincula a la necesidad (complementar, ampliar, mejorar, proteger, facilitar el uso).
  Regla: no premiar ofertas irrelevantes hechas únicamente por ofrecer.

D8 — experiencia: "Experiencia, Comunicación y Seguimiento" (0-5 pts)
  0=Nulo: sin saludo o despedida; trato seco, confuso o irrespetuoso. 2=Insuficiente: cumple lo mínimo; comunicación poco clara. 3=Aceptable: trato correcto, claro y respetuoso, sin destacar. 5=Sobresaliente: bienvenida, claridad, respeto, empatía, comunicación fluida, despedida y seguimiento cuando corresponde.

===============================================================================
BLOQUE 2 — DETECTOR DE MOMENTOS COMERCIALES CRÍTICOS
===============================================================================
Identifica explícitamente si ocurrió alguno de: (1) mención de competencia, (2) comparación de precios, (3) "está caro", (4) falta de stock, (5) producto no disponible, (6) "voy a pensarlo", (7) "voy a mirar en otro sitio", (8) presupuesto insuficiente, (9) duda sobre marca, (10) duda sobre producto, (11) objeción de financiamiento, (12) intención clara de retirarse, (13) solicitud de descuento, (14) preferencia por producto no disponible.

Para cada evento detectado, registra: evento, queDijoCliente, queHizoAsesor, quePodiaHacer, intentoRecuperar ("SI"|"PARCIAL"|"NO"), impacto, ajuste.
Asigna el ajuste EXACTAMENTE según el impacto (no inventes otros valores):
- "POSITIVO": ajuste = 1. El asesor convierte el evento en avance comercial claro (ej. objeción de precio → alternativa con financiamiento que el cliente acepta evaluar).
- "NEUTRO": ajuste = 0. El evento ocurre y el asesor responde correctamente, sin avance ni perjuicio.
- "GRAVE": ajuste = -3. El asesor responde mal, ignora, cede sin intentar, o no hay intento de recuperación existiendo oportunidad.
- "CRITICO": ajuste = -8. El asesor entrega la oportunidad, abandona la venta, inventa información o presiona indebidamente.
Regla anti-doble-penalización: las dimensiones (D1-D8) miden calidad de ejecución; el detector mide recuperación de la oportunidad. Son ejes distintos.

===============================================================================
BLOQUE 3 — REGLAS ESPECIALES Y BANDERAS DE FALLO (FLAGS)
===============================================================================
REGLA COMPETENCIA: si el cliente menciona cualquier competidor, evalúa obligatoriamente la reacción del asesor. Un buen asesor puede: preguntar qué compara, preguntar precio/condiciones, identificar diferencias reales, explicar beneficios reales, ofrecer equivalente, ajustar gama, presentar financiamiento, revisar disponibilidad, proponer alternativa. NO debe: inventar información, desacreditar falsamente al competidor, mentir, presionar indebidamente.
Si hay MENCIÓN DE COMPETENCIA + CERO INTENTO DE RECUPERACIÓN → agrega FLAG "F1" (oportunidad entregada a la competencia).

REGLA VENTA ABANDONADA: no clasifiques automáticamente como abandono solo porque el cliente no compró (ver distinción en D6). Si aplica, agrega FLAG "F2".

Banderas disponibles (agrega al array flags solo las que apliquen, usando exactamente estos códigos):
- "F1": Oportunidad entregada a la competencia.
- "F2": Venta abandonada por el asesor.
- "F3": Información inventada presentada como cierta (además, D3 = 0 pts obligatoriamente).
- "F4": Presión indebida o desacreditación falsa del competidor.
- "F5": Falta ética o legal (discriminación, manejo indebido de datos, promesa incumplible).

===============================================================================
BLOQUE 5 — LO QUE NO DEBES HACER
===============================================================================
1. No inferir lo que no se dijo. Solo evalúa lo observable en el audio.
2. No premiar cortesía genérica ("con gusto") como si fuera actitud comercial (D1).
3. No premiar preguntas mecánicas como detección de necesidades (D2).
4. No premiar ofertas irrelevantes como cross-selling (D7).
5. No confundir tono tranquilo con falta de actitud.
6. No penalizar al asesor porque el cliente no compró si ejecutó acciones razonables (ver NO_CERRADA).
7. No asumir contexto ausente (precio, stock, competidor) que no fue mencionado.

Manejo de audio: si un tramo es ininteligible, márcalo y evalúa con el resto. Si hay una sola voz audible, NO_EVALUABLE. Si el audio está cortado antes del cierre, informa que D6 no es puntuable con certeza pero igual asígnale el nivel que la evidencia disponible sostenga. Cambios de idioma o jerga local no penalizan.

===============================================================================
REGLAS ESTRICTAS DE SALIDA
===============================================================================
- transcript: extenso, cronológico, verbatim, con cada intercambio real.
- criteriaBreakdown: un objeto por cada dimensión APLICABLE según el Tipo de interacción (8 para Tipo A; solo actitud/conocimiento/experiencia para Tipo B o C), usando exactamente los criterionId: actitud, necesidades, conocimiento, propuesta, objeciones, cierre, cross_up, experiencia. Cada observation debe incluir cita textual literal del audio.
- ventaEstado: "CERRADA" | "NO_CERRADA" | "ABANDONADA" según la distinción de D6.
- contactCaptured: true si el asesor solicitó o capturó teléfono/WhatsApp del cliente.
- eventosCriticos: array con la estructura del Bloque 2 (puede ir vacío si no ocurrió ninguno).
- flags: array de códigos F1-F5 que apliquen (puede ir vacío).`;

    const promptText = `Por favor analiza y transcribe con máxima fidelidad la siguiente grabación real de una interacción comercial:
Tienda objetivo: ${storeName}
Ciudad: ${city}
Fecha estimada: ${recordingDate}
${additionalContext ? `Contexto adicional: ${additionalContext}` : ""}

Escucha el audio adjunto en su totalidad, clasifica el tipo de interacción (Fase 0), transcribe todos los turnos verbatim con marcas de tiempo, extrae la información real (vendedor, productos, precios, financiamiento, competidores mencionados), ejecuta el detector de momentos críticos, y califica las dimensiones aplicables según la Guía IDM.`;

    const audioPart = createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!);

    const textPart = {
      text: promptText,
    };

    console.log(`[Gemini Engine] Audio listo (ACTIVE) para ${storeName}, solicitando transcripción y auditoría...`);

    const response = await generateContentWithFallback({
      preferredModel: "gemini-3.7-flash",
      fallbackModels: ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite", "gemini-flash-latest"],
      maxRetries: 3,
      contents: { parts: [audioPart, textPart] },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storeName: { type: Type.STRING, description: "Nombre de la tienda identificada" },
            city: { type: Type.STRING, description: "Ciudad de la tienda" },
            seller: { type: Type.STRING, description: "Nombre o descripción del asesor comercial" },
            productEvaluated: { type: Type.STRING, description: "Producto principal evaluado en la visita" },
            duration: { type: Type.STRING, description: "Duración estimada de la interacción (ej: 4 min 12 seg)" },
            narrativeSummary: { type: Type.STRING, description: "Resumen ejecutivo detallado de lo que ocurrió en el audio (máximo 5 líneas, lenguaje gerencial)" },
            tipoInteraccion: { type: Type.STRING, description: "'A', 'B', 'C', 'D' o 'NO_EVALUABLE' según la Fase 0" },
            notEvaluableReason: { type: Type.STRING, description: "Si tipoInteraccion es 'D' o 'NO_EVALUABLE', explica exactamente por qué" },
            ventaEstado: { type: Type.STRING, description: "'CERRADA', 'NO_CERRADA' o 'ABANDONADA' según la distinción obligatoria de D6" },
            contactCaptured: { type: Type.BOOLEAN, description: "True si el vendedor solicitó datos de contacto o WhatsApp del cliente" },
            competitorMentioned: { type: Type.STRING, description: "Nombre del competidor mencionado, si aplica" },
            noPurchaseReason: { type: Type.STRING, description: "Motivo de no compra, si aplica" },
            mainObjectionType: { type: Type.STRING, description: "Tipo de objeción principal detectada, si aplica" },
            coachingAction: { type: Type.STRING, description: "Acción de coaching prioritaria sugerida para este asesor" },
            requiresHumanReview: { type: Type.BOOLEAN, description: "True si el caso amerita revisión humana (duda relevante, flags graves, audio ambiguo)" },
            transcript: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: {
                    type: Type.STRING,
                    description: "Hablante: 'Mystery Shopper', 'Vendedor', 'Cajero', 'Seguridad' o 'Ambiente'",
                  },
                  speakerName: { type: Type.STRING, description: "Nombre del hablante si se conoce" },
                  text: { type: Type.STRING, description: "Texto verbatim exacto transcrito" },
                  timestamp: { type: Type.STRING, description: "Marca de tiempo estimada mm:ss" },
                },
                required: ["speaker", "text"],
              },
            },
            criteriaBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criterionId: { type: Type.STRING, description: "Identificador exacto de la dimensión: actitud, necesidades, conocimiento, propuesta, objeciones, cierre, cross_up o experiencia" },
                  criterionName: { type: Type.STRING, description: "Nombre oficial de la dimensión (D1-D8)" },
                  score: { type: Type.NUMBER, description: "Puntaje obtenido según los niveles fijos de la dimensión (0 a maxScore)" },
                  maxScore: { type: Type.NUMBER, description: "Puntaje máximo posible (15 o 5 según la dimensión)" },
                  observation: { type: Type.STRING, description: "Observación con cita textual literal y justificación detallada del nivel asignado" },
                  status: { type: Type.STRING, description: "'good', 'acceptable' o 'deficient'" },
                },
                required: ["criterionId", "criterionName", "score", "maxScore", "observation", "status"],
              },
            },
            eventosCriticos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  evento: { type: Type.STRING, description: "Cuál de los 14 momentos críticos ocurrió" },
                  queDijoCliente: { type: Type.STRING, description: "Cita textual de lo que dijo el cliente" },
                  queHizoAsesor: { type: Type.STRING, description: "Qué hizo el asesor en respuesta" },
                  quePodiaHacer: { type: Type.STRING, description: "Qué podía hacer razonablemente el asesor" },
                  intentoRecuperar: { type: Type.STRING, description: "'SI', 'PARCIAL' o 'NO'" },
                  impacto: { type: Type.STRING, description: "'POSITIVO', 'NEUTRO', 'GRAVE' o 'CRITICO'" },
                  ajuste: { type: Type.NUMBER, description: "Ajuste fijo según impacto: POSITIVO=1, NEUTRO=0, GRAVE=-3, CRITICO=-8" },
                },
                required: ["evento", "queDijoCliente", "queHizoAsesor", "quePodiaHacer", "intentoRecuperar", "impacto", "ajuste"],
              },
            },
            flags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Códigos de banderas de fallo que apliquen: F1, F2, F3, F4 y/o F5 (vacío si ninguna aplica)",
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Fortalezas destacadas demostradas en la grabación",
            },
            criticalAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Áreas críticas de mejora (brechas) y fallas en el proceso comercial",
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Recomendaciones puntuales de capacitación para el equipo",
            },
            keyQuotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING, description: "Tema o momento (ej: Saludo, Cierre, Objeción)" },
                  quote: { type: Type.STRING, description: "Cita literal textual dicha en el audio" },
                  timestamp: { type: Type.STRING, description: "Marca de tiempo" },
                },
              },
            },
          },
          required: [
            "transcript",
            "narrativeSummary",
            "tipoInteraccion",
            "criteriaBreakdown",
            "eventosCriticos",
            "flags",
            "ventaEstado",
            "contactCaptured",
            "strengths",
            "criticalAreas",
            "recommendations",
          ],
        },
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);

    // Interacciones no evaluables (Tipo D o NO_EVALUABLE) no llevan puntaje — se informa el
    // motivo en vez de fabricar un 0/100 que se vería como una evaluación real fallida.
    const interactionType = parsedData.tipoInteraccion;
    if (interactionType === "D" || interactionType === "NO_EVALUABLE") {
      throw new Error(
        parsedData.notEvaluableReason
          ? `Interacción no evaluable: ${parsedData.notEvaluableReason}`
          : "La IA determinó que esta grabación no es evaluable (Tipo D o sin datos suficientes)."
      );
    }

    // Calculate total score from dimensions. If Gemini didn't return usable criteria, that's a
    // failure too — better to error out than to silently present a fake 0/100 as if it were real.
    if (!Array.isArray(parsedData.criteriaBreakdown) || parsedData.criteriaBreakdown.length === 0) {
      throw new Error("Gemini no devolvió las dimensiones de evaluación esperadas en la respuesta.");
    }

    const dimensionsSum = parsedData.criteriaBreakdown.reduce(
      (sum: number, c: { score?: number }) => sum + (Number(c.score) || 0),
      0
    );

    // Recompute the detector adjustment deterministically from the individual events rather than
    // trusting a self-reported total — same philosophy as recomputing the score itself. Each
    // event's own "ajuste" is normalized to the fixed value its "impacto" implies, then the
    // POSITIVO/GRAVE/CRITICO subtotals are capped independently before being summed, and the
    // grand total is bounded to [-20, +3] per the Guía IDM.
    const criticalEvents = Array.isArray(parsedData.eventosCriticos) ? parsedData.eventosCriticos : [];
    const impactValue: Record<string, number> = { POSITIVO: 1, NEUTRO: 0, GRAVE: -3, CRITICO: -8 };
    let positivoSubtotal = 0;
    let graveSubtotal = 0;
    let criticoSubtotal = 0;
    for (const event of criticalEvents) {
      const fixedAdjustment = impactValue[event?.impacto] ?? 0;
      if (event?.impacto === "POSITIVO") positivoSubtotal += fixedAdjustment;
      else if (event?.impacto === "GRAVE") graveSubtotal += fixedAdjustment;
      else if (event?.impacto === "CRITICO") criticoSubtotal += fixedAdjustment;
    }
    positivoSubtotal = Math.min(positivoSubtotal, 3);
    graveSubtotal = Math.max(graveSubtotal, -9);
    criticoSubtotal = Math.max(criticoSubtotal, -16);
    let detectorAdjustment = positivoSubtotal + graveSubtotal + criticoSubtotal;
    detectorAdjustment = Math.max(-20, Math.min(3, detectorAdjustment));

    const rawFinalScore = dimensionsSum + detectorAdjustment;
    const calculatedScore = Math.max(0, Math.min(100, rawFinalScore));

    // Only known flag codes are honored — anything else Gemini might emit is dropped rather than
    // silently trusted, since flags directly cap the final classification.
    const validFlagCodes = ["F1", "F2", "F3", "F4", "F5"];
    const flags = Array.isArray(parsedData.flags)
      ? parsedData.flags.filter((f: string) => validFlagCodes.includes(f))
      : [];

    // Clasificación final: tabla de puntaje + requisitos mínimos de Asesor Smart + reglas de
    // tope por bandera (misma lógica que src/data/criteria.ts, mantenida aquí para que el
    // servidor no dependa del bundle del cliente).
    const has15PtBelow10 = parsedData.criteriaBreakdown.some(
      (c: { maxScore?: number; score?: number }) => c.maxScore === 15 && Number(c.score) < 10
    );
    const has5PtAtZero = parsedData.criteriaBreakdown.some(
      (c: { maxScore?: number; score?: number }) => c.maxScore === 5 && Number(c.score) === 0
    );
    let level: string;
    if (calculatedScore >= 90) level = "SMART";
    else if (calculatedScore >= 80) level = "SOLIDO";
    else if (calculatedScore >= 65) level = "EN_DESARROLLO";
    else if (calculatedScore >= 50) level = "INSUFICIENTE";
    else level = "CRITICO";
    if (level === "SMART" && (has15PtBelow10 || has5PtAtZero || flags.length > 0)) {
      level = "SOLIDO";
    }
    const tierOrder = ["CRITICO", "INSUFICIENTE", "EN_DESARROLLO", "SOLIDO", "SMART"];
    if (
      (flags.includes("F1") || flags.includes("F2") || flags.includes("F3")) &&
      tierOrder.indexOf(level) > tierOrder.indexOf("EN_DESARROLLO")
    ) {
      level = "EN_DESARROLLO";
    }
    if (flags.includes("F4")) {
      const idx = tierOrder.indexOf(level);
      if (idx > 0) level = tierOrder[idx - 1];
    }

    const saleStatus = parsedData.ventaEstado === "CERRADA" || parsedData.ventaEstado === "ABANDONADA"
      ? parsedData.ventaEstado
      : "NO_CERRADA";

    return {
      ...parsedData,
      criticalEvents,
      flags,
      dimensionsSum,
      detectorAdjustment,
      score: calculatedScore,
      level,
      saleStatus,
      saleClosed: saleStatus === "CERRADA",
      interactionType,
    };
  } catch (err: any) {
    console.error(`[Gemini Error] Falló el análisis de audio para ${storeName}:`, err?.message || err);
    throw new Error(friendlyGeminiErrorMessage(err));
  } finally {
    // Best-effort cleanup: the uploaded audio isn't needed once this request is done (it also
    // auto-expires on Gemini's side after 48h regardless), so free it up right away instead of
    // leaving it to pile up.
    if (uploadedFileName) {
      try {
        const client = getGeminiClient();
        await client?.files.delete({ name: uploadedFileName });
      } catch (cleanupErr) {
        console.warn(`[Gemini Engine] No se pudo borrar el archivo temporal ${uploadedFileName}:`, cleanupErr);
      }
    }
  }
}

// 1. Transcribe & Audit Direct Endpoint (Fallback)
app.post("/api/gemini/transcribe-audio", async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = "audio/mp4",
      storeName = "Tienda Retail",
      city = "Venezuela",
      recordingDate = "Julio 2026",
      additionalContext = "",
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "Falta el archivo de audio (audioBase64 es requerido)" });
    }

    const cleanBase64 = audioBase64.includes(",")
      ? audioBase64.split(",")[1]
      : audioBase64;

    const result = await executeGeminiAudioAudit({
      audioBuffer: Buffer.from(cleanBase64, "base64"),
      mimeType,
      storeName,
      city,
      recordingDate,
      additionalContext,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error transcribing audio with Gemini:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error al procesar y auditar el archivo de audio con Gemini",
    });
  }
});

// 2. Re-grade and Audit Existing Transcript
app.post("/api/gemini/regrade-transcript", async (req, res) => {
  try {
    const { transcript, storeName, city, productEvaluated } = req.body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: "Se requiere un array de transcript con las intervenciones" });
    }

    const transcriptText = transcript
      .map((t: any) => `[${t.timestamp || "00:00"}] ${t.speaker}: ${t.text}`)
      .join("\n");

    const systemPrompt = `Eres el motor de auditoría de la GUÍA IDM — VERSIÓN OPERATIVA COMPLETA para retail de tecnología y electrodomésticos en Venezuela. Aplicas la misma metodología determinista que usarías sobre el audio, pero ahora sobre una transcripción ya editada por un humano — trátala como la fuente de verdad completa de lo que ocurrió.

Antes de puntuar, clasifica la interacción (Tipo A: oportunidad comercial → evalúa D1-D8, 100 pts; Tipo B/C: consulta informativa o postventa → evalúa solo D1, D3, D8, 35 pts; Tipo D: trámite interno → NO_EVALUABLE).

Evalúa las 8 dimensiones aplicables, cada una con 4 niveles fijos (para 15 pts: 0=Nulo, 5=Insuficiente, 10=Aceptable, 15=Sobresaliente; para 5 pts: 0=Nulo, 2=Insuficiente, 3=Aceptable, 5=Sobresaliente), usando exactamente estos criterionId:
- actitud: Actitud e Intención Comercial (15 pts)
- necesidades: Detección de Necesidades (15 pts)
- conocimiento: Conocimiento y Credibilidad (15 pts) — información inventada presentada como cierta → 0 pts + FLAG F3
- propuesta: Construcción de Propuesta y Alternativas (15 pts)
- objeciones: Manejo de Objeciones y Competencia (15 pts)
- cierre: Cierre y Recuperación de la Oportunidad (15 pts) — distingue ventaEstado: CERRADA / NO_CERRADA (no penaliza si el asesor ejecutó acciones razonables) / ABANDONADA (penaliza + FLAG F2 si había oportunidad razonable y el asesor no hizo nada por recuperarla)
- cross_up: Cross-Selling / Up-Selling (5 pts)
- experiencia: Experiencia, Comunicación y Seguimiento (5 pts)

Ejecuta el detector de momentos críticos (mención de competencia, comparación de precios, "está caro", falta de stock, "voy a pensarlo", intención de retirarse, solicitud de descuento, etc.), registrando por cada evento: evento, queDijoCliente, queHizoAsesor, quePodiaHacer, intentoRecuperar (SI/PARCIAL/NO), impacto (POSITIVO=+1, NEUTRO=0, GRAVE=-3, CRITICO=-8) y ajuste.

Si el cliente menciona un competidor y hay cero intento de recuperación, agrega FLAG F1. Aplica F1-F5 según corresponda (F1: oportunidad entregada a la competencia; F2: venta abandonada por el asesor; F3: información inventada; F4: presión indebida o desacreditar al competidor; F5: falta ética o legal).

No infieras lo que no está en el texto. No premies cortesía genérica como actitud comercial ni preguntas mecánicas como detección de necesidades. Fundamenta cada dimensión con citas textuales literales extraídas de la transcripción.`;

    const response = await generateContentWithFallback({
      preferredModel: "gemini-3.7-flash",
      fallbackModels: ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite", "gemini-flash-latest"],
      maxRetries: 3,
      contents: `Evalúa con exactitud matemática y objetividad la siguiente transcripción de ${storeName || "Tienda"} (${city || "Venezuela"}):
Producto evaluado: ${productEvaluated || "Tecnología / Electrodomésticos"}

Transcripción Verbatim:
${transcriptText}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrativeSummary: { type: Type.STRING },
            tipoInteraccion: { type: Type.STRING, description: "'A', 'B', 'C', 'D' o 'NO_EVALUABLE'" },
            notEvaluableReason: { type: Type.STRING },
            ventaEstado: { type: Type.STRING, description: "'CERRADA', 'NO_CERRADA' o 'ABANDONADA'" },
            contactCaptured: { type: Type.BOOLEAN },
            criteriaBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criterionId: { type: Type.STRING },
                  criterionName: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  maxScore: { type: Type.NUMBER },
                  observation: { type: Type.STRING },
                  status: { type: Type.STRING },
                },
                required: ["criterionId", "criterionName", "score", "maxScore", "observation", "status"],
              },
            },
            eventosCriticos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  evento: { type: Type.STRING },
                  queDijoCliente: { type: Type.STRING },
                  queHizoAsesor: { type: Type.STRING },
                  quePodiaHacer: { type: Type.STRING },
                  intentoRecuperar: { type: Type.STRING },
                  impacto: { type: Type.STRING },
                  ajuste: { type: Type.NUMBER },
                },
                required: ["evento", "queDijoCliente", "queHizoAsesor", "quePodiaHacer", "intentoRecuperar", "impacto", "ajuste"],
              },
            },
            flags: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            criticalAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "narrativeSummary",
            "tipoInteraccion",
            "ventaEstado",
            "contactCaptured",
            "criteriaBreakdown",
            "eventosCriticos",
            "flags",
            "strengths",
            "criticalAreas",
            "recommendations",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    if (parsed.tipoInteraccion === "D" || parsed.tipoInteraccion === "NO_EVALUABLE") {
      throw new Error(
        parsed.notEvaluableReason
          ? `Interacción no evaluable: ${parsed.notEvaluableReason}`
          : "La IA determinó que esta transcripción no es evaluable."
      );
    }

    if (!Array.isArray(parsed.criteriaBreakdown) || parsed.criteriaBreakdown.length === 0) {
      throw new Error("Gemini no devolvió los criterios de evaluación esperados en la respuesta.");
    }

    const dimensionsSum = parsed.criteriaBreakdown.reduce(
      (sum: number, c: { score?: number }) => sum + (Number(c.score) || 0),
      0
    );

    const criticalEvents = Array.isArray(parsed.eventosCriticos) ? parsed.eventosCriticos : [];
    const impactValue: Record<string, number> = { POSITIVO: 1, NEUTRO: 0, GRAVE: -3, CRITICO: -8 };
    let positivoSubtotal = 0;
    let graveSubtotal = 0;
    let criticoSubtotal = 0;
    for (const event of criticalEvents) {
      const fixedAdjustment = impactValue[event?.impacto] ?? 0;
      if (event?.impacto === "POSITIVO") positivoSubtotal += fixedAdjustment;
      else if (event?.impacto === "GRAVE") graveSubtotal += fixedAdjustment;
      else if (event?.impacto === "CRITICO") criticoSubtotal += fixedAdjustment;
    }
    positivoSubtotal = Math.min(positivoSubtotal, 3);
    graveSubtotal = Math.max(graveSubtotal, -9);
    criticoSubtotal = Math.max(criticoSubtotal, -16);
    let detectorAdjustment = positivoSubtotal + graveSubtotal + criticoSubtotal;
    detectorAdjustment = Math.max(-20, Math.min(3, detectorAdjustment));

    const score = Math.max(0, Math.min(100, dimensionsSum + detectorAdjustment));

    const validFlagCodes = ["F1", "F2", "F3", "F4", "F5"];
    const flags = Array.isArray(parsed.flags) ? parsed.flags.filter((f: string) => validFlagCodes.includes(f)) : [];

    const has15PtBelow10 = parsed.criteriaBreakdown.some(
      (c: { maxScore?: number; score?: number }) => c.maxScore === 15 && Number(c.score) < 10
    );
    const has5PtAtZero = parsed.criteriaBreakdown.some(
      (c: { maxScore?: number; score?: number }) => c.maxScore === 5 && Number(c.score) === 0
    );
    let level: string;
    if (score >= 90) level = "SMART";
    else if (score >= 80) level = "SOLIDO";
    else if (score >= 65) level = "EN_DESARROLLO";
    else if (score >= 50) level = "INSUFICIENTE";
    else level = "CRITICO";
    if (level === "SMART" && (has15PtBelow10 || has5PtAtZero || flags.length > 0)) {
      level = "SOLIDO";
    }
    const tierOrder = ["CRITICO", "INSUFICIENTE", "EN_DESARROLLO", "SOLIDO", "SMART"];
    if (
      (flags.includes("F1") || flags.includes("F2") || flags.includes("F3")) &&
      tierOrder.indexOf(level) > tierOrder.indexOf("EN_DESARROLLO")
    ) {
      level = "EN_DESARROLLO";
    }
    if (flags.includes("F4")) {
      const idx = tierOrder.indexOf(level);
      if (idx > 0) level = tierOrder[idx - 1];
    }

    const saleStatus = parsed.ventaEstado === "CERRADA" || parsed.ventaEstado === "ABANDONADA" ? parsed.ventaEstado : "NO_CERRADA";

    res.json({
      success: true,
      data: {
        ...parsed,
        criticalEvents,
        flags,
        dimensionsSum,
        detectorAdjustment,
        score,
        level,
        saleStatus,
        saleClosed: saleStatus === "CERRADA",
      },
    });
  } catch (error: any) {
    console.error("Error recalculando con Gemini en regrade-transcript:", error?.message || error);
    res.status(500).json({
      success: false,
      error: friendlyGeminiErrorMessage(error),
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} (http://0.0.0.0:${PORT})`);
  });
}

startServer();
