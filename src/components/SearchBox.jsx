import { useMemo, useRef, useState } from "react";
import { CONDITIONS, URGENCY } from "../data/conditions.js";
import { structureFor } from "../data/structureMap.js";

export default function SearchBox({ structures, onPick }) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef(null);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    const parts = structures
      .filter((s) => s.name.toLowerCase().includes(needle))
      .slice(0, 5)
      .map((s) => ({ kind: "part", id: s.id, label: s.name, sub: "structure" }));
    const conds = CONDITIONS.filter((c) =>
      `${c.name} ${c.sym} ${c.sum}`.toLowerCase().includes(needle),
    )
      .slice(0, 9)
      .map((c) => ({
        kind: "condition",
        id: structureFor(c),
        label: c.name,
        sub: URGENCY[c.urgency].label,
        condition: c.name,
        urgency: c.urgency,
      }));
    return [...parts, ...conds];
  }, [q, structures]);

  const pick = (r) => {
    onPick(r.id, r.condition);
    setQ("");
    setFocused(false);
  };

  return (
    <div className="relative w-full max-w-[300px]">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => {
          clearTimeout(blurTimer.current);
          setFocused(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setFocused(false), 120);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) pick(results[0]);
          if (e.key === "Escape") setQ("");
        }}
        placeholder="Search parts, symptoms, diseases…"
        aria-label="Search structures and conditions"
        className="w-full rounded border border-line bg-surface px-3 py-[6px] text-[0.83rem] text-ink placeholder:text-ink3"
      />

      {focused && results.length > 0 && (
        <ul className="absolute top-[calc(100%+4px)] right-0 left-0 z-50 m-0 max-h-[62vh] list-none overflow-y-auto rounded border border-line bg-surface p-0 shadow-xl">
          {results.map((r) => (
            <li key={`${r.kind}-${r.label}`}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(r)}
                className="flex w-full items-baseline gap-2 border-b border-linesoft px-3 py-2 text-left last:border-b-0 hover:bg-surface2"
              >
                <span className="min-w-0 flex-1 truncate text-[0.83rem] text-ink">{r.label}</span>
                <span
                  className={`label-cap shrink-0 ${
                    r.urgency === "emergency" ? "text-fundus" : "text-ink3"
                  }`}
                >
                  {r.sub}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
