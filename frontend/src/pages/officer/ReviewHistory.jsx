import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import PdfButton from "../../components/PdfButton.jsx";
import RainfallSourceBadge from "../../components/RainfallSourceBadge.jsx";
import apiClient from "../../api/axiosClient.js";
import { useAuth } from "../../context/AuthContext.jsx";

const formatLKR = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-LK", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const STATUS_STYLES = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const inputClass =
  "rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1C3D20] focus:ring-4 focus:ring-[#1C3D20]/10";

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

export default function ReviewHistory() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [recs, setRecs] = useState([]);
  const [summary, setSummary] = useState({ total: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Wait until the user stops typing before calling the API
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (status) params.status = status;
        if (from) params.from = from;
        if (to) params.to = to;

        const { data } = await apiClient.get("/recommendations/history", { params });
        if (!active) return;
        setRecs(data.recommendations || []);
        setSummary(data.summary || { total: 0, approved: 0, rejected: 0 });
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Unable to load review history. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [debouncedSearch, status, from, to]);

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setFrom("");
    setTo("");
  };

  const hasFilters = search || status || from || to;
  const colSpan = isAdmin ? 7 : 6;

  return (
    <DashboardLayout
      title={isAdmin ? "Review Audit Trail" : "Review History"}
      subtitle={
        isAdmin
          ? "Every recommendation reviewed by any Agricultural Officer."
          : "Every recommendation you have approved or rejected, with your notes."
      }
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Reviews shown" value={summary.total} accent="text-slate-900" />
          <StatCard label="Approved" value={summary.approved} accent="text-emerald-700" />
          <StatCard label="Rejected" value={summary.rejected} accent="text-red-600" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">Farmer</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by farmer name or email..."
              className={`${inputClass} w-full`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Decision</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="">All</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Reviewed from</label>
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Reviewed to</label>
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Reviewed</th>
                  <th className="px-5 py-3">Farmer</th>
                  <th className="px-5 py-3">Crop / Farm</th>
                  {isAdmin && <th className="px-5 py-3">Reviewed by</th>}
                  <th className="px-5 py-3">Decision</th>
                  <th className="px-5 py-3 text-right">Cost</th>
                  <th className="px-5 py-3 text-right">Details</th>
                </tr>
              </thead>

              <tbody>
                {loading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td colSpan={colSpan} className="px-5 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))}

                {!loading &&
                  recs.map((rec) => {
                    const open = expanded === rec._id;
                    return (
                      <React.Fragment key={rec._id}>
                        <tr className="border-t border-slate-100 hover:bg-slate-50/60">
                          <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                            {formatDateTime(rec.reviewedAt)}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-900">{rec.farmer?.name || "—"}</p>
                            <p className="text-xs text-slate-400">{rec.farmer?.email}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-800">{rec.crop?.name || "—"}</p>
                            <p className="text-xs text-slate-400">
                              {rec.farm?.farmName || rec.farm?.region || "—"}
                            </p>
                          </td>
                          {isAdmin && (
                            <td className="px-5 py-3.5 text-slate-600">{rec.reviewedBy?.name || "—"}</td>
                          )}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                                STATUS_STYLES[rec.status] || ""
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-right font-medium text-slate-800">
                            {formatLKR(rec.totalCostLKR)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setExpanded(open ? null : rec._id)}
                              className="text-xs font-semibold text-[#1C3D20] hover:underline"
                            >
                              {open ? "Hide" : "View"}
                            </button>
                          </td>
                        </tr>

                        {open && (
                          <tr className="border-t border-slate-100 bg-slate-50/70">
                            <td colSpan={colSpan} className="px-5 py-5">
                              <div className="grid gap-5 lg:grid-cols-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Review notes
                                  </p>
                                  <p className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                                    {rec.reviewNotes?.trim() ? rec.reviewNotes : "No notes were added."}
                                  </p>

                                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                                    <p>
                                      Rainfall: <span className="font-semibold capitalize text-slate-700">{rec.rainfallClass}</span>
                                    </p>
                                    <div className="col-span-2">
                                      <RainfallSourceBadge source={rec.rainfallSource} mm={rec.rainfallMm} showWarning={false} />
                                    </div>
                                    <p>
                                      N multiplier: <span className="font-semibold text-slate-700">×{rec.nitrogenLeachingMultiplier}</span>
                                    </p>
                                    <p>
                                      Farm area: <span className="font-semibold text-slate-700">{rec.farm?.areaHectares ?? "—"} ha</span>
                                    </p>
                                    <p>
                                      Submitted: <span className="font-semibold text-slate-700">{formatDateTime(rec.createdAt)}</span>
                                    </p>
                                  </div>

                                  {rec.status === "approved" && (
                                    <div className="mt-4">
                                      <PdfButton rec={rec} />
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Fertilizer mix
                                  </p>
                                  <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                    <table className="w-full text-sm">
                                      <tbody className="divide-y divide-slate-100">
                                        {(rec.fertilizerMix || []).map((m, i) => (
                                          <tr key={i}>
                                            <td className="px-3 py-2 text-slate-700">{m.fertilizerName}</td>
                                            <td className="px-3 py-2 text-right text-slate-600">{m.quantityKg} kg</td>
                                            <td className="px-3 py-2 text-right text-slate-700">{formatLKR(m.costLKR)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>

            {!loading && !error && recs.length === 0 && (
              <p className="py-12 text-center text-slate-500">
                {hasFilters ? "No reviews match your filters." : "No reviews recorded yet."}
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}