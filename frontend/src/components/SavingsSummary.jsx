import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  CartesianGrid,
} from "recharts";
import apiClient from "../api/axiosClient.js";

const formatLKR = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const CROP_COLORS = ["#1C3D20", "#2F7D4F", "#5BA876", "#8FC9A0", "#B7DFC0", "#DDEFE1"];

// Maha = Oct–Mar, Yala = Apr–Sep (approximate; adjust if your project defines them differently)
function getCurrentSeason(now = new Date()) {
  const m = now.getMonth();
  const y = now.getFullYear();
  if (m >= 9) {
    return { label: `Maha ${y}/${String(y + 1).slice(2)}`, start: new Date(y, 9, 1), end: new Date(y + 1, 3, 1) };
  }
  if (m <= 2) {
    return { label: `Maha ${y - 1}/${String(y).slice(2)}`, start: new Date(y - 1, 9, 1), end: new Date(y, 3, 1) };
  }
  return { label: `Yala ${y}`, start: new Date(y, 3, 1), end: new Date(y, 9, 1) };
}

export default function SavingsSummary() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scope, setScope] = useState("season"); // "season" | "all"

  const season = useMemo(() => getCurrentSeason(), []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await apiClient.get("/recommendations/mine");
        if (active) setRecs(data.recommendations || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Unable to load your savings.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const inScope = recs.filter((r) => {
      if (scope === "all") return true;
      const d = new Date(r.createdAt);
      return d >= season.start && d < season.end;
    });

    const hasSavings = (r) => typeof r.savingsLKR === "number" && typeof r.baselineCostLKR === "number";

    const approved = inScope.filter((r) => r.status === "approved" && hasSavings(r));
    const pending = inScope.filter((r) => r.status === "pending_review" && hasSavings(r));

    const totalSaved = approved.reduce((s, r) => s + r.savingsLKR, 0);
    const totalBaseline = approved.reduce((s, r) => s + r.baselineCostLKR, 0);
    const totalOptimized = approved.reduce((s, r) => s + (r.totalCostLKR || 0), 0);
    const avgPercent = totalBaseline > 0 ? (totalSaved / totalBaseline) * 100 : 0;
    const pendingSavings = pending.reduce((s, r) => s + r.savingsLKR, 0);

    const byCropMap = {};
    approved.forEach((r) => {
      const name = r.crop?.name || "Unknown crop";
      byCropMap[name] = (byCropMap[name] || 0) + r.savingsLKR;
    });
    const byCrop = Object.entries(byCropMap)
      .map(([name, saved]) => ({ name, saved: Math.round(saved) }))
      .sort((a, b) => b.saved - a.saved);

    return {
      approvedCount: approved.length,
      pendingCount: pending.length,
      totalSaved,
      totalBaseline,
      totalOptimized,
      avgPercent,
      pendingSavings,
      byCrop,
    };
  }, [recs, scope, season]);

  const scopeLabel = scope === "season" ? `this season (${season.label})` : "across all time";

  const comparisonData = [
    { name: "Conventional", cost: Math.round(stats.totalBaseline), fill: "#94A3B8" },
    { name: "LP-Optimized", cost: Math.round(stats.totalOptimized), fill: "#145C3B" },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header + toggle */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <h2 className="text-lg font-semibold text-[#1C2D35]">Your fertilizer savings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Compared with a conventional flat-rate compound fertilizer plan.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {[
            ["season", season.label],
            ["all", "All time"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setScope(key)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                scope === key ? "bg-white text-[#145C3B] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {loading && <div className="h-28 animate-pulse rounded-xl bg-slate-50" />}

        {!loading && error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && stats.approvedCount === 0 && (
          <div className="rounded-xl border border-dashed border-[#C9DCCF] bg-[#F7FAF7] px-6 py-8 text-center">
            <p className="font-semibold text-[#1C2D35]">No approved recommendations yet {scopeLabel}.</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Savings are counted once an Agricultural Officer approves a recommendation.
              {stats.pendingCount > 0 &&
                ` You have ${stats.pendingCount} plan${stats.pendingCount === 1 ? "" : "s"} awaiting review, worth up to ${formatLKR(stats.pendingSavings)}.`}
            </p>
          </div>
        )}

        {!loading && !error && stats.approvedCount > 0 && (
          <div className="space-y-6">
            {/* Headline */}
            <div className="rounded-xl bg-gradient-to-r from-[#E8F5EB] to-[#F5FAF5] p-5">
              <p className="text-sm text-slate-600">
                You've saved{" "}
                <span className="text-2xl font-bold text-[#145C3B]">{formatLKR(stats.totalSaved)}</span>{" "}
                across{" "}
                <span className="font-semibold text-slate-800">
                  {stats.approvedCount} approved recommendation{stats.approvedCount === 1 ? "" : "s"}
                </span>{" "}
                {scopeLabel}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-emerald-700">
                  Average saving {stats.avgPercent.toFixed(1)}%
                </span>
                {stats.pendingCount > 0 && (
                  <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-amber-700">
                    +{formatLKR(stats.pendingSavings)} potential in {stats.pendingCount} pending review
                  </span>
                )}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total cost comparison
                </p>
                <div className="mt-2 h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} layout="vertical" margin={{ top: 4, right: 90, left: 4, bottom: 4 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 11, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v) => formatLKR(v)}
                        contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E2E8F0" }}
                      />
                      <Bar dataKey="cost" radius={[0, 6, 6, 0]} barSize={24}>
                        {comparisonData.map((e, i) => (
                          <Cell key={i} fill={e.fill} />
                        ))}
                        <LabelList
                          dataKey="cost"
                          position="right"
                          formatter={(v) => formatLKR(v)}
                          style={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Savings by crop (Rs.)</p>
                <div className="mt-2 h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.byCrop} margin={{ top: 4, right: 8, left: -12, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v) => formatLKR(v)}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="saved" radius={[6, 6, 0, 0]}>
                        {stats.byCrop.map((_, i) => (
                          <Cell key={i} fill={CROP_COLORS[i % CROP_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-400">
              Savings are estimates based on market prices in the FertiSmart catalogue and a typical flat-rate
              compound application. Actual savings depend on the prices you pay.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}