import { SYSTEMS } from "../three/eyeModel.js";
import { CONDITIONS_BY_STRUCTURE } from "../data/structureMap.js";

export default function StructureRail({
  structures,
  virtual,
  visibleSystems,
  onToggleSystem,
  selectedId,
  onSelect,
}) {
  const groups = [
    ...SYSTEMS.map((sys) => ({
      ...sys,
      items: structures.filter((s) => s.system === sys.id),
      toggleable: true,
    })),
    { id: "whole", name: "Across the whole eye", note: "No single part", items: virtual },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {groups.map((g) => {
        const on = !g.toggleable || visibleSystems.has(g.id);
        return (
          <section key={g.id} className="border-b border-linesoft last:border-b-0">
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
              {g.toggleable ? (
                <button
                  onClick={() => onToggleSystem(g.id)}
                  aria-pressed={on}
                  title={on ? "Hide this system" : "Show this system"}
                  className={`flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
                    on ? "border-fundus bg-fundus" : "border-ink3 bg-transparent"
                  }`}
                >
                  {on && (
                    <svg viewBox="0 0 10 10" className="h-[9px] w-[9px]">
                      <path d="M1.5 5.2 L4 7.6 L8.6 2.4" fill="none" stroke="var(--color-on-accent)" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              ) : (
                <span className="h-[13px] w-[13px] shrink-0" />
              )}
              <span className={`label-cap ${on ? "text-ink2" : "text-ink3"}`}>{g.name}</span>
              <span className="num ml-auto font-mono text-[0.62rem] text-ink3">{g.items.length}</span>
            </div>

            <ul className="m-0 list-none pb-2 pl-[34px]">
              {g.items.map((s) => {
                const count = CONDITIONS_BY_STRUCTURE[s.id]?.length ?? 0;
                const sel = selectedId === s.id;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => onSelect(s.id)}
                      className={`flex w-full items-baseline gap-2 py-[3px] pr-3 text-left text-[0.82rem] transition-colors ${
                        sel ? "font-medium text-fundus" : on ? "text-ink2 hover:text-ink" : "text-ink3"
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {count > 0 && (
                        <span className="num ml-auto shrink-0 font-mono text-[0.62rem] text-ink3">
                          {count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
