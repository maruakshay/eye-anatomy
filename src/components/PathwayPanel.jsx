import VisualField from "./VisualField.jsx";
import { LESIONS } from "../three/pathway.js";

export default function PathwayPanel({ structure, lesion, onLesion }) {
  const l = lesion ? LESIONS.find((x) => x.id === lesion) : null;

  if (l) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="px-5 pt-5 pb-4">
          <p className="label-cap text-fundus">Lesion · {l.localises}</p>
          <h2 className="mt-1 text-[1.4rem] leading-tight">{l.label}</h2>
          <p className="mt-1 font-mono text-[0.72rem] text-ink3">{l.site}</p>
          <p className="mt-3 text-[0.86rem] leading-relaxed text-ink2">
            <span className="label-cap text-ink3">Typical cause · </span>
            {l.cause}
          </p>
        </div>

        <div className="border-t border-line px-5 pt-4 pb-4">
          <p className="label-cap mb-3 text-ink3">Resulting visual field</p>
          <VisualField field={l.field} />
        </div>

        <div className="border-t border-line px-5 pt-4 pb-6">
          <p className="label-cap mb-2 text-ink3">How to read it</p>
          <p className="text-[0.87rem] leading-relaxed">{l.reading}</p>
        </div>

        <div className="mt-auto border-t border-line px-5 py-4">
          <p className="label-cap mb-2 text-ink3">Walk up the pathway</p>
          <div className="flex flex-wrap gap-[5px]">
            {LESIONS.map((x) => (
              <button
                key={x.id}
                onClick={() => onLesion(x.id)}
                aria-pressed={x.id === l.id}
                className={`rounded-full border px-[9px] py-[3px] text-[0.72rem] transition-colors ${
                  x.id === l.id
                    ? "border-fundus bg-fundus text-on-accent"
                    : "border-line bg-surface2 text-ink2 hover:border-ink3 hover:text-ink"
                }`}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (structure) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="px-5 pt-5 pb-4">
          <p className="label-cap text-fundus">Visual pathway</p>
          <h2 className="mt-1 text-[1.4rem] leading-tight">{structure.name}</h2>
          <p className="mt-3 text-[0.9rem] leading-relaxed text-ink2">{structure.blurb}</p>
          <dl className="mt-4">
            {structure.specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-t border-linesoft py-[6px] text-[0.81rem]">
                <dt className="text-ink3">{k}</dt>
                <dd className="num m-0 text-right font-mono text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-auto border-t border-line px-5 py-4">
          <p className="label-cap mb-2 text-ink3">Or place a lesion</p>
          <div className="flex flex-wrap gap-[5px]">
            {LESIONS.map((x) => (
              <button
                key={x.id}
                onClick={() => onLesion(x.id)}
                className="rounded-full border border-line bg-surface2 px-[9px] py-[3px] text-[0.72rem] text-ink2 transition-colors hover:border-ink3 hover:text-ink"
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-5 py-6">
      <p className="label-cap text-ink3">How the eye actually sees</p>
      <p className="text-[0.92rem] leading-relaxed">
        Each eye splits its image down the middle before sending it on. Light from the left half of
        the world lands on the same side of <em>both</em> retinas, and at the chiasm those two
        bundles merge into one tract.
      </p>
      <p className="text-[0.88rem] leading-relaxed text-ink2">
        So behind the chiasm, the brain no longer handles eyes — it handles halves of the world.
        That single fact is the whole basis of localising a lesion from a visual field:
      </p>
      <ul className="m-0 grid list-none gap-2 p-0 text-[0.86rem] leading-relaxed">
        {[
          ["One eye only", "in front of the chiasm", "border-cobalt"],
          ["Both outer halves", "at the chiasm", "border-amber"],
          ["Same half in both eyes", "behind the chiasm", "border-fundus"],
        ].map(([a, b, tone]) => (
          <li key={a} className={`border-l-2 pl-3 ${tone}`}>
            <b className="font-semibold">{a}</b>
            <span className="text-ink2"> → {b}</span>
          </li>
        ))}
      </ul>
      <p className="text-[0.86rem] leading-relaxed text-ink2">
        Click a red marker on the pathway — or pick a site below — to see the field defect it
        produces, and why.
      </p>
      <div className="flex flex-wrap gap-[5px]">
        {LESIONS.map((x) => (
          <button
            key={x.id}
            onClick={() => onLesion(x.id)}
            className="rounded-full border border-line bg-surface2 px-[9px] py-[3px] text-[0.72rem] text-ink2 transition-colors hover:border-ink3 hover:text-ink"
          >
            {x.label}
          </button>
        ))}
      </div>
    </div>
  );
}
