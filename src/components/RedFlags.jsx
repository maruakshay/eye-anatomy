import { RED_FLAGS } from "../data/prevention.js";

export default function RedFlags() {
  return (
    <div className="overflow-hidden rounded-md border border-fundus bg-surface">
      <div className="border-b border-fundus bg-fundus-wash px-5 py-4">
        <p className="font-display text-[1.2rem] font-semibold text-fundus">
          Any of these means today, not next week
        </p>
        <p className="mt-1 max-w-[70ch] text-[0.87rem] leading-relaxed text-ink2">
          Retina infarcts in about ninety minutes. A detached macula does not fully recover. Giant
          cell arteritis takes the second eye within days. In each case the treatment exists and the
          only variable is how fast it starts.
        </p>
      </div>
      <ul className="m-0 list-none p-0">
        {RED_FLAGS.map((f) => (
          <li
            key={f.sign}
            className="grid gap-x-6 gap-y-1 border-b border-linesoft px-5 py-[13px] last:border-b-0 sm:grid-cols-[1fr_270px]"
          >
            <span className="text-[0.9rem] font-medium">{f.sign}</span>
            <span className="text-[0.845rem] leading-relaxed text-ink2">{f.why}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
