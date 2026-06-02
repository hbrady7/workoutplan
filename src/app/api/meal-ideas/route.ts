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

interface Idea {
  name: string;
  description: string;
  approx_protein_g: number;
  why_it_fits: string;
}

export async function POST(req: Request) {
  if (!hasGeminiKey()) {
    return NextResponse.json(
      { ok: false, code: "NO_KEY", error: "AI isn't configured yet." },
      { status: 200 },
    );
  }

  let ingredients = "";
  try {
    const body = (await req.json()) as { ingredients?: string };
    ingredients = (body.ingredients ?? "").toString().trim();
  } catch {
    ingredients = "";
  }
  if (!ingredients) {
    return NextResponse.json(
      { ok: false, code: "ERROR", error: "List a few ingredients first." },
      { status: 200 },
    );
  }

  const prompt = `You are a supportive nutrition coach for a fat-loss + muscle plan.
Guidance for every idea: protein first, whole foods, plenty of veg/fiber, healthy fats, low added sugar (liver-smart). Keep it simple and realistic.
Suggest 3 to 5 meal ideas using mainly these on-hand ingredients (common pantry staples like oil, salt, spices are fine to assume): "${ingredients.slice(0, 500)}".

Respond with JSON ONLY (no prose, no markdown fences): an array of objects, each exactly:
{"name": string, "description": string, "approx_protein_g": number, "why_it_fits": string}
"description" is one short sentence. "why_it_fits" is a short phrase tying it to the principles.`;

  try {
    const raw = await callGemini(prompt, { temperature: 0.7 });
    const parsed = extractJson<unknown>(raw);
    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { ideas?: unknown[] })?.ideas)
        ? (parsed as { ideas: unknown[] }).ideas
        : [];
    const ideas: Idea[] = arr
      .slice(0, 5)
      .map((it) => {
        const o = (it ?? {}) as Partial<Idea>;
        return {
          name: typeof o.name === "string" ? o.name : "Idea",
          description: typeof o.description === "string" ? o.description : "",
          approx_protein_g: num(o.approx_protein_g),
          why_it_fits: typeof o.why_it_fits === "string" ? o.why_it_fits : "",
        };
      })
      .filter((i) => i.description || i.name !== "Idea");

    if (ideas.length === 0) {
      return NextResponse.json(
        { ok: false, code: "ERROR", error: "Couldn't come up with ideas — add more ingredients." },
        { status: 200 },
      );
    }
    return NextResponse.json({ ok: true, data: ideas });
  } catch (e) {
    const code = e instanceof GeminiError ? e.code : "ERROR";
    const error =
      code === "RATE_LIMIT"
        ? "AI is busy right now — try again in a moment."
        : "Couldn't generate ideas — try again.";
    return NextResponse.json({ ok: false, code, error }, { status: 200 });
  }
}
