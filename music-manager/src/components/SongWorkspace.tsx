"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import type { NextStep } from "@/lib/nextStep";

export type SongTab = {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
};

export default function SongWorkspace({
  tabs,
  nextStep,
  initialTab,
}: {
  tabs: SongTab[];
  nextStep: NextStep;
  // Los enlaces de fuera (Agenda, Royalties, Distribución) piden pestaña con
  // ?tab=; el servidor la valida y la pasa aquí ya resuelta.
  initialTab?: string;
}) {
  const [active, setActive] = useState(initialTab ?? nextStep.tabId);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setActive(nextStep.tabId)}
        className="w-full text-left rounded-xl p-4 flex items-start gap-3 transition-transform hover:scale-[1.005]"
        style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--accent-violet) 20%, #141416), color-mix(in srgb, var(--accent-magenta) 16%, #141416))",
          border: "1px solid color-mix(in srgb, var(--accent-magenta) 30%, transparent)",
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[0.65rem] uppercase tracking-wider text-[var(--accent-soft)] font-semibold mb-1">
            Tu próximo paso
          </div>
          <div className="font-semibold">{nextStep.label}</div>
          <div className="text-sm text-neutral-400 mt-0.5">{nextStep.detail}</div>
        </div>
        <ArrowRight size={18} className="text-[var(--accent-soft)] shrink-0 mt-1" />
      </button>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={clsx(
              "shrink-0 flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              active === t.id ? "text-white" : "bg-white/[0.04] text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.075] border border-white/[0.07]"
            )}
            style={
              active === t.id
                ? {
                    background:
                      "linear-gradient(135deg, var(--accent-violet), var(--accent-magenta))",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.28), 0 4px 14px -6px color-mix(in srgb, var(--accent-magenta) 80%, transparent)",
                  }
                : undefined
            }
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tabs.map((t) => (
        <div key={t.id} className={t.id === active ? "space-y-8" : "hidden"}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
