import { useEffect, useState } from "react";
import { URGENCY } from "../data/conditions.js";
import { CONDITIONS_BY_STRUCTURE } from "../data/structureMap.js";
import { SYSTEMS } from "../three/eyeModel.js";

/* Structures with no diseases of their own borrow the group's list. */
const ALIAS = {
  superiorRectus: "muscles",
  inferiorRectus: "muscles",
  medialRectus: "muscles",
  lateralRectus: "muscles",
  superiorOblique: "muscles",
  inferiorOblique: "muscles",
  upperLid: "lids",
  lowerLid: "lids",
};

const TONE = {
  emergency: "bg-fundus",
  urgent: "bg-amber",
  manage: "bg-cobalt",
  routine: "bg-fluor",
};

function Condition({ c, open, onToggle }) {
  return (
    <li className="border-b border-linesoft last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-[9px] py-[9px] text-left"
      >
        <span className={`mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full ${TONE[c.urgency]}`} />
        <span className="min-w-0 flex-1">
          <span className={`block text-[0.87rem] leading-snug ${open ? "font-medium text-ink" : "text-ink"}`}>
            {c.name}
          </span>
          <span className="label-cap text-ink3">{URGENCY[c.urgency].label}</span>
        </span>
        <span className="mt-1 shrink-0 font-mono text-[0.8rem] text-ink3">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="grid gap-[10px] pb-4 pl-4">
          <p className="text-[0.85rem] leading-relaxed text-ink2">{c.sum}</p>
          {[
            ["Symptoms", c.sym],
            ["Risk factors", c.risk],
            ["Treatment", c.mgmt],
          ].map(([t, body]) => (
            <p key={t} className="text-[0.82rem] leading-relaxed">
              <span className="label-cap text-ink3">{t} · </span>
              <span className="text-ink2">{body}</span>
            </p>
          ))}
          <p className="border-l-2 border-fluor pl-[10px] text-[0.82rem] leading-relaxed">
            <span className="label-cap text-fluor">Prevention · </span>
            <span className="text-ink">{c.prev}</span>
          </p>
          <details>
            <summary className="label-cap cursor-pointer text-cobalt hover:underline">
              Clinical detail
            </summary>
            <p className="mt-2 border-l-2 border-line pl-[10px] text-[0.8rem] leading-relaxed text-ink2">
              {c.deep}
            </p>
          </details>
        </div>
      )}
    </li>
  );
}

export default function DetailPanel({ structure, openCondition, onOpenCondition }) {
  const [open, setOpen] = useState(null);

  useEffect(() => setOpen(openCondition ?? null), [structure?.id, openCondition]);

  if (!structure) {
    return (
      <div className="flex h-full flex-col justify-center gap-3 px-6 text-[0.88rem] leading-relaxed text-ink2">
        <p className="label-cap text-ink3">Nothing selected</p>
        <p>
          Click any part of the eye, or pick from the list. Drag to orbit, scroll to zoom.
        </p>
        <p className="text-ink3">
          Take it apart with the slider below, or cut it in half to see inside. Clicking the same
          spot twice steps through whatever lies behind it.
        </p>
      </div>
    );
  }

  const listId = ALIAS[structure.id] ?? structure.id;
  const conditions = CONDITIONS_BY_STRUCTURE[listId] ?? [];
  const system = SYSTEMS.find((s) => s.id === structure.system);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-5 pt-5 pb-4">
        <p className="label-cap text-fundus">{system?.name ?? "Across the whole eye"}</p>
        <h2 className="mt-1 text-[1.5rem] leading-tight">{structure.name}</h2>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-ink2">{structure.blurb}</p>
        {structure.exaggerated && (
          <p className="mt-2 font-mono text-[0.68rem] text-ink3">{structure.exaggerated}</p>
        )}

        <dl className="mt-4">
          {structure.specs.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-t border-linesoft py-[6px] text-[0.81rem]">
              <dt className="text-ink3">{k}</dt>
              <dd className="num m-0 text-right font-mono text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {conditions.length > 0 && (
        <div className="border-t border-line px-5 pt-4 pb-6">
          <div className="mb-1 flex items-baseline justify-between">
            <p className="label-cap text-ink3">What goes wrong here</p>
            <span className="num font-mono text-[0.7rem] text-ink3">{conditions.length}</span>
          </div>
          <ul className="m-0 list-none p-0">
            {conditions.map((c) => (
              <Condition
                key={c.name}
                c={c}
                open={open === c.name}
                onToggle={() => {
                  const next = open === c.name ? null : c.name;
                  setOpen(next);
                  onOpenCondition?.(next);
                }}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
