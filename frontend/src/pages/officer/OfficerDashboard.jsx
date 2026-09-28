import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import apiClient from "../../api/axiosClient.js";

export default function OfficerDashboard() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});

  const load = async () => {
    setLoading(true);
    const { data } = await apiClient.get("/recommendations/pending");
    setRecommendations(data.recommendations);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleReview = async (id, decision) => {
    await apiClient.patch(`/recommendations/${id}/review`, {
      decision,
      reviewNotes: notes[id] || "",
    });
    load();
  };

  return (
    <DashboardLayout
      title="Pending Reviews"
      subtitle="Approve or reject Simplex-generated recommendations before they reach the farmer"
    >
      {loading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : recommendations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
          No pending recommendations. All caught up.
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec._id} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {rec.crop?.name} — {rec.farmer?.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {rec.farm?.farmName || rec.farm?.region} · {rec.farm?.areaHectares} ha ·{" "}
                    {rec.farmer?.region}
                  </p>
                </div>
                <span className="text-lg font-bold text-slate-900">
                  Rs. {rec.totalCostLKR.toLocaleString()}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs">Rainfall class</p>
                  <p className="font-medium text-slate-900 capitalize">{rec.rainfallClass}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs">N-leach multiplier</p>
                  <p className="font-medium text-slate-900">×{rec.nitrogenLeachingMultiplier}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs">Adjusted N (kg/ha)</p>
                  <p className="font-medium text-slate-900">{rec.adjustedRequirementKgPerHa?.n}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs">Solver status</p>
                  <p className="font-medium text-slate-900 capitalize">{rec.solverStatus}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-slate-600 mb-2">Fertilizer mix</p>
                <ul className="text-sm space-y-1">
                  {rec.fertilizerMix.map((m, i) => (
                    <li key={i} className="flex justify-between text-slate-700">
                      <span>{m.fertilizerName}</span>
                      <span>{m.quantityKg} kg · Rs. {m.costLKR.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <textarea
                placeholder="Review notes (optional)"
                value={notes[rec._id] || ""}
                onChange={(e) => setNotes({ ...notes, [rec._id]: e.target.value })}
                className="mt-4 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
                rows={2}
              />

              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => handleReview(rec._id, "approved")}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:brightness-110 transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReview(rec._id, "rejected")}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:brightness-110 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
