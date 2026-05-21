import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { showId } = await req.json();

  // Load show + theme
  const { data: show } = await supabase
    .from("shows")
    .select("*, themes(*)")
    .eq("id", showId)
    .single();

  if (!show) return NextResponse.json({ error: "Show not found" }, { status: 404 });

  const theme = show.themes;

  // Load all answers with their questions
  const { data: answers } = await supabase
    .from("answers")
    .select("*, questions(*)")
    .eq("show_id", showId)
    .order("submitted_at");

  if (!answers?.length) {
    return NextResponse.json({ error: "No answers yet" }, { status: 400 });
  }

  // Group answers by question
  const grouped: Record<number, { question: string; answers: string[] }> = {};
  for (const a of answers) {
    const qid = a.question_id;
    if (!grouped[qid]) {
      grouped[qid] = { question: a.questions?.text ?? "", answers: [] };
    }
    grouped[qid].answers.push(a.text);
  }

  const isTurkish = theme.language === "tr";
  const langNote = isTurkish ? "Write entirely in Turkish." : "Write in English.";

  const qaBlock = Object.values(grouped)
    .map(({ question, answers }) => {
      const listed = answers.map((a, i) => `  ${i + 1}. ${a}`).join("\n");
      return `QUESTION: ${question}\nANSWERS:\n${listed}`;
    })
    .join("\n\n");

  const prompt = `You are a comedy writer helping a stand-up comedian named Metin Celik craft an absurd, funny script for a live audience show.

THEME: ${theme.name}
OUTPUT FORMAT: ${theme.script_format}

INSTRUCTIONS:
- From each question's answers, pick the single funniest/weirdest one to use in the script.
- Lightly rephrase answers for comedic flow but keep the spirit and content intact — don't invent things.
- Use misdirection, absurdity, and unexpected twists. Keep it clean (no profanity, no offensive content).
- Build tension and release throughout. The script should feel like it escalates in absurdity toward the end.
- The comedian will READ this script aloud, so write in a natural spoken voice.
- Format it clearly so it's easy to read on stage. Use line breaks generously.
- ${langNote}

AUDIENCE ANSWERS:
${qaBlock}

Now write the complete script in the format described above.`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  let content: string;
  try {
    const result = await model.generateContent(prompt);
    content = result.response.text();
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json({ error: "Gemini API failed: " + String(err) }, { status: 500 });
  }

  // Upsert script
  const { data: existing } = await supabase
    .from("scripts")
    .select("id")
    .eq("show_id", showId)
    .single();

  if (existing) {
    await supabase.from("scripts").update({ content, generated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await supabase.from("scripts").insert({ show_id: showId, content });
  }

  return NextResponse.json({ content });
}
