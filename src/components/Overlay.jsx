import { useEffect } from "react";
import FocusSimulator from "./FocusSimulator.jsx";
import RedFlags from "./RedFlags.jsx";

const TABS = [
  { id: "optics", label: "Focus & glasses" },
  { id: "flags", label: "Red flags" },
];

export default function Overlay({ tab, onTab, onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-full w-full max-w-[1120px] flex-col overflow-hidden rounded-lg border border-line bg-ground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center gap-1 border-b border-line bg-surface px-3 py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              aria-pressed={tab === t.id}
              className={`rounded px-3 py-[6px] text-[0.84rem] transition-colors ${
                tab === t.id ? "bg-surface2 font-medium text-ink" : "text-ink2 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto rounded px-3 py-[6px] font-mono text-[0.8rem] text-ink3 hover:text-ink"
          >
            Esc ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {tab === "optics" ? (
            <>
              <p className="mb-4 max-w-[72ch] text-[0.88rem] leading-relaxed text-ink2">
                Short-sightedness is a mismatch, not a weakness: a globe that grew slightly too
                long for its own optics. Change the length by a millimetre and the prescription
                changes by about 2.5 dioptres. Everything below is computed from a reduced-eye
                optical model, so the prescription it prints is the one this eye would be given.
              </p>
              <FocusSimulator />
            </>
          ) : (
            <RedFlags />
          )}
        </div>
      </div>
    </div>
  );
}
