"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Show, Question } from "@/lib/supabase";

export default function ShowPage() {
  const [show, setShow] = useState<Show | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: showData } = await supabase
        .from("shows")
        .select("*, themes(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!showData) {
        setError("No active show right now — check back soon!");
        setLoading(false);
        return;
      }

      setShow(showData);

      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("theme_id", showData.theme_id)
        .order("order_num");

      setQuestions(qs ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!show) return;

    const unanswered = questions.find((q) => !answers[q.id]?.trim());
    if (unanswered) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    const rows = questions.map((q) => ({
      show_id: show.id,
      question_id: q.id,
      text: answers[q.id].trim(),
    }));

    const { error: err } = await supabase.from("answers").insert(rows);
    if (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-amber-400 text-xl animate-pulse">Loading…</div>
      </div>
    );
  }

  if (error && !show) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-4">
        <div className="text-5xl">🎤</div>
        <p className="text-gray-400 text-lg">{error}</p>
      </div>
    );
  }

  const theme = show?.themes;
  const isTurkish = theme?.language === "tr";

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="text-5xl mb-6">🎤</div>
        <h1 className="text-3xl font-bold text-amber-400 mb-3">
          {isTurkish ? "Teşekkürler!" : "Thanks!"}
        </h1>
        <p className="text-gray-400 text-lg max-w-sm">
          {isTurkish
            ? "Cevapların alındı. İyi eğlenceler!"
            : "Your answers are in. Enjoy the show!"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-10">
      <div className="mb-8 text-center">
        <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-1">
          {isTurkish ? "Bu gecenin teması" : "Tonight's theme"}
        </p>
        <h1 className="text-3xl font-bold">{theme?.name}</h1>
        <p className="text-gray-400 mt-2 text-sm">
          {isTurkish ? "Aşağıdaki soruları yanıtla." : "Answer each question below."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-gray-900 rounded-2xl p-5">
            <label className="block text-sm text-amber-400 font-semibold mb-2">
              {i + 1} / {questions.length}
            </label>
            <p className="text-white font-medium mb-3">{q.text}</p>
            <textarea
              rows={3}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              placeholder={isTurkish ? "Cevabını yaz…" : "Your answer…"}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>
        ))}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl text-lg transition-colors">
          {submitting
            ? "Submitting…"
            : isTurkish
            ? "Cevapları Gönder 🎤"
            : "Submit My Answers 🎤"}
        </button>
      </form>
    </div>
  );
}
