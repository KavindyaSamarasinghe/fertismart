import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import apiClient from "../../api/axiosClient.js";
import { useToast, errorMessage } from "../../context/ToastContext.jsx";
import RainfallSourceBadge from "../../components/RainfallSourceBadge.jsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-LK", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date unavailable";

const getRainfallStyle = (rainfall) => {
  const value = String(rainfall || "").toLowerCase();

  if (value.includes("high")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (value.includes("low")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-emerald-50 text-emerald-700 border-emerald-200";
};

function SummaryCard({ label, value, description, icon, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          <span className="text-xl" aria-hidden="true">
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}

// Compact cost-comparison bar chart: LP-optimized mix vs conventional
// flat-rate compound baseline, for a single recommendation.
function SavingsChart({ optimizedCost, baselineCost }) {
  if (typeof baselineCost !== "number" || baselineCost <= 0) return null;

  const data = [
    { name: "Conventional (flat-rate compound)", cost: Math.round(baselineCost), fill: "#94A3B8" },
    { name: "LP-Optimized (this recommendation)", cost: Math.round(optimizedCost), fill: "#14532D" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Cost comparison
      </p>
      <div className="mt-2 h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 11, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E2E8F0" }}
            />
            <Bar dataKey="cost" radius={[0, 6, 6, 0]} barSize={22}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="cost"
                position="right"
                formatter={(v) => formatCurrency(v)}
                style={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function OfficerDashboard() {
  const toast = useToast();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notes, setNotes] = useState({});
  const [reviewing, setReviewing] = useState({});

  const load = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await apiClient.get("/recommendations/pending");
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
          "Unable to load pending recommendations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReview = async (id, decision) => {
    if (decision === "rejected" && !(notes[id] || "").trim()) {
      toast.error("Please add review notes explaining why you are rejecting this recommendation.");
      return;
    }
    setReviewing((prev) => ({ ...prev, [id]: true }));

    try {
      await apiClient.patch(`/recommendations/${id}/review`, {
        decision,
        reviewNotes: notes[id] || "",
      });

      setRecommendations((prev) => prev.filter((rec) => rec._id !== id));

      setNotes((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      toast.success(
        decision === "approved"
          ? "Recommendation approved successfully."
          : "Recommendation rejected successfully."
      );
    } catch (err) {
      toast.error(
        errorMessage(err, "Unable to submit your review. Please try again.")
      );
    } finally {
      setReviewing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const totalEstimatedCost = recommendations.reduce(
    (total, rec) => total + Number(rec.totalCostLKR || 0),
    0
  );

  const uniqueFarmers = new Set(
    recommendations.map((rec) => rec.farmer?._id).filter(Boolean)
  ).size;

  const uniqueFarms = new Set(
    recommendations.map((rec) => rec.farm?._id).filter(Boolean)
  ).size;

  return (
    <DashboardLayout
      title="Pending Reviews"
      subtitle="Review fertilizer recommendations and help farmers make informed, data-driven decisions."
    >
      <div className="space-y-7">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm font-medium text-emerald-800">
                Agricultural Officer Portal
              </p>
            </div>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Recommendation Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Check fertilizer requirements, review costs, and submit your
              decision.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <span aria-hidden="true">↻</span>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Pending reviews"
            value={recommendations.length}
            description="Awaiting your decision"
            icon="📋"
            accent="bg-amber-50"
          />

          <SummaryCard
            label="Estimated fertilizer cost"
            value={formatCurrency(totalEstimatedCost)}
            description="Combined cost of pending requests"
            icon="₨"
            accent="bg-emerald-50 text-emerald-800"
          />

          <SummaryCard
            label="Farmers awaiting review"
            value={uniqueFarmers}
            description="Unique farmers in this queue"
            icon="👨‍🌾"
            accent="bg-blue-50"
          />

          <SummaryCard
            label="Farms in review queue"
            value={uniqueFarms}
            description="Unique farms with pending requests"
            icon="🌱"
            accent="bg-lime-50"
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
            <p className="mt-4 text-sm font-medium text-slate-700">
              Loading recommendations...
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Retrieving pending requests for review.
            </p>
          </div>
        )}

        {/* Loading error */}
        {!loading && loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-800">
              Unable to load recommendations
            </p>
            <p className="mt-1 text-sm text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !loadError && recommendations.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
              ✓
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              You're all caught up!
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              There are no pending fertilizer recommendations to review at the
              moment. New requests will appear here when farmers submit them.
            </p>

            <button
              type="button"
              onClick={load}
              className="mt-5 rounded-xl bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166534]"
            >
              Check for updates
            </button>
          </div>
        )}

        {/* Recommendation list */}
        {!loading && !loadError && recommendations.length > 0 && (
          <section>
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Recommendations awaiting review
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Verify each recommendation before approving or rejecting it.
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {recommendations.length} pending
              </span>
            </div>

            <div className="space-y-5">
              {recommendations.map((rec) => (
                <article
                  key={rec._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Card heading */}
                  <div className="border-b border-slate-100 p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                          🌾
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900 sm:text-lg">
                              {rec.crop?.name || "Unknown crop"}
                            </h4>

                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium capitalize text-amber-800">
                              Pending review
                            </span>

                            {typeof rec.savingsPercent === "number" && rec.savingsPercent > 0 && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                ↓ {rec.savingsPercent.toFixed(1)}% vs conventional
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-600">
                            {rec.farm?.farmName ||
                              rec.farm?.region ||
                              "Unnamed farm"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Submitted {formatDate(rec.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-emerald-50 px-4 py-3 sm:min-w-44 sm:text-right">
                        <p className="text-xs font-medium text-emerald-800">
                          Estimated total cost
                        </p>
                        <p className="mt-1 text-xl font-bold tracking-tight text-[#14532D]">
                          {formatCurrency(rec.totalCostLKR)}
                        </p>
                        {typeof rec.savingsLKR === "number" && rec.savingsLKR > 0 && (
                          <p className="mt-1 text-xs font-medium text-emerald-700">
                            Saves {formatCurrency(rec.savingsLKR)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Farmer and farm details */}
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                        <p className="text-xs font-medium text-slate-500">
                          Farmer
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {rec.farmer?.name || "Not available"}
                        </p>
                        {rec.farmer?.region && (
                          <p className="mt-1 text-xs text-slate-500">
                            {rec.farmer.region}
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                        <p className="text-xs font-medium text-slate-500">
                          Farm size
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {rec.farm?.areaHectares ?? "—"} hectares
                        </p>
                        {rec.farm?.soilType && (
                          <p className="mt-1 text-xs text-slate-500">
                            Soil: {rec.farm.soilType}
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                        <p className="text-xs font-medium text-slate-500">
                          Farm region
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {rec.farm?.region || "Not available"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation metrics */}
                  <div className="p-5 sm:p-6">
                    <h5 className="text-sm font-bold text-slate-900">
                      Recommendation details
                    </h5>

                    <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
                      <div className="rounded-xl border border-slate-200 p-3.5">
                        <p className="text-xs text-slate-500">Rainfall class</p>
                        <span
                          className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getRainfallStyle(
                            rec.rainfallClass
                          )}`}
                        >
                          {rec.rainfallClass || "Not available"}
                        </span>
                        <div className="mt-2">
                          <RainfallSourceBadge source={rec.rainfallSource} mm={rec.rainfallMm} />
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-3.5">
                        <p className="text-xs text-slate-500">
                          N-leaching multiplier
                        </p>
                        <p className="mt-2 text-lg font-bold text-slate-900">
                          ×{rec.nitrogenLeachingMultiplier ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-3.5">
                        <p className="text-xs text-slate-500">
                          Adjusted nitrogen
                        </p>
                        <p className="mt-2 text-lg font-bold text-slate-900">
                          {rec.adjustedRequirementKgPerHa?.n ?? "—"}
                          <span className="ml-1 text-xs font-medium text-slate-500">
                            kg/ha
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-3.5">
                        <p className="text-xs text-slate-500">Solver status</p>
                        <p className="mt-2 font-semibold capitalize text-emerald-800">
                          {rec.solverStatus || "Not available"}
                        </p>
                      </div>
                    </div>

                    {/* Cost comparison chart */}
                    {typeof rec.baselineCostLKR === "number" && rec.baselineCostLKR > 0 && (
                      <div className="mt-6">
                        <SavingsChart
                          optimizedCost={rec.totalCostLKR}
                          baselineCost={rec.baselineCostLKR}
                        />
                      </div>
                    )}

                    {/* Fertilizer breakdown */}
                    <div className="mt-6">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h5 className="text-sm font-bold text-slate-900">
                          Fertilizer breakdown
                        </h5>
                        <span className="text-xs text-slate-500">
                          {rec.fertilizerMix?.length || 0} fertilizer types
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[480px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-4 py-3 font-semibold">
                                Fertilizer
                              </th>
                              <th className="px-4 py-3 text-right font-semibold">
                                Quantity
                              </th>
                              <th className="px-4 py-3 text-right font-semibold">
                                Estimated cost
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {rec.fertilizerMix?.length > 0 ? (
                              rec.fertilizerMix.map((item, index) => (
                                <tr
                                  key={`${rec._id}-${index}`}
                                  className="transition hover:bg-slate-50"
                                >
                                  <td className="px-4 py-3.5 font-medium text-slate-800">
                                    {item.fertilizerName}
                                  </td>
                                  <td className="px-4 py-3.5 text-right text-slate-600">
                                    {Number(item.quantityKg || 0).toLocaleString(
                                      "en-LK",
                                      { maximumFractionDigits: 2 }
                                    )}{" "}
                                    kg
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-medium text-slate-800">
                                    {formatCurrency(item.costLKR)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="px-4 py-6 text-center text-slate-500"
                                >
                                  No fertilizer breakdown available.
                                </td>
                              </tr>
                            )}
                          </tbody>

                          <tfoot className="border-t border-slate-200 bg-emerald-50">
                            <tr>
                              <td
                                colSpan={2}
                                className="px-4 py-3 text-sm font-bold text-emerald-900"
                              >
                                Total estimated cost
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-emerald-900">
                                {formatCurrency(rec.totalCostLKR)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Review form */}
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <label
                        htmlFor={`review-notes-${rec._id}`}
                        className="block text-sm font-semibold text-slate-800"
                      >
                        Review notes
                        <span className="ml-1 font-normal text-slate-400">
                          (required when rejecting)
                        </span>
                      </label>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Add comments or recommendations for this request.
                      </p>

                      <textarea
                        id={`review-notes-${rec._id}`}
                        rows={3}
                        maxLength={1000}
                        placeholder="Enter your review notes here..."
                        value={notes[rec._id] || ""}
                        disabled={Boolean(reviewing[rec._id])}
                        onChange={(e) =>
                          setNotes((prev) => ({
                            ...prev,
                            [rec._id]: e.target.value,
                          }))
                        }
                        className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-700/10 disabled:bg-slate-50"
                      />

                      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                          Please verify the recommendation before submitting
                          your decision.
                        </p>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            disabled={Boolean(reviewing[rec._id])}
                            onClick={() => handleReview(rec._id, "rejected")}
                            className="flex-1 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                          >
                            {reviewing[rec._id] ? "Processing..." : "Reject"}
                          </button>

                          <button
                            type="button"
                            disabled={Boolean(reviewing[rec._id])}
                            onClick={() => handleReview(rec._id, "approved")}
                            className="flex-1 rounded-xl bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                          >
                            {reviewing[rec._id] ? "Processing..." : "✓ Approve"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}