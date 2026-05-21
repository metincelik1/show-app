import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { showId } = await req.json();

  const { data: show } = await supabase
    .from("shows")
    .select("*, themes(*)")
    .eq("id", showId)
    .single();

  if (!show) return NextResponse.json({ error: "Show not found" }, { status: 404 });

  const theme = show.themes;

  const { data: answers } = await supabase
    .from("answers")
    .select("*, questions(*)")
    .eq("show_id", showId)
    .order("submitted_at");

  if (!answers?.length) {
    return NextResponse.json({ error: "No answers yet" }, { status: 400 });
  }

  // Build ordered list of questions with all their answers
  const grouped: Record<number, { question: string; answers: string[] }> = {};
  for (const a of answers) {
    const qid = a.question_id;
    if (!grouped[qid]) grouped[qid] = { question: a.questions?.text ?? "", answers: [] };
    grouped[qid].answers.push(a.text);
  }

  const orderedQuestions = Object.entries(grouped).map(([qid, data], idx) => ({
    idx: idx + 1,
    qid: Number(qid),
    question: data.question,
    answers: data.answers,
  }));

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Step 1: Rank answers — pick top 3 per question
  const rankPrompt = `You are helping a stand-up comedian select audience answers for a live show.

For each question, pick the top 3 funniest, weirdest, or most interesting answers.
Return ONLY valid JSON, no markdown fences, no explanation:
[
  {"i": 1, "best": "exact answer text", "second": "exact answer text", "third": "exact answer text"},
  {"i": 2, ...},
  ...
]

Rules:
- Only use answers that appear exactly in the list below.
- If fewer than 3 answers exist for a question, use what is available (leave "second"/"third" as empty string "").
- Return one object per question, using the question number "i".

${orderedQuestions.map(q => `
${q.idx}. QUESTION: ${q.question}
ANSWERS:
${q.answers.map(a => `   - ${a}`).join("\n")}
`).join("")}`;

  let picks: Array<{ i: number; best: string; second: string; third: string }>;
  try {
    const rankResult = await model.generateContent(rankPrompt);
    let rankText = rankResult.response.text().trim();
    rankText = rankText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    picks = JSON.parse(rankText);
  } catch (err) {
    console.error("Ranking parse error:", err);
    // Fallback: use positional answers
    picks = orderedQuestions.map(q => ({
      i: q.idx,
      best: q.answers[0] ?? "",
      second: q.answers[1] ?? "",
      third: q.answers[2] ?? "",
    }));
  }

  // Build crowd favorites: qid → [2nd, 3rd]
  const crowdFavorites: Record<number, string[]> = {};
  for (const pick of picks) {
    const q = orderedQuestions.find(oq => oq.idx === pick.i);
    if (!q) continue;
    const faves = [pick.second, pick.third].filter(a => a && a.length > 0);
    if (faves.length > 0) crowdFavorites[q.qid] = faves;
  }

  // Step 2: Write script using only the best answers
  const isTurkish = theme.language === "tr";
  const langNote = isTurkish ? "Write entirely in Turkish." : "Write in English.";

  const scriptQA = orderedQuestions.map(q => {
    const pick = picks.find(p => p.i === q.idx);
    const bestAnswer = pick?.best ?? q.answers[0] ?? "";
    return `QUESTION: ${q.question}\nSELECTED ANSWER: ${bestAnswer}`;
  }).join("\n\n");

  const scriptPrompt = `You are writing a tight comedy script for stand-up comedian Metin Celik to read live on stage.

THEME: ${theme.name}
FORMAT: ${theme.script_format}
LANGUAGE: ${langNote}

GOAL: Every single audience answer must land as a punchline and get a laugh. All ${orderedQuestions.length} answers are used — none are wasted.

RULES:
- Wrap every audience answer in **double asterisks** so the comedian knows to pause and emphasize it.
- Per answer: one short setup (max 15 words) → **the answer** → optionally one short twist/callback (max 10 words).
- The FORMAT above has a structure (sections, headers, bullet points, etc). Use that structure to add EXTRA laughs — funny section titles, absurd labels, escalating bureaucratic/WhatsApp/podcast language. These structural jokes are free real estate on top of the punchlines.
- Every word of yours must either set up a punchline or land one. No filler, no transitions that don't add to the joke.
- NO stage directions. NO "(pause)". NO act-out notes. NO parentheticals.
- Spoken voice — this is read aloud exactly as written.
- You may reorder the answers for comedic flow. Save the funniest or most absurd answer for last. Build the arc: warm up → escalate → biggest punchline at the end.

SELECTED ANSWERS:
${scriptQA}

Write it now. Every answer gets its laugh.`;

  let content: string;
  try {
    const scriptResult = await model.generateContent(scriptPrompt);
    content = scriptResult.response.text();
  } catch (err) {
    console.error("Script generation error:", err);
    return NextResponse.json({ error: "Gemini API failed: " + String(err) }, { status: 500 });
  }

  // Save script
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

  return NextResponse.json({ content, crowdFavorites });
}
