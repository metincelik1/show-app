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

  const { data: answers } = await supabase
    .from("answers")
    .select("*, questions(*)")
    .eq("show_id", showId)
    .order("submitted_at");

  if (!answers?.length) {
    return NextResponse.json({ error: "No answers yet" }, { status: 400 });
  }

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

  const rankPrompt = `For each question, pick the top 3 funniest or most interesting answers.
Return ONLY valid JSON, no markdown, no explanation:
[
  {"i": 1, "best": "exact answer text", "second": "exact answer text", "third": "exact answer text"},
  ...
]
If fewer than 3 answers exist for a question, use what is available (empty string "" for missing).

${orderedQuestions.map(q => `${q.idx}. QUESTION: ${q.question}\nANSWERS:\n${q.answers.map(a => `   - ${a}`).join("\n")}`).join("\n\n")}`;

  let picks: Array<{ i: number; best: string; second: string; third: string }>;
  try {
    const result = await model.generateContent(rankPrompt);
    let text = result.response.text().trim();
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    picks = JSON.parse(text);
  } catch {
    picks = orderedQuestions.map(q => ({
      i: q.idx,
      best: q.answers[0] ?? "",
      second: q.answers[1] ?? "",
      third: q.answers[2] ?? "",
    }));
  }

  const crowdFavorites: Record<number, string[]> = {};
  const bestAnswers: Record<number, string> = {};

  for (const pick of picks) {
    const q = orderedQuestions.find(oq => oq.idx === pick.i);
    if (!q) continue;
    if (pick.best) bestAnswers[q.qid] = pick.best;
    const faves = [pick.second, pick.third].filter(a => a && a.length > 0);
    if (faves.length > 0) crowdFavorites[q.qid] = faves;
  }

  return NextResponse.json({ crowdFavorites, bestAnswers });
}
