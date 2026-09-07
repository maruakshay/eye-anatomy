import { LESIONS } from "../three/pathway.js";

export default function PathwayRail({ parts, selectedId, lesionId, onSelect, onLesion }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <section className="border-b border-linesoft">
        <p className="label-cap px-4 pt-3 pb-1 text-ink2">Along the pathway</p>
        <ul className="m-0 list-none pb-2 pl-4">
          {parts.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onSelect(p.id)}
                className={`block w-full py-[3px] pr-3 text-left text-[0.82rem] transition-colors ${
                  selectedId === p.id && !lesionId
                    ? "font-medium text-fundus"
                    : "text-ink2 hover:text-ink"
                }`}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="label-cap px-4 pt-3 pb-1 text-ink2">Lesion sites</p>
        <p className="px-4 pb-2 text-[0.72rem] leading-snug text-ink3">
          Front to back. Each produces a different, diagnostic pattern.
        </p>
        <ol className="m-0 list-none pb-3 pl-4">
          {LESIONS.map((l, i) => (
            <li key={l.id}>
              <button
                onClick={() => onLesion(l.id)}
                className={`flex w-full items-baseline gap-2 py-[4px] pr-3 text-left text-[0.82rem] transition-colors ${
                  lesionId === l.id ? "font-medium text-fundus" : "text-ink2 hover:text-ink"
                }`}
              >
                <span className="num shrink-0 font-mono text-[0.62rem] text-ink3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="truncate">{l.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
