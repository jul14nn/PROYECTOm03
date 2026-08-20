"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import clsx from "clsx";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseISO(value: string | undefined | null) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}

export default function DatePicker({
  name,
  defaultValue,
  placeholder = "Sin fecha",
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  const initial = parseISO(defaultValue);
  const today = new Date();

  const [value, setValue] = useState<{ y: number; m: number; d: number } | null>(initial);
  const [viewY, setViewY] = useState(initial?.y ?? today.getFullYear());
  const [viewM, setViewM] = useState(initial?.m ?? today.getMonth());
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const firstOfMonth = new Date(viewY, viewM, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // lunes=0
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewY, viewM, 0).getDate();

  const cells: { y: number; m: number; d: number; outside: boolean }[] = [];
  for (let i = 0; i < startOffset; i++) {
    const d = daysInPrevMonth - startOffset + i + 1;
    const m = viewM === 0 ? 11 : viewM - 1;
    const y = viewM === 0 ? viewY - 1 : viewY;
    cells.push({ y, m, d, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ y: viewY, m: viewM, d, outside: false });
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1];
    const nextDate = new Date(last.y, last.m, last.d + 1);
    cells.push({ y: nextDate.getFullYear(), m: nextDate.getMonth(), d: nextDate.getDate(), outside: true });
    if (cells.length >= 42) break;
  }

  const years = Array.from({ length: 9 }, (_, i) => today.getFullYear() - 1 + i);

  const label = value
    ? `${value.d} de ${MONTHS[value.m].toLowerCase()} de ${value.y}`
    : placeholder;

  return (
    <div className="relative" ref={rootRef}>
      <input type="hidden" name={name} value={value ? toISO(value.y, value.m, value.d) : ""} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input flex items-center justify-between gap-2 text-left"
      >
        <span className={value ? "" : "text-neutral-500"}>{label}</span>
        <Calendar size={15} className="text-neutral-500 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-72 rounded-xl border border-neutral-800 bg-neutral-950 p-3 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                if (viewM === 0) { setViewM(11); setViewY((y) => y - 1); } else setViewM((m) => m - 1);
              }}
              className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">{MONTHS[viewM]}</span>
              <select
                value={viewY}
                onChange={(e) => setViewY(Number(e.target.value))}
                className="bg-transparent text-sm font-medium border border-neutral-800 rounded-md px-1.5 py-0.5"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-neutral-900">
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                if (viewM === 11) { setViewM(0); setViewY((y) => y + 1); } else setViewM((m) => m + 1);
              }}
              className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[0.65rem] text-neutral-600 py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((c, i) => {
              const isSelected = value && value.y === c.y && value.m === c.m && value.d === c.d;
              const isToday =
                c.y === today.getFullYear() && c.m === today.getMonth() && c.d === today.getDate();
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setValue({ y: c.y, m: c.m, d: c.d });
                    setViewY(c.y);
                    setViewM(c.m);
                    setOpen(false);
                  }}
                  className={clsx(
                    "h-8 rounded-md text-xs transition-colors",
                    c.outside ? "text-neutral-700" : "text-neutral-200",
                    isSelected
                      ? "text-white"
                      : isToday
                        ? "ring-1 ring-inset ring-fuchsia-500/50 hover:bg-neutral-900"
                        : "hover:bg-neutral-900"
                  )}
                  style={
                    isSelected
                      ? { background: "linear-gradient(135deg, var(--accent-violet), var(--accent-magenta))" }
                      : undefined
                  }
                >
                  {c.d}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => {
                setValue(null);
                setOpen(false);
              }}
              className="mt-2 w-full text-center text-xs text-neutral-500 hover:text-neutral-300 py-1"
            >
              Quitar fecha
            </button>
          )}
        </div>
      )}
    </div>
  );
}
