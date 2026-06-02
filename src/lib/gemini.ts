// SERVER-ONLY Gemini helper. Never import this from a client component.
// The API key is read from process.env.GEMINI_API_KEY and never leaves the server.

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type GeminiErrorCode = "NO_KEY" | "RATE_LIMIT" | "ERROR";

export class GeminiError extends Error {
  code: GeminiErrorCode;
  constructor(code: GeminiErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Calls Gemini and returns the raw text part. Throws GeminiError on failure. */
export async function callGemini(
  prompt: string,
  { temperature = 0.4 }: { temperature?: number } = {},
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("NO_KEY", "GEMINI_API_KEY is not set");

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch {
    throw new GeminiError("ERROR", "Could not reach the AI service");
  }

  if (res.status === 429) {
    throw new GeminiError("RATE_LIMIT", "AI is busy (rate limited) — try again shortly");
  }
  if (!res.ok) {
    throw new GeminiError("ERROR", `AI request failed (${res.status})`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new GeminiError("ERROR", "AI returned an empty response");
  return text;
}

/** Extract a JSON object/array from a model response, tolerating stray fences/prose. */
export function extractJson<T = unknown>(raw: string): T {
  let s = raw.trim();
  // Strip ```json ... ``` or ``` ... ``` fences.
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  // Narrow to the outermost JSON bracket pair.
  const firstObj = s.indexOf("{");
  const firstArr = s.indexOf("[");
  const start =
    firstArr === -1
      ? firstObj
      : firstObj === -1
        ? firstArr
        : Math.min(firstObj, firstArr);
  const lastObj = s.lastIndexOf("}");
  const lastArr = s.lastIndexOf("]");
  const end = Math.max(lastObj, lastArr);
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  return JSON.parse(s) as T;
}

export function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}
