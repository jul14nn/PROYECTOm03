"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Shuffle } from "lucide-react";
import { TIPS } from "@/lib/tips";

const QUEUE_KEY = "mm-tip-queue";
const LAST_KEY = "mm-tip-last";

function shuffled(n: number) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function nextTipIndex(): number {
  let queue: number[] = [];
  try {
    queue = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    queue = [];
  }

  if (!Array.isArray(queue) || queue.length === 0) {
    const last = Number(localStorage.getItem(LAST_KEY));
    queue = shuffled(TIPS.length);
    // Evita que el primero de la nueva ronda repita el último consejo visto.
    if (queue[0] === last && queue.length > 1) {
      [queue[0], queue[1]] = [queue[1], queue[0]];
    }
  }

  const [next, ...rest] = queue;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(rest));
  localStorage.setItem(LAST_KEY, String(next));
  return next;
}

export default function TipOfTheDay() {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    // Lectura puntual de localStorage (API de navegador) para elegir el
    // primer consejo sin repetir el último visto en esta misma pestaña.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(nextTipIndex());
  }, []);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Lightbulb size={18} className="text-amber-300" />
          Consejo del día
        </h2>
        <button
          type="button"
          onClick={() => setIndex(nextTipIndex())}
          className="text-neutral-500 hover:text-neutral-200 transition-colors"
          aria-label="Otro consejo"
          title="Otro consejo"
        >
          <Shuffle size={15} />
        </button>
      </div>
      <p className="text-sm text-neutral-300 leading-relaxed min-h-[2.5rem]">
        {index === null ? " " : TIPS[index]}
      </p>
    </div>
  );
}
