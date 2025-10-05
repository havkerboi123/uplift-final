// @ts-nocheck
'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useCallback, useMemo, useState } from 'react';

type WelcomeProps = {
  startButtonText?: string;
  onStartCall: () => void; // ✅ must match app.tsx
  disabled?: boolean;
  onAnalyzed?: (id: string, data: { type: string; levels: AnalysisLevel[]; concerns: string[] }) => void;
};

type AnalysisLevel = {
  name: string;
  value: string;
  reference_range?: string | null;
  what_it_is: string;
  your_level_means: string;
  why_it_matters: string;
  possible_causes?: string | null;
};

type AnalysisResponse = {
  success: boolean;
  id: string;
  timestamp: string;
  data: {
    type: string;
    levels: AnalysisLevel[];
    concerns: string[];
  };
  error?: string;
  message?: string;
};

export default function Welcome({
  startButtonText = 'Talk to Agent',
  onStartCall,
  disabled,
  onAnalyzed,
}: WelcomeProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canStart = useMemo(() => analysis?.success === true, [analysis]);
  const showStartDisabled = disabled || !canStart;

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setAnalysis(null);
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== 'image/png') {
      setError('Please upload a .png file.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file ?? null);
  }, []);

  const onSubmit = useCallback(async () => {
    if (!selectedFile) {
      setError('Please choose a .png file first.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setAnalysis(null);
    try {
      const form = new FormData();
      form.append('image', selectedFile);
      const resp = await fetch('/api/analyze', { method: 'POST', body: form });
      const json = (await resp.json()) as AnalysisResponse;
      if (!resp.ok || !json.success) {
        setError(json.message || json.error || 'Failed to analyze the image.');
      } else {
        setAnalysis(json);
        try {
          onAnalyzed?.(json.id, json.data);
        } catch {}
      }
    } catch (e: any) {
      setError(e?.message ?? 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedFile]);

  return (
    <main className="min-h-dvh bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.10),transparent_55%),linear-gradient(to_bottom,#0b1220,#0b1220)] text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
              <span className="text-xs font-bold tracking-wide">MV</span>
            </div>
            <span className="font-semibold tracking-tight">MedVoice</span>
          </div>
        </header>

        {/* Hero */}
        <section className="mt-16 grid place-items-center gap-10">
          <div className="max-w-2xl text-center">
            <h1 className="text-4xl leading-tight font-bold md:text-5xl">
              Understand your <span className="text-cyan-300">medical documents</span>
            </h1>
            <p className="mt-5 text-slate-300/90">
              A voice agent that explains labs, prescriptions, and doctor notes—in plain language.
              Private, simple, and secure.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mx-auto max-w-3xl">
                <label className="block text-sm text-slate-300/90">Upload your medical report (.png only)</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/png"
                    onChange={onFileChange}
                    className="max-w-xs text-sm file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-slate-900 file:hover:bg-white/90"
                  />
                  <button
                    onClick={onSubmit}
                    disabled={!selectedFile || isSubmitting}
                    className="inline-flex items-center justify-center rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-900 shadow transition hover:bg-cyan-300 focus:ring-4 focus:ring-cyan-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Analyzing…' : 'Analyze'}
                  </button>
                </div>
                {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
              </div>

              {analysis && analysis.success && (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-inner mx-auto max-w-4xl">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold tracking-tight">Report analysis</h3>
                      <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-300">
                        {analysis.data.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300">ID</span>
                      <code className="rounded-md bg-white/10 px-2 py-1 font-mono text-sm text-cyan-200">
                        {analysis.id}
                      </code>
                      <button
                        onClick={() => navigator.clipboard?.writeText(analysis.id).catch(() => {})}
                        className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Concerns */}
                  {analysis.data.concerns.length > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                      <div className="mb-2 flex items-center gap-2 text-amber-300">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-300" />
                        <span className="text-sm font-semibold">Concerns</span>
                      </div>
                      <ul className="ml-4 list-disc text-sm text-amber-100/90">
                        {analysis.data.concerns.map((c: string, idx: number) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Levels grid */}
                  {analysis.data.levels.length > 0 && (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {analysis.data.levels.map((lvl: AnalysisLevel, i: number) => {
                        const isAbnormal = (lvl.your_level_means || '').toLowerCase().includes('above') ||
                          (lvl.your_level_means || '').toLowerCase().includes('below') ||
                          (lvl.possible_causes ?? '') !== '';
                        return (
                          <div
                            key={i}
                            className={`rounded-xl border p-4 ${
                              isAbnormal
                                ? 'border-rose-400/20 bg-rose-400/5'
                                : 'border-emerald-400/20 bg-emerald-400/5'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-base font-semibold text-slate-100">{lvl.name}</div>
                              <div className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-slate-200">{lvl.value}</div>
                            </div>
                            <div className="mt-1 text-xs text-slate-300">Range: {lvl.reference_range ?? 'N/A'}</div>

                            <div className="mt-3 space-y-1 text-sm text-slate-200">
                              <div>{lvl.what_it_is}</div>
                              <div className="font-medium">{lvl.your_level_means}</div>
                              <div>{lvl.why_it_matters}</div>
                              {lvl.possible_causes && (
                                <div className="text-slate-300">Possible causes: {lvl.possible_causes}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center gap-4">
                {/* ✅ Gate start button until analysis is ready */}
                <button
                  onClick={onStartCall}
                  disabled={showStartDisabled}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-medium text-slate-900 shadow transition hover:shadow-lg focus:ring-4 focus:ring-cyan-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {startButtonText}
                </button>

                <a
                  href="#how-it-works"
                  className="text-slate-300 underline-offset-4 hover:text-white hover:underline"
                >
                  How it works
                </a>
              </div>
            </div>

            <div className="mt-6 text-xs text-slate-400">
              HIPAA-aware patterns • No data sold • Works on mobile/desktop
            </div>
          </div>

          <div className="relative" />
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { title: 'Upload or Read', desc: 'Share a PDF/photo or read key lines aloud.' },
            { title: 'Ask Anything', desc: 'Symptoms, meds, risks—get clear, safe answers.' },
            { title: 'Follow-ups', desc: 'Ask follow-ups and save a summary for later.' },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
            >
              <div className="mb-4 h-9 w-9 rounded-lg bg-white/10" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-300/90">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Floating Coming Soon pill */}
        <div className="pointer-events-none fixed bottom-6 right-6 z-40">
          <div className="pointer-events-auto animate-[floaty_3s_ease-in-out_infinite] rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 shadow-lg backdrop-blur">
            📱 Call from your SIM — <span className="font-semibold">coming soon</span>
          </div>
        </div>

        <style>{`
@keyframes floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        `}</style>

        {/* Footer */}
        <footer className="mt-20 border-t border-white/10 pt-8 text-sm text-slate-400 text-center">
          © {new Date().getFullYear()} MedVoice. All rights reserved.
        </footer>
      </div>
    </main>
  );
}

