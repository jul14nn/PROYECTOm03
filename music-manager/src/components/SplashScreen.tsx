"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const SESSION_KEY = "mm-splash-shown";
const HOLD_MS = 1200;
const FADE_MS = 500;

export default function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);

  useLayoutEffect(() => {
    // Lectura puntual de una API del navegador (sessionStorage) para decidir,
    // antes del primer pintado, si esta pestaña ya vio la splash.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sessionStorage.getItem(SESSION_KEY)) setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    const fadeTimer = setTimeout(() => setFading(true), HOLD_MS);
    const removeTimer = setTimeout(() => setMounted(false), HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      className="stage-bg fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity ease-out"
      style={{
        opacity: fading ? 0 : 1,
        transitionDuration: `${FADE_MS}ms`,
      }}
      aria-hidden="true"
    >
      <div
        className="splash-anim poster text-[5.5rem] sm:text-[7.5rem] leading-none text-white"
        style={{
          textShadow:
            "0 0 60px color-mix(in srgb, var(--accent-magenta) 70%, transparent), 0 0 120px color-mix(in srgb, var(--accent-violet) 50%, transparent)",
          animationDelay: "0ms",
        }}
      >
        KR
      </div>
      <div
        className="splash-anim mt-3 text-[0.7rem] tracking-[0.4em] uppercase text-white/50"
        style={{ animationDelay: "150ms" }}
      >
        Music Manager
      </div>

      <style>{`
        .splash-anim {
          animation: splash-in 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes splash-in {
          from { opacity: 0; transform: translateY(14px) scale(0.96); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .splash-anim { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
