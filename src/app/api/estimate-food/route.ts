import { NextResponse } from "next/server";
import {
  callGemini,
  extractJson,
  GeminiError,
  hasGeminiKey,
  num,
} from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Estimate {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: "low" | "medium" | "high";
  assumptions: string;
}

export async function POST(req: Request) {
  if (!hasGeminiKey()) {
    return NextResponse.json(
      { ok: false, code: "NO_KEY", error: "AI isn't configured yet." },
      { status: 200 },
    );
  }

  let description = "";
  try {
    const body = (await req.json()) as { description?: string };
    description = (body.description ?? "").toString().trim();
  } catch {
    description = "";
  }
  if (!description) {
    return NextResponse.json(
      { ok: false, code: "ERROR", error: "Describe what you ate first." },
      { status: 200 },
    );
  }

  const prompt = `You are a nutrition estimator. Estimate the nutrition for this meal description.
Respond with JSON ONLY (no prose, no markdown fences), exactly this shape:
{"calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "confidence": "low|medium|high", "assumptions": string}
Use typical portion sizes when unspecified and note them briefly in "assumptions". Be realistic, not precise.

Meal: "${description.slice(0, 500)}"`;

  try {
    const raw = await callGemini(prompt, { temperature: 0.3 });
    const parsed = extractJson<Partial<Estimate>>(raw);
    const conf =
      parsed.confidence === "high" || parsed.confidence === "medium"
        ? parsed.confidence
        : "low";
    const data: Estimate = {
      calories: num(parsed.calories),
      protein_g: num(parsed.protein_g),
      carbs_g: num(parsed.carbs_g),
      fat_g: num(parsed.fat_g),
      confidence: conf,
      assumptions:
        typeof parsed.assumptions === "string" ? parsed.assumptions : "",
    };
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const code = e instanceof GeminiError ? e.code : "ERROR";
    const error =
      code === "RATE_LIMIT"
        ? "AI is busy right now — try again in a moment."
        : "Couldn't estimate that — try rewording it.";
    return NextResponse.json({ ok: false, code, error }, { status: 200 });
  }
}
