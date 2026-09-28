import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import apiClient from "../../api/axiosClient.js";

const STATUS_STYLES = {
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function Recommendations() {
  const [searchParams] = useSearchParams();
  const preselectedFarmId = searchParams.get("farmId") || "";

  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [form, setForm] = useState({ farmId: preselectedFarmId, cropId: "", rainfallMmOverride: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const loadAll = async () => {
    const [farmsRes, cropsRes, recsRes] = await Promise.all([
      apiClient.get("/farms/mine"),
      apiClient.get("/crops"),
      apiClient.get("/recommendations/mine"),
    ]);
    setFarms(farmsRes.data.farms);
    setCrops(cropsRes.data.crops);
    setRecommendations(recsRes.data.recommendations);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const payload = {
        farmId: form.farmId,
        cropId: form.cropId,
        ...(form.rainfallMmOverride !== "" && {
          rainfallMmOverride: Number(form.rainfallMmOverride),
        }),
      };
      const { data } = await apiClient.post("/recommendations", payload);
      setResult(data.recommendation);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate recommendation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Fertilizer Recommendations"
      subtitle="Simplex LP-generated, cost-minimized, weather-adjusted NPK recommendations"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 h-fit space-y-4"
        >
          <h3 className="font-semibold text-slate-900">Request a new recommendation</h3>
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Farm</label>
            <select
              required
              value={form.farmId}
              onChange={(e) => setForm({ ...form, farmId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
            >
              <option value="">Select a farm</option>
              {farms.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.farmName || f.region} ({f.areaHectares} ha)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Crop</label>
            <select
              required
              value={form.cropId}
              onChange={(e) => setForm({ ...form, cropId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
            >
              <option value="">Select a crop</option>
              {crops.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Rainfall override (mm, optional)
            </label>
            <input
              type="number"
              min="0"
              value={form.rainfallMmOverride}
              onChange={(e) => setForm({ ...form, rainfallMmOverride: e.target.value })}
              placeholder="Leave blank to auto-fetch"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition disabled:opacity-60"
          >
            {loading ? "Optimizing..." : "Generate recommendation"}
          </button>

          {result && (
            <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-800">
                Optimal mix found — Rs. {result.totalCostLKR.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Rainfall class: {result.rainfallClass} (×{result.nitrogenLeachingMultiplier})
              </p>
              <ul className="mt-2 text-sm text-emerald-800 space-y-1">
                {result.fertilizerMix.map((m, i) => (
                  <li key={i}>
                    {m.fertilizerName}: {m.quantityKg} kg — Rs. {m.costLKR.toLocaleString()}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-emerald-600 mt-2">Sent to Agricultural Officer for review.</p>
            </div>
          )}
        </form>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-slate-900">Your recommendation history</h3>
          {recommendations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
              No recommendations yet.
            </div>
          ) : (
            recommendations.map((rec) => (
              <div key={rec._id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{rec.crop?.name}</h4>
                    <p className="text-xs text-slate-500">
                      {rec.farm?.farmName || rec.farm?.region} · {new Date(rec.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[rec.status]}`}
                  >
                    {rec.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    Rainfall: {rec.rainfallClass} (×{rec.nitrogenLeachingMultiplier})
                  </span>
                  <span className="font-semibold text-slate-900">
                    Rs. {rec.totalCostLKR.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
