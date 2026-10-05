import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import ExportCsvButton from "../../components/ExportCsvButton.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import apiClient from "../../api/axiosClient.js";
import { downloadCsv } from "../../utils/exportCsv.js";
import { useToast, errorMessage } from "../../context/ToastContext.jsx";

const empty = { name: "", type: "Nitrogen", n: "", p: "", k: "", costPerKgLKR: "", supplier: "" };

const FERTILIZER_COLUMNS = [
  { header: "Fertilizer", value: (f) => f.name },
  { header: "Type", value: (f) => f.type },
  { header: "N (%)", value: (f) => f.nutrientContentPercent?.n },
  { header: "P (%)", value: (f) => f.nutrientContentPercent?.p },
  { header: "K (%)", value: (f) => f.nutrientContentPercent?.k },
  { header: "Cost per kg (LKR)", value: (f) => f.costPerKgLKR },
  { header: "Supplier", value: (f) => f.supplier },
];

const inputClass =
  "px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]";

export default function FertilizersAdmin() {
  const toast = useToast();

  const [fertilizers, setFertilizers] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmFert, setConfirmFert] = useState(null); // { id, name }
  const [deactivating, setDeactivating] = useState(false);

  const load = async () => {
    try {
      const { data } = await apiClient.get("/fertilizers");
      setFertilizers(data.fertilizers);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to load fertilizers. Please try again."));
    }
  };

  useEffect(() => {
    load();
  
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post("/fertilizers", {
        name: form.name,
        type: form.type,
        nutrientContentPercent: { n: Number(form.n), p: Number(form.p), k: Number(form.k) },
        costPerKgLKR: Number(form.costPerKgLKR),
        supplier: form.supplier,
      });
      toast.success(`${form.name} added to the fertilizer list.`);
      setForm(empty);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save the fertilizer. Check the details and try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmFert) return;
    setDeactivating(true);
    try {
      await apiClient.delete(`/fertilizers/${confirmFert.id}`);
      toast.success(`${confirmFert.name} deactivated.`);
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to deactivate the fertilizer."));
    } finally {
      setDeactivating(false);
      setConfirmFert(null);
    }
  };

  const handleExport = () => {
    downloadCsv("fertilizers", FERTILIZER_COLUMNS, fertilizers);
    toast.success(`Exported ${fertilizers.length} fertilizer${fertilizers.length === 1 ? "" : "s"} to CSV.`);
  };

  return (
    <DashboardLayout
      title="Fertilizer Reference Data"
      subtitle="Nutrient content and market cost used as inputs to the Simplex solver"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <ExportCsvButton onClick={handleExport} disabled={fertilizers.length === 0} />
          <button
            onClick={() => setShowForm((s) => !s)}
            className="px-4 py-2 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition"
          >
            {showForm ? "Cancel" : "+ Add fertilizer"}
          </button>
        </div>
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
            className={inputClass}
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className={inputClass}
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
            className={inputClass}
          />
          <input
            required
            type="number"
            placeholder="N content (%)"
            value={form.n}
            onChange={(e) => setForm({ ...form, n: e.target.value })}
            className={inputClass}
          />
          <input
            required
            type="number"
            placeholder="P content (%)"
            value={form.p}
            onChange={(e) => setForm({ ...form, p: e.target.value })}
            className={inputClass}
          />
          <input
            required
            type="number"
            placeholder="K content (%)"
            value={form.k}
            onChange={(e) => setForm({ ...form, k: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Supplier (optional)"
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={saving}
            className="col-span-3 px-4 py-2 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save fertilizer"}
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
                    onClick={() => setConfirmFert({ id: f._id, name: f.name })}
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

      <ConfirmDialog
        open={Boolean(confirmFert)}
        title="Deactivate this fertilizer?"
        message={`${confirmFert?.name ?? "This fertilizer"} will be excluded from the Simplex solver, so new recommendations may cost more or become infeasible. Existing recommendations are not affected.`}
        confirmLabel="Deactivate"
        busy={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmFert(null)}
      />
    </DashboardLayout>
  );
}