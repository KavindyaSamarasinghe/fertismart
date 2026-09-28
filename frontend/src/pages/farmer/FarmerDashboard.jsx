import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import apiClient from "../../api/axiosClient.js";

export default function FarmerDashboard() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    farmName: "",
    region: "Nuwara Eliya",
    areaHectares: "",
    soilType: "",
  });
  const [error, setError] = useState("");

  const loadFarms = async () => {
    setLoading(true);
    const { data } = await apiClient.get("/farms/mine");
    setFarms(data.farms);
    setLoading(false);
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiClient.post("/farms", { ...form, areaHectares: Number(form.areaHectares) });
      setShowForm(false);
      setForm({ farmName: "", region: "Nuwara Eliya", areaHectares: "", soilType: "" });
      loadFarms();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add farm");
    }
  };

  return (
    <DashboardLayout
      title="My Farms"
      subtitle="Manage your registered plots and request fertilizer recommendations"
      actions={
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition"
        >
          {showForm ? "Cancel" : "+ Add farm"}
        </button>
      }
    >
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4"
        >
          {error && (
            <div className="col-span-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Farm name</label>
            <input
              required
              value={form.farmName}
              onChange={(e) => setForm({ ...form, farmName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Region</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
            >
              <option value="Nuwara Eliya">Nuwara Eliya</option>
              <option value="Bandarawela">Bandarawela</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Area (hectares)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.areaHectares}
              onChange={(e) => setForm({ ...form, areaHectares: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Soil type</label>
            <input
              value={form.soilType}
              onChange={(e) => setForm({ ...form, soilType: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
            />
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition"
            >
              Save farm
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Loading farms...</p>
      ) : farms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-slate-500">You haven't added a farm yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map((farm) => (
            <div key={farm._id} className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900">{farm.farmName || "Unnamed farm"}</h3>
              <p className="text-sm text-slate-500 mt-1">{farm.region}</p>
              <p className="text-sm text-slate-500">{farm.areaHectares} ha</p>
              <Link
                to={`/farmer/recommendations?farmId=${farm._id}`}
                className="inline-block mt-4 text-sm font-medium text-[#1C3D20] hover:underline"
              >
                Get a recommendation →
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
