'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function CallModal({ open, onHangUp }: { open: boolean; onHangUp: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-white/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-100">MedVoice — Call</h2>
          <span className="text-xs text-cyan-300">Connected</span>
        </div>
        {/* Waves */}
        <div className="relative m-6 grid h-36 w-auto place-items-center overflow-hidden rounded-xl bg-white/5">
          <div className="flex h-20 items-end gap-1">
            {Array.from({ length: 32 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'inline-block w-1 origin-bottom rounded-sm bg-cyan-300/80',
                  'animate-[wave_1.2s_ease-in-out_infinite]'
                )}
                style={{ animationDelay: `${(i % 10) * 0.06}s`, height: `${8 + ((i * 7) % 48)}px` }}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 bg-white/5 px-6 py-4">
          <button
            onClick={onHangUp}
            className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-600/40"
          >
            Hang Up
          </button>
        </div>
      </div>

      <style>{`
@keyframes wave { 0%,100%{ transform: scaleY(0.4)} 50%{ transform: scaleY(1)} }
      `}</style>
    </div>
  );
}


