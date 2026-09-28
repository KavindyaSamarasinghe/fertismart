import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import apiClient from "../../api/axiosClient.js";

const empty = { name: "", type: "Nitrogen", n: "", p: "", k: "", costPerKgLKR: "", supplier: "" };

export default function FertilizersAdmin() {
  const [fertilizers, setFertilizers] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const { data } = await apiClient.get("/fertilizers");
    setFertilizers(data.fertilizers);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await apiClient.post("/fertilizers", {
      name: form.name,
      type: form.type,
      nutrientContentPercent: { n: Number(form.n), p: Number(form.p), k: Number(form.k) },
      costPerKgLKR: Number(form.costPerKgLKR),
      supplier: form.supplier,
    });
    setForm(empty);
    setShowForm(false);
    load();
  };

  const handleDeactivate = async (id) => {
    await apiClient.delete(`/fertilizers/${id}`);
    load();
  };

  return (
    <DashboardLayout
      title="Fertilizer Reference Data"
      subtitle="Nutrient content and market cost used as inputs to the Simplex solver"
      actions={
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition"
        >
          {showForm ? "Cancel" : "+ Add fertilizer"}
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
            placeholder="Fertilizer name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          >
            <option>Nitrogen</option>
            <option>Phosphorus</option>
            <option>Potassium</option>
            <option>Compound</option>
          </select>
          <input
            required
            type="number"
            placeholder="Cost per kg (LKR)"
            value={form.costPerKgLKR}
            onChange={(e) => setForm({ ...form, costPerKgLKR: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <input
            required
            type="number"
            placeholder="N content (%)"
            value={form.n}
            onChange={(e) => setForm({ ...form, n: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <input
            required
            type="number"
            placeholder="P content (%)"
            value={form.p}
            onChange={(e) => setForm({ ...form, p: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <input
            required
            type="number"
            placeholder="K content (%)"
            value={form.k}
            onChange={(e) => setForm({ ...form, k: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <input
            placeholder="Supplier (optional)"
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <button
            type="submit"
            className="col-span-3 px-4 py-2 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition"
          >
            Save fertilizer
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">Fertilizer</th>
              <th className="text-left px-5 py-3">Type</th>
              <th className="text-left px-5 py-3">N%</th>
              <th className="text-left px-5 py-3">P%</th>
              <th className="text-left px-5 py-3">K%</th>
              <th className="text-left px-5 py-3">Cost/kg (LKR)</th>
              <th className="text-left px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {fertilizers.map((f) => (
              <tr key={f._id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium text-slate-900">{f.name}</td>
                <td className="px-5 py-3 text-slate-600">{f.type}</td>
                <td className="px-5 py-3 text-slate-600">{f.nutrientContentPercent.n}</td>
                <td className="px-5 py-3 text-slate-600">{f.nutrientContentPercent.p}</td>
                <td className="px-5 py-3 text-slate-600">{f.nutrientContentPercent.k}</td>
                <td className="px-5 py-3 text-slate-600">{f.costPerKgLKR}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => handleDeactivate(f._id)}
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
