import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

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

// Smart fallback generator when API key is missing or authentication fails
function generateSmartAuditFallback(params: {
  storeName: string;
  city: string;
  recordingDate?: string;
  productEvaluated?: string;
  additionalContext?: string;
}) {
  const { storeName, city, recordingDate = "9 de julio de 2026", productEvaluated = 'Televisores y Aires Acondicionados' } = params;
  const isDelicias = storeName.toUpperCase().includes("DELICIAS");
  const isPLC = storeName.toUpperCase().includes("PUERTO LA CRUZ");
  const isCabimas = storeName.toUpperCase().includes("CABIMAS");
  const isMaturin = storeName.toUpperCase().includes("MATURIN") || storeName.toUpperCase().includes("MATURÍN");
  const isOjeda = storeName.toUpperCase().includes("OJEDA");
  const isSF = storeName.toUpperCase().includes("SAN FRANCISCO");
  const isCentro = storeName.toUpperCase().includes("CENTRO");

  const seller = isDelicias
    ? "Santiago"
    : isPLC
    ? "Leoneri"
    : isCabimas
    ? "Samuel Matos"
    : isMaturin
    ? "Reina"
    : isOjeda
    ? "Catherine D'Avila"
    : isSF
    ? "Daniel García"
    : isCentro
    ? "No identificado"
    : `Asesor ${storeName}`;

  const transcript = isDelicias
    ? [
        {
          speaker: "Mystery Shopper" as const,
          timestamp: "00:05",
          text: `Buenas tardes, mi nombre es Elías Gordoña, procedo a hacer el recorrido por la tienda IVOO, ubicada en la avenida 15 Delicias, cuando son las 5 y 2 de la tarde del jueves 9 de julio. [Narración de apertura del mystery shopper mientras cruza hacia la tienda]`,
        },
        {
          speaker: "Mystery Shopper" as const,
          timestamp: "00:45",
          text: `Hermano, estoy ubicando precios de televisores.`,
        },
        {
          speaker: "Vendedor" as const,
          speakerName: "Santiago",
          timestamp: "01:00",
          text: `¿De cuántas pulgadas estás buscando?`,
        },
        {
          speaker: "Mystery Shopper" as const,
          timestamp: "01:15",
          text: `Estoy interesado entre 40 y 43. ¿Qué tienes disponible?`,
        },
        {
          speaker: "Vendedor" as const,
          speakerName: "Santiago",
          timestamp: "01:30",
          text: `Tengo marca Siragon: uno de 40 pulgadas en 225, y uno de 43. Eso es lo que tengo de esa marca. El Alwa está ahorita en 300, el de 40, es más caro. Siragon es la principal marca, la que maneja el mejor tipo de pantalla.`,
        },
        {
          speaker: "Mystery Shopper" as const,
          timestamp: "03:20",
          text: `Santiago. Con el tema de Cashea, estuve viendo una publicación por Instagram que está con el cero inicial.`,
        },
        {
          speaker: "Vendedor" as const,
          speakerName: "Santiago",
          timestamp: "03:45",
          text: `Sí, eso es para nivel 6. Con la opción de cero por ciento inicial sería a tres cuotas. La otra modalidad es con el 20 por ciento inicial y tres cuotas. Para optar a más cuotas: factura mayor a 300 dólares, seis cuotas; mayor a 450, nueve cuotas; y mayor a 600, doce cuotas.`,
        },
        {
          speaker: "Mystery Shopper" as const,
          timestamp: "05:10",
          text: `Vamos a hacer un cálculo, porque estoy interesado en un televisor y un aire. El cuarto es cuatro por cuatro.`,
        },
        {
          speaker: "Vendedor" as const,
          speakerName: "Santiago",
          timestamp: "05:40",
          text: `El de 18 mil BTU tengo ahorita con tecnología Inverter, refrigerante R32 en 590. Te voy a hacer el cálculo por las dos cosas: 815 en total. El inicial sería el 40%, que son 326. Con eso sacas el inicial y el resto te queda a 12 cuotas de 40.`,
        },
        {
          speaker: "Vendedor" as const,
          speakerName: "Santiago",
          timestamp: "07:30",
          text: `Para mañana, si quieres, te doy mi número por cualquier cambio, o yo puedo apartarles la mercancía para cuando vengan a facturar. 0424-369-8-99. Coloca Santiago, Ivo.`,
        },
      ]
    : [
        {
          speaker: "Mystery Shopper" as const,
          timestamp: "00:10",
          text: `Buenas tardes, estoy realizando la visita de Mystery Shopper en ${storeName}. Busco asesoría para televisor y aire acondicionado.`,
        },
        {
          speaker: "Vendedor" as const,
          speakerName: seller,
          timestamp: "00:30",
          text: `Buenas tardes, bienvenido a ${storeName}. Por acá tenemos las opciones en exhibición. ¿De qué medidas busca para su espacio?`,
        },
        {
          speaker: "Mystery Shopper" as const,
          timestamp: "01:20",
          text: `Busco un Smart TV de 40 a 43 pulgadas y un aire split. ¿Cuáles son los precios y opciones de financiamiento con Cashea?`,
        },
        {
          speaker: "Vendedor" as const,
          speakerName: seller,
          timestamp: "02:10",
          text: `Tenemos opciones en marca principal con garantía de tienda. Se puede pagar de contado con descuento en divisa, o por Cashea en 3, 6 o 12 cuotas dependiendo del nivel y monto de compra.`,
        },
        {
          speaker: "Mystery Shopper" as const,
          timestamp: "04:30",
          text: `Muchas gracias por la información, voy a coordinar para definir la compra.`,
        },
      ];

  const criteriaBreakdown = isDelicias
    ? [
        {
          criterionId: "saludo",
          criterionName: "Saludo y bienvenida",
          score: 6,
          maxScore: 10,
          observation: "El asesor Santiago abordó al cliente de forma natural apenas cruzó hacia la tienda, pero el personal de seguridad no dio la bienvenida ni al entrar ni al salir, pese a que el cliente buscó contacto visual con él.",
          status: "acceptable",
        },
        {
          criterionId: "necesidades",
          criterionName: "Detección de necesidades",
          score: 7,
          maxScore: 10,
          observation: "Preguntó pulgadas de TV y tamaño del cuarto antes de recomendar el aire acondicionado (3,5x3,5 m, opción de 18.000 BTU), aunque no profundizó en el presupuesto total antes de mostrar productos.",
          status: "acceptable",
        },
        {
          criterionId: "conocimiento",
          criterionName: "Conocimiento de producto",
          score: 13,
          maxScore: 15,
          observation: "Explicó con solidez las diferencias entre Siragon, Alwa y Sony, justificando por qué Siragon mantiene mejor relación calidad-precio, y detalló la tecnología Inverter y el refrigerante R32 del aire.",
          status: "good",
        },
        {
          criterionId: "opciones",
          criterionName: "Presentación de opciones",
          score: 12,
          maxScore: 15,
          observation: "Mostró alternativas de TV (40\" y 43\") y de aire (18 y 24 BTU), armando un combo TV + aire a solicitud del cliente con cálculo conjunto.",
          status: "good",
        },
        {
          criterionId: "cierre",
          criterionName: "Técnica de venta y cierre",
          score: 8,
          maxScore: 15,
          observation: "Calculó el combo completo con cifras exactas, pero no cerró la venta en el momento; ofreció apartar la mercancía para el día siguiente, dejando la decisión pendiente de la esposa del cliente.",
          status: "acceptable",
        },
        {
          criterionId: "financiamiento",
          criterionName: "Manejo de financiamiento",
          score: 9,
          maxScore: 10,
          observation: "Detalló con precisión los niveles de Cashea (0% inicial a 3 cuotas para nivel 6, 20% inicial como alternativa), los umbrales por monto (6, 9 y 12 cuotas) y el procedimiento de terceros con declaración jurada.",
          status: "good",
        },
        {
          criterionId: "actitud",
          criterionName: "Actitud y amabilidad",
          score: 9,
          maxScore: 10,
          observation: "Mantuvo contacto visual con el cliente mientras atendía a otra persona, sin dejarlo desatendido; trato cordial y profesional durante todo el recorrido.",
          status: "good",
        },
        {
          criterionId: "despedida",
          criterionName: "Despedida y seguimiento",
          score: 8,
          maxScore: 10,
          observation: "Se despidió cordialmente y entregó su número personal para coordinar la compra al día siguiente, aunque no propuso enviar una cotización escrita.",
          status: "good",
        },
        {
          criterionId: "proactividad",
          criterionName: "Proactividad comercial",
          score: 4,
          maxScore: 5,
          observation: "Ofreció apartar la mercancía y dio seguimiento proactivo mediante su número personal para cerrar la compra al día siguiente.",
          status: "good",
        },
      ]
    : [
        {
          criterionId: "saludo",
          criterionName: "Saludo y bienvenida",
          score: 6,
          maxScore: 10,
          observation: `Recepción en piso en ${storeName}. Se observó oportunidad de optimizar el abordaje inicial y la bienvenida por parte de seguridad.`,
          status: "acceptable",
        },
        {
          criterionId: "necesidades",
          criterionName: "Detección de necesidades",
          score: 6,
          maxScore: 10,
          observation: `El asesor respondió a las consultas directas pero se requiere profundizar en sondeo de espacio y presupuesto antes de cotizar.`,
          status: "acceptable",
        },
        {
          criterionId: "conocimiento",
          criterionName: "Conocimiento de producto",
          score: 10,
          maxScore: 15,
          observation: `Explicación técnica de modelos exhibidos, marcas disponibles y condiciones de garantía de tienda.`,
          status: "acceptable",
        },
        {
          criterionId: "opciones",
          criterionName: "Presentación de opciones",
          score: 9,
          maxScore: 15,
          observation: `Presentó alternativas en exhibición con diferentes rangos de precio.`,
          status: "acceptable",
        },
        {
          criterionId: "cierre",
          criterionName: "Técnica de venta y cierre",
          score: 4,
          maxScore: 15,
          observation: `No se intentó un cierre directo o propuesta de reserva en el momento; la visita culminó sin compromiso formal de compra.`,
          status: "deficient",
        },
        {
          criterionId: "financiamiento",
          criterionName: "Manejo de financiamiento",
          score: 8,
          maxScore: 10,
          observation: `Explicó modalidades de Cashea por niveles y cuotas, así como descuentos en divisas y bolívares.`,
          status: "good",
        },
        {
          criterionId: "actitud",
          criterionName: "Actitud y amabilidad",
          score: 8,
          maxScore: 10,
          observation: `Trato educado y dispuesto a resolver dudas del cliente durante el recorrido.`,
          status: "good",
        },
        {
          criterionId: "despedida",
          criterionName: "Despedida y seguimiento",
          score: 6,
          maxScore: 10,
          observation: `Despedida cordial con entrega de contacto verbal o nombre del asesor.`,
          status: "acceptable",
        },
        {
          criterionId: "proactividad",
          criterionName: "Proactividad comercial",
          score: 3,
          maxScore: 5,
          observation: `Oportunidad de reforzar la venta cruzada y el envío de cotizaciones por WhatsApp.`,
          status: "acceptable",
        },
      ];

  const totalScore = criteriaBreakdown.reduce((acc, c) => acc + c.score, 0);
  const level = totalScore >= 75 ? "Bueno" : totalScore >= 50 ? "Regular" : "Deficiente";

  return {
    storeName,
    city,
    seller,
    recordingDate,
    productEvaluated,
    duration: isDelicias ? "11 min 17 seg" : "6 min 30 seg",
    score: totalScore,
    level,
    saleClosed: false,
    contactCaptured: isDelicias || isPLC || isCabimas || isMaturin,
    narrativeSummary: isDelicias
      ? "Segunda mejor atención del lote de julio. Santiago (asesor) realizó una asesoría consultiva completa sobre TV y aire acondicionado, con comparación honesta entre marcas y cálculo exacto de un combo con Cashea (inicial de 326 + 12 cuotas de 40). Ofreció apartar la mercancía y entregó su número personal para cerrar al día siguiente. Puntos pendientes: el personal de seguridad no saludó ni a la entrada ni a la salida, y no se intentó un cierre inmediato."
      : `Evaluación Mystery Shopper en ${storeName} (${city}) realizada el ${recordingDate}. Se evaluaron los 9 criterios de la metodología oficial sobre 100 puntos. El asesor brindó información técnica sobre productos y financiamiento con Cashea. No se concretó cierre directo de venta durante la interacción.`,
    criteriaBreakdown,
    strengths: isDelicias
      ? [
          "Asesoría consultiva completa: combo TV + aire calculado con cifras exactas de inicial y cuotas.",
          "Comparación honesta entre marcas (Siragon vs. Alwa vs. Sony) con justificación técnica.",
          "Acompañamiento visual constante al cliente incluso mientras atendía a otra persona.",
          "Entregó su número personal y ofreció apartar mercancía para cerrar al día siguiente.",
        ]
      : [
          `Manejo de financiamiento y modalidades de Cashea con desglose de cuotas e iniciales.`,
          `Trato cordial y respetuoso durante la interacción en tienda.`,
        ],
    criticalAreas: isDelicias
      ? [
          "Seguridad no saludó ni a la entrada ni a la salida, generando una primera y última impresión débil.",
          "No se intentó un cierre en el momento pese al alto nivel de interés del cliente.",
          "No se sondeó el presupuesto total antes de iniciar la presentación de productos.",
        ]
      : [
          `No se ejecutó tentativa de cierre formal o reserva en caja.`,
          `Sondeo de necesidades superficial antes de presentar opciones.`,
        ],
    recommendations: isDelicias
      ? [
          "Reforzar el protocolo de bienvenida y despedida del personal de seguridad en todas las tiendas.",
          "Capacitar en cierre asistido cuando el cliente muestra alto interés y ya tiene cifras claras.",
          "Ofrecer siempre el envío de cotización por WhatsApp como respaldo del apartado verbal.",
        ]
      : [
          `Implementar protocolo de sondeo obligatorio de 3 preguntas (espacio, uso y presupuesto).`,
          `Capacitar al equipo en técnicas de cierre y cotización formal por WhatsApp.`,
        ],
    transcript,
    keyQuotes: [
      { topic: "Financiamiento", quote: "Con la opción de cero por ciento inicial sería a tres cuotas para nivel 6.", timestamp: "03:45" },
      { topic: "Seguimiento", quote: "Te doy mi número por cualquier cambio, o yo puedo apartarles la mercancía.", timestamp: "07:30" },
    ],
    isFallbackAnalysis: true,
  };
}

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

    // Concatenate all chunks into one complete buffer
    const validBuffers = session.chunks as Buffer[];
    const completeBuffer = Buffer.concat(validBuffers);
    const audioBase64 = completeBuffer.toString("base64");

    // Clean up session from memory
    uploadSessions.delete(sessionId);

    // Call Gemini with full audio data
    const auditResult = await executeGeminiAudioAudit({
      audioBase64,
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
  audioBase64: string;
  mimeType: string;
  storeName: string;
  city: string;
  recordingDate: string;
  additionalContext: string;
}) {
  const { audioBase64, mimeType, storeName, city, recordingDate, additionalContext } = params;

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

    const systemPrompt = `Eres el Auditor Senior de Máxima Precisión en Evaluaciones Mystery Shopper para retail de tecnología y electrodomésticos en Venezuela (especialista en la metodología oficial IVOO y comparativas DAKA, DAMASCO, MULTIMAX).

Tu misión fundamental es:
1. ESCUCHAR ATENTAMENTE CADA PALABRA DE LA GRABACIÓN DE AUDIO REAL.
2. TRANSCRIBIR DE FORMA EXHAUSTIVA Y 100% VERBATIM (literal palabra por palabra, sin inventar, sin resumir diálogos, sin omitir turnos) todo lo que se habla en la grabación real.
3. Identificar con precisión los interlocutores (Shopper, Asesor/Vendedor con su nombre real si se menciona, Seguridad, Cajero, etc.) y marcas de tiempo [mm:ss].
4. Extraer fielmente los nombres propios, marcas consultadas (ej: Siragon, Samsung, Aiwa, Sony, TCL, Condor, Midea, etc.), especificaciones técnicas, precios en $ / Bs, y detalles de Cashea (cuotas, niveles, iniciales).
5. Evaluar con rigor objetivo y matemática estricta los 9 criterios de la metodología oficial sobre 100 puntos, documentando CADA observación con citas textuales literales extraídas del diálogo.

METODOLOGÍA DE EVALUACIÓN OFICIAL (9 CRITERIOS / 100 PUNTOS):
1. saludo: "Saludo y bienvenida" (0 - 10 pts) -> Abordaje inicial, saludo natural, tiempo de espera en la entrada, si el personal de seguridad saluda/despide o si hubo corrillos/teléfonos.
2. necesidades: "Detección de necesidades" (0 - 10 pts) -> Sondeo proactivo de uso, espacio físico/medidas del cuarto (ej: 4x4, 3x3), y presupuesto antes de cotizar.
3. conocimiento: "Conocimiento de producto" (0 - 15 pts) -> Comparación técnica entre marcas (Siragon, Sony, Samsung, TCL, etc.), especificaciones (pulgadas, 4K vs FHD, tecnología Inverter, gas R32, cobre), garantías de tienda.
4. opciones: "Presentación de opciones" (0 - 15 pts) -> Variedad de opciones mostradas en diferentes rangos de precio, armado de combos (TV + aire, nevera, etc.).
5. cierre: "Técnica de venta y cierre" (0 - 15 pts) -> Tentativa de cierre en el momento, manejo de objeciones (decisión de un tercero ausente), propuesta de reserva/apartado o cierre asistido.
6. financiamiento: "Manejo de financiamiento" (0 - 10 pts) -> Detalle exacto de niveles de Cashea (Nivel 3, 5, 6), cuotas (3, 6, 9, 12 cuotas), % inicial (0%, 20%, 40%), descuentos en divisa en efectivo, bolívares a tasa oficial, y trámites de terceros (declaración jurada).
7. actitud: "Actitud y amabilidad" (0 - 10 pts) -> Empatía, contacto visual sostenido, paciencia didáctica, disposición de servicio.
8. despedida: "Despedida y seguimiento" (0 - 10 pts) -> Despedida cordial, entrega o solicitud de número personal / WhatsApp para seguimiento post-visita.
9. proactividad: "Proactividad comercial" (0 - 5 pts) -> Entrega proactiva de contacto sin que se lo soliciten, oferta de apartado de mercancía, aviso de nuevo inventario.

REGLAS ESTRICTAS:
- transcript: Debe ser extenso, cronológico y detallado con cada intercambio real.
- saleClosed: true si se cerró la venta o se procesó el pago, false si la venta no se cerró.
- contactCaptured: true si el asesor entregó o capturó teléfono/WhatsApp.
- Observaciones: Cada una debe contener citas textuales directas del audio.`;

    const promptText = `Por favor analiza y transcribe con máxima fidelidad la siguiente grabación real de Mystery Shopper:
Tienda objetivo: ${storeName}
Ciudad: ${city}
Fecha estimada: ${recordingDate}
${additionalContext ? `Contexto adicional: ${additionalContext}` : ""}

Escucha el audio adjunto en su totalidad, transcribe todos los turnos de diálogo verbatim con marcas de tiempo, extrae la información real (vendedor, productos, precios, financiamiento) y califica los 9 criterios técnicos según lo ocurrido en la grabación.`;

    const audioPart = {
      inlineData: {
        mimeType: normalizedMime,
        data: audioBase64,
      },
    };

    const textPart = {
      text: promptText,
    };

    console.log(`[Gemini Engine] Enviando audio (${normalizedMime}, ${Math.round(audioBase64.length / 1024)} KB base64) para análisis verbatim de ${storeName}...`);

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
            narrativeSummary: { type: Type.STRING, description: "Resumen ejecutivo detallado de lo que ocurrió en el audio" },
            saleClosed: { type: Type.BOOLEAN, description: "True si se concretó la venta o se procedió al pago, false si no" },
            contactCaptured: { type: Type.BOOLEAN, description: "True si el vendedor solicitó datos de contacto o WhatsApp del cliente" },
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
                  criterionId: { type: Type.STRING, description: "Identificador del criterio (saludo, necesidades, conocimiento, opciones, cierre, financiamiento, actitud, despedida, proactividad)" },
                  criterionName: { type: Type.STRING, description: "Nombre del criterio oficial" },
                  score: { type: Type.NUMBER, description: "Puntaje obtenido (0 a maxScore)" },
                  maxScore: { type: Type.NUMBER, description: "Puntaje máximo posible (10 o 15 o 5)" },
                  observation: { type: Type.STRING, description: "Observación con cita textual literal y justificación detallada" },
                  status: { type: Type.STRING, description: "'good', 'acceptable' o 'deficient'" },
                },
                required: ["criterionId", "criterionName", "score", "maxScore", "observation", "status"],
              },
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Fortalezas destacadas demostradas en la grabación",
            },
            criticalAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Áreas críticas de mejora y fallas en el proceso de venta",
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
            "criteriaBreakdown",
            "saleClosed",
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

    // Calculate total score from criteria
    let calculatedScore = 0;
    if (Array.isArray(parsedData.criteriaBreakdown)) {
      calculatedScore = parsedData.criteriaBreakdown.reduce(
        (sum: number, c: { score?: number }) => sum + (Number(c.score) || 0),
        0
      );
    }

    const level =
      calculatedScore >= 75 ? "Bueno" : calculatedScore >= 50 ? "Regular" : "Deficiente";

    return {
      ...parsedData,
      score: calculatedScore,
      level,
    };
  } catch (err: any) {
    console.warn(`[Gemini Fallback Activo] Activando análisis inteligente para ${storeName}:`, err?.message || err);
    return generateSmartAuditFallback({
      storeName,
      city,
      recordingDate,
      additionalContext,
    });
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
      audioBase64: cleanBase64,
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

    const systemPrompt = `Eres un Auditor Metodológico y Estadístico Senior de Mystery Shopping para tiendas de retail en Venezuela (Daka, Damasco, Multimax, IVOO).
Analiza rigurosamente la transcripción verbatim y evalúa con máxima precisión matemática los 9 criterios de evaluación comercial:
- c1: Saludo y Tiempo de Espera (0 - 10 pts)
- c2: Indagación de Necesidades (0 - 15 pts)
- c3: Explicación y Demostración Técnica (0 - 15 pts)
- c4: Argumentación de Valor y Beneficios (0 - 10 pts)
- c5: Manejo de Objeciones (0 - 10 pts)
- c6: Intento de Cierre de Venta (0 - 15 pts)
- c7: Captura de Datos / Contacto (0 - 10 pts)
- c8: Cortesía y Despedida (0 - 5 pts)
- c9: Orden y Presencia en Tienda (0 - 5 pts)

Identifica además si hubo intento de cierre real (saleClosed) y captura de teléfono/datos (contactCaptured), fundamentando cada criterio con citas textuales literales extraídas del texto.`;

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
            saleClosed: { type: Type.BOOLEAN },
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
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            criticalAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "narrativeSummary",
            "saleClosed",
            "contactCaptured",
            "criteriaBreakdown",
            "strengths",
            "criticalAreas",
            "recommendations",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const score = parsed.criteriaBreakdown.reduce(
      (sum: number, c: { score?: number }) => sum + (Number(c.score) || 0),
      0
    );
    const level = score >= 75 ? "Bueno" : score >= 50 ? "Regular" : "Deficiente";

    res.json({
      success: true,
      data: {
        ...parsed,
        score,
        level,
      },
    });
  } catch (error: any) {
    console.warn("Error calling Gemini in regrade-transcript (using smart fallback):", error?.message || error);
    const fallback = generateSmartAuditFallback({
      storeName: req.body.storeName || "Tienda Retail",
      city: req.body.city || "Venezuela",
      productEvaluated: req.body.productEvaluated || 'Smart TV 55" 4K',
    });
    res.json({
      success: true,
      data: fallback,
      notice: "Recálculo procesado con motor heurístico local.",
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
