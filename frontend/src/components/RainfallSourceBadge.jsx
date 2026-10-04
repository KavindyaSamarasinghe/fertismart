import React from "react";

const STYLES = {
  live: "border-emerald-200 bg-emerald-50 text-emerald-700",
  manual: "border-sky-200 bg-sky-50 text-sky-700",
  fallback: "border-amber-300 bg-amber-50 text-amber-800",
};

const LABELS = {
  live: "Live data",
  manual: "Manual value",
  fallback: "Default value used",
};

export default function RainfallSourceBadge({ source, mm, showWarning = true }) {
  if (!source) return null; // older recommendations have no source recorded

  return (
    <div>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${STYLES[source]}`}
      >
        {source === "fallback" && <span aria-hidden="true">⚠</span>}
        {typeof mm === "number" && `${mm} mm · `}
        {LABELS[source]}
      </span>

      {source === "fallback" && showWarning && (
        <p className="mt-2 text-xs leading-5 text-amber-800">
          Live rainfall data was unavailable, so a default of {mm} mm was assumed.
          Treat the nitrogen adjustment as approximate.
        </p>
      )}
    </div>
  );
}
