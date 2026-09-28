import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import apiClient from "../../api/axiosClient.js";

const empty = { name: "", scientificName: "", n: "", p: "", k: "", growingDurationDays: "" };

export default function CropsAdmin() {
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const { data } = await apiClient.get("/crops");
    setCrops(data.crops);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await apiClient.post("/crops", {
      name: form.name,
      scientificName: form.scientificName,
      npkRequirementKgPerHa: { n: Number(form.n), p: Number(form.p), k: Number(form.k) },
      growingDurationDays: Number(form.growingDurationDays) || undefined,
    });
    setForm(empty);
    setShowForm(false);
    load();
  };

  const handleDeactivate = async (id) => {
    await apiClient.delete(`/crops/${id}`);
    load();
  };

  return (
    <DashboardLayout
      title="Crop Reference Data"
      subtitle="DOA / HORDI-sourced NPK requirements used by the Simplex solver"
      actions={
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition"
        >
          {showForm ? "Cancel" : "+ Add crop"}
        </button>
      }
    >
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 mb-6 grid grid-cols-3 gap-4"
        >
          <input
            required
            placeholder="Crop name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <input
            placeholder="Scientific name"
            value={form.scientificName}
            onChange={(e) => setForm({ ...form, scientificName: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <input
            type="number"
            placeholder="Duration (days)"
            value={form.growingDurationDays}
            onChange={(e) => setForm({ ...form, growingDurationDays: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <input
            required
            type="number"
            placeholder="N (kg/ha)"
            value={form.n}
            onChange={(e) => setForm({ ...form, n: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <input
            required
            type="number"
            placeholder="P (kg/ha)"
            value={form.p}
            onChange={(e) => setForm({ ...form, p: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <input
            required
            type="number"
            placeholder="K (kg/ha)"
            value={form.k}
            onChange={(e) => setForm({ ...form, k: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <button
            type="submit"
            className="col-span-3 px-4 py-2 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition"
          >
            Save crop
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">Crop</th>
              <th className="text-left px-5 py-3">N (kg/ha)</th>
              <th className="text-left px-5 py-3">P (kg/ha)</th>
              <th className="text-left px-5 py-3">K (kg/ha)</th>
              <th className="text-left px-5 py-3">Duration</th>
              <th className="text-left px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {crops.map((c) => (
              <tr key={c._id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-5 py-3 text-slate-600">{c.npkRequirementKgPerHa.n}</td>
                <td className="px-5 py-3 text-slate-600">{c.npkRequirementKgPerHa.p}</td>
                <td className="px-5 py-3 text-slate-600">{c.npkRequirementKgPerHa.k}</td>
                <td className="px-5 py-3 text-slate-600">
                  {c.growingDurationDays ? `${c.growingDurationDays} days` : "—"}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => handleDeactivate(c._id)}
                    className="text-red-600 text-xs font-medium hover:underline"
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
