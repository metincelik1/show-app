"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Theme, Show, Answer, Question } from "@/lib/supabase";
import QRCode from "qrcode";

type AnswerWithQuestion = Answer & { questions: Question };

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");

  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeShow, setActiveShow] = useState<Show | null>(null);
  const [answers, setAnswers] = useState<AnswerWithQuestion[]>([]);
  const [script, setScript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [scriptError, setScriptError] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [tab, setTab] = useState<"answers" | "script">("answers");
  const [bestPicks, setBestPicks] = useState<Record<number, string[]>>({});
  const scriptRef = useRef<HTMLDivElement>(null);
  const answersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_authed");
    if (saved === "1") setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    supabase.from("themes").select("*").order("id").then(({ data }) => setThemes(data ?? []));
  }, [authed]);

  useEffect(() => {
    if (!activeShow) return;

    supabase
      .from("answers")
      .select("*, questions(*)")
      .eq("show_id", activeShow.id)
      .order("submitted_at")
      .then(({ data }) => setAnswers((data as AnswerWithQuestion[]) ?? []));

    supabase
      .from("scripts")
      .select("content")
      .eq("show_id", activeShow.id)
      .single()
      .then(({ data }) => { if (data) setScript(data.content); });

    const channel = supabase
      .channel(`answers:${activeShow.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "answers",
        filter: `show_id=eq.${activeShow.id}`,
      }, async (payload) => {
        const { data } = await supabase
          .from("answers")
          .select("*, questions(*)")
          .eq("id", payload.new.id)
          .single();
        if (data) setAnswers((prev) => [...prev, data as AnswerWithQuestion]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeShow]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      sessionStorage.setItem("admin_authed", "1");
      setAuthed(true);
    } else {
      setPwError("Wrong password.");
    }
  }

  async function startShow(theme: Theme) {
    await supabase.from("shows").update({ is_active: false }).eq("is_active", true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data } = await supabase
      .from("shows")
      .insert({ theme_id: theme.id, code, is_active: true })
      .select("*, themes(*)")
      .single();
    if (data) {
      setActiveShow(data);
      setAnswers([]);
      setScript("");
      setBestPicks({});
      setScriptError("");
      setTab("answers");
      const url = `${window.location.origin}/show`;
      const qr = await QRCode.toDataURL(url, { width: 300, margin: 2 });
      setQrUrl(qr);
    }
  }

  async function generateScript() {
    if (!activeShow) return;
    setGenerating(true);
    setScriptError("");
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId: activeShow.id }),
      });
      const data = await res.json();
      if (data.content) {
        setScript(data.content);
        setTab("script");
      } else {
        setScriptError(data.error ?? "Generation failed — check Vercel logs.");
      }
    } catch {
      setScriptError("Request timed out or network error.");
    }
    setGenerating(false);
  }

  function togglePick(qid: number, answer: string) {
    setBestPicks(prev => {
      const current = prev[qid] ?? [];
      if (current.includes(answer)) {
        return { ...prev, [qid]: current.filter(a => a !== answer) };
      }
      if (current.length >= 2) return prev;
      return { ...prev, [qid]: [...current, answer] };
    });
  }

  function printRef(ref: React.RefObject<HTMLDivElement | null>) {
    const win = window.open("", "_blank");
    if (!win || !ref.current) return;
    win.document.write(`<html><head><title>Print</title><style>
      body { font-family: Georgia, serif; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 16px; line-height: 1.7; }
      h2 { font-size: 22px; margin-bottom: 8px; }
      pre, p { white-space: pre-wrap; }
    </style></head><body>${ref.current.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  }

  function printCrowdFavorites() {
    const lines = Object.entries(grouped)
      .map(([qid, { question }]) => {
        const picks = bestPicks[Number(qid)] ?? [];
        if (!picks.length) return "";
        const items = picks
          .map(a => `<p style="margin:4px 0 4px 24px; font-size:15px;">→ ${a}</p>`)
          .join("");
        return `<div style="margin-bottom:28px; page-break-inside:avoid;">
          <p style="font-weight:bold; color:#444; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">${question}</p>
          ${items}
        </div>`;
      })
      .filter(Boolean)
      .join("");

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Crowd Favorites</title><style>
      body { font-family: Georgia, serif; padding: 48px; max-width: 700px; margin: 0 auto; line-height: 1.8; }
      h1 { font-size: 28px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 36px; border-bottom: 2px solid #000; padding-bottom: 14px; }
    </style></head><body><h1>Crowd Favorites</h1>${lines}</body></html>`);
    win.document.close();
    win.print();
  }

  const grouped = answers.reduce<Record<number, { question: string; answers: string[] }>>((acc, a) => {
    const qid = a.question_id;
    if (!acc[qid]) acc[qid] = { question: a.questions?.text ?? "", answers: [] };
    acc[qid].answers.push(a.text);
    return acc;
  }, {});

  const uniqueSubmissions = answers.length > 0
    ? Math.round(answers.length / Object.keys(grouped).length)
    : 0;

  const hasPicks = Object.values(bestPicks).some(p => p.length > 0);

  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <form onSubmit={login} className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4">
          <h1 className="text-xl font-bold text-amber-400">Admin Login</h1>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Password"
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
          <button className="py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl">
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-amber-400 mb-6">🎤 Show Admin</h1>

      {!activeShow ? (
        <div>
          <p className="text-gray-400 mb-5">Select a theme to start a new show:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => startShow(t)}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-amber-500 rounded-2xl p-5 text-left transition-all">
                <p className="font-bold text-white text-lg">{t.name}</p>
                <p className="text-gray-400 text-sm mt-1">{t.name_tr}</p>
                {t.language === "tr" && (
                  <span className="mt-2 inline-block text-xs bg-amber-900 text-amber-300 px-2 py-0.5 rounded-full">Türkçe</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm">Active show</p>
              <h2 className="text-xl font-bold">{activeShow.themes?.name}</h2>
              <p className="text-amber-400 font-mono text-sm mt-0.5">
                Code: {activeShow.code} · {uniqueSubmissions} submission{uniqueSubmissions !== 1 ? "s" : ""}
              </p>
            </div>
            {qrUrl && (
              <div className="flex flex-col items-center gap-2">
                <img src={qrUrl} alt="QR Code" className="w-28 h-28 rounded-xl" />
                <p className="text-xs text-gray-500">finaldraft.metincelik.net/show</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setTab("answers")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "answers" ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
              Live Answers ({answers.length})
            </button>
            <button
              onClick={() => setTab("script")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "script" ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
              Final Draft {script ? "✓" : ""}
            </button>
          </div>

          {tab === "answers" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-500 text-xs">Tap a number to pick crowd favorites (max 2 per question)</p>
                <button
                  onClick={() => printRef(answersRef)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded-lg transition-colors">
                  🖨 Print All
                </button>
              </div>

              <div ref={answersRef}>
                {Object.values(grouped).length === 0 ? (
                  <p className="text-gray-500 text-center py-12">Waiting for audience answers…</p>
                ) : (
                  <div className="flex flex-col gap-6">
                    {Object.entries(grouped).map(([qid, { question, answers: ans }]) => (
                      <div key={qid} className="bg-gray-900 rounded-2xl p-5">
                        <p className="text-amber-400 font-semibold mb-3">{question}</p>
                        <div className="flex flex-col gap-2">
                          {ans.map((a, i) => {
                            const picks = bestPicks[Number(qid)] ?? [];
                            const pickIndex = picks.indexOf(a);
                            const isSelected = pickIndex >= 0;
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <button
                                  onClick={() => togglePick(Number(qid), a)}
                                  className={`w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-all ${
                                    isSelected
                                      ? "bg-amber-500 text-black scale-110"
                                      : "bg-gray-700 text-gray-500 hover:bg-gray-600 hover:text-gray-300"
                                  }`}>
                                  {isSelected ? pickIndex + 1 : "·"}
                                </button>
                                <div className={`flex-1 rounded-xl px-4 py-2.5 text-sm transition-colors ${
                                  isSelected
                                    ? "bg-amber-950 text-amber-100 border border-amber-800"
                                    : "bg-gray-800 text-gray-200"
                                }`}>
                                  {a}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-10 flex flex-col gap-4">
                {scriptError && (
                  <p className="text-red-400 text-sm text-center bg-red-950 rounded-xl px-4 py-3">{scriptError}</p>
                )}
                <button
                  onClick={printCrowdFavorites}
                  disabled={!hasPicks}
                  className="w-full py-6 bg-gray-900 hover:bg-gray-800 disabled:opacity-20 border-2 border-gray-600 hover:border-amber-500 rounded-2xl font-bold text-xl tracking-[0.2em] uppercase transition-all">
                  Crowd Favorites
                </button>
                <button
                  onClick={generateScript}
                  disabled={generating || answers.length === 0}
                  className="w-full py-6 bg-white hover:bg-gray-100 disabled:opacity-20 text-black rounded-2xl font-bold text-xl tracking-[0.2em] uppercase transition-all">
                  {generating ? "Generating…" : "Final Draft"}
                </button>
              </div>
            </div>
          )}

          {tab === "script" && (
            <div>
              {!script ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-6">No script yet — go back and hit Final Draft.</p>
                  <button
                    onClick={() => setTab("answers")}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors">
                    ← Back
                  </button>
                </div>
              ) : (
                <>
                  <div ref={scriptRef} className="bg-gray-900 rounded-2xl p-6 mb-6">
                    <h2 className="font-bold text-amber-400 text-lg mb-4">{activeShow.themes?.name} — Final Draft</h2>
                    <pre className="whitespace-pre-wrap text-gray-200 leading-relaxed font-serif text-base">{script}</pre>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => printRef(scriptRef)}
                      className="w-full py-6 bg-white hover:bg-gray-100 text-black rounded-2xl font-bold text-xl tracking-[0.2em] uppercase transition-all">
                      Print Final Draft
                    </button>
                    <button
                      onClick={generateScript}
                      disabled={generating}
                      className="w-full py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-sm rounded-xl transition-colors">
                      {generating ? "Regenerating…" : "↺ Regenerate"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={() => setActiveShow(null)}
            className="mt-10 text-gray-500 hover:text-gray-300 text-sm underline">
            ← End show / start new
          </button>
        </div>
      )}
    </div>
  );
}
