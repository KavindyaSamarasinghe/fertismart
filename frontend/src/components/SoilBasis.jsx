import React from "react";

const fmt = (v) => Number(v ?? 1).toString();

export default function SoilBasis({ rec, className = "" }) {
  if (!rec) return null;

  const applied = Boolean(rec.soilAdjustmentApplied);
  const m = rec.soilMultipliers || { n: 1, p: 1, k: 1 };

  // Only list nutrients that were actually changed
  const changed = ["n", "p", "k"]
    .filter((k) => Number(m[k]) !== 1)
    .map((k) => `${k.toUpperCase()} ×${fmt(m[k])}`);

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-xs leading-5 ${
        applied
          ? "border-[#C9DCCF] bg-[#F2F8F2] text-[#315E45]"
          : "border-slate-200 bg-slate-50 text-slate-500"
      } ${className}`}
    >
      <p className="font-semibold">
        Soil basis: {applied ? rec.soilType : rec.soilType || "Not recorded"}
      </p>
      {applied ? (
        <>
          <p className="mt-0.5">
            {changed.length > 0 ? `Requirement adjusted: ${changed.join(", ")}.` : "No nutrient change for this soil."}
            {rec.soilNote ? ` ${rec.soilNote}.` : ""}
          </p>
          <p className="mt-0.5 text-[11px] opacity-80">
            Indicative soil factors, subject to Agricultural Officer review.
          </p>
        </>
      ) : (
        <p className="mt-0.5">No soil-specific adjustment applied (soil type not in the reference table).</p>
      )}
    </div>
  );
}