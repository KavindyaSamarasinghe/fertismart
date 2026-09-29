import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import apiClient from "../../api/axiosClient.js";

const empty = { name: "", scientificName: "", n: "", p: "", k: "", growingDurationDays: "" };

const Icon = ({ children, className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const Field = ({ label, className = "", ...props }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
    <input
      {...props}
      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1C3D20] focus:ring-4 focus:ring-[#1C3D20]/10"
    />
  </label>
);

export default function CropsAdmin() {
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/crops");
      setCrops(data.crops);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return crops;
    return crops.filter((c) => c.name?.toLowerCase().includes(q) || c.scientificName?.toLowerCase().includes(q));
  }, [crops, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post("/crops", {
        name: form.name,
        scientificName: form.scientificName,
        npkRequirementKgPerHa: { n: Number(form.n), p: Number(form.p), k: Number(form.k) },
        growingDurationDays: Number(form.growingDurationDays) || undefined,
      });
      setForm(empty);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    setDeactivatingId(id);
    try {
      await apiClient.delete(`/crops/${id}`);
      load();
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <DashboardLayout
      title="Crop Reference Data"
      subtitle="DOA / HORDI-sourced NPK requirements used by the Simplex solver"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </Icon>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search crops..."
              className="w-64 rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1C3D20] focus:ring-4 focus:ring-[#1C3D20]/10"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1C3D20] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {showForm ? (
              <>
                <Icon className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></Icon>
                Cancel
              </>
            ) : (
              <>
                <Icon className="h-4 w-4"><path d="M12 5v14M5 12h14" /></Icon>
                Add crop
              </>
            )}
          </button>
        </div>
      }
    >
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-slate-200 bg-white p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-emerald-50 text-[#1C3D20]">
              <Icon className="h-5 w-5"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /></Icon>
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Add a new crop</h3>
              <p className="text-sm text-slate-500">Sourced from DOA / HORDI fertilizer standards.</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              required label="Crop name" placeholder="e.g. Tomato"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Field
              label="Scientific name" placeholder="e.g. Solanum lycopersicum"
              value={form.scientificName} onChange={(e) => setForm({ ...form, scientificName: e.target.value })}
            />
            <Field
              type="number" label="Growing duration (days)" placeholder="e.g. 100"
              value={form.growingDurationDays} onChange={(e) => setForm({ ...form, growingDurationDays: e.target.value })}
            />
            <Field
              required type="number" label="Nitrogen — N (kg/ha)" placeholder="e.g. 120"
              value={form.n} onChange={(e) => setForm({ ...form, n: e.target.value })}
            />
            <Field
              required type="number" label="Phosphorus — P (kg/ha)" placeholder="e.g. 60"
              value={form.p} onChange={(e) => setForm({ ...form, p: e.target.value })}
            />
            <Field
              required type="number" label="Potassium — K (kg/ha)" placeholder="e.g. 60"
              value={form.k} onChange={(e) => setForm({ ...form, k: e.target.value })}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(empty); }}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#1C3D20] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save crop"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-4 px-6 py-5">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-emerald-50 text-[#1C3D20]">
            <Icon className="h-6 w-6"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /></Icon>
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Registered Crops</h2>
            <p className="text-sm text-slate-500">{filtered.length} crop{filtered.length === 1 ? "" : "s"} found</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Crop</th>
                <th className="px-6 py-3">N (kg/ha)</th>
                <th className="px-6 py-3">P (kg/ha)</th>
                <th className="px-6 py-3">K (kg/ha)</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))}

              {!loading &&
                filtered.map((c) => (
                  <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-emerald-50 text-[#1C3D20]">
                          <Icon className="h-4 w-4"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /></Icon>
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{c.name}</p>
                          {c.scientificName && (
                            <p className="text-xs italic text-slate-400">{c.scientificName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {c.npkRequirementKgPerHa.n}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">
                        {c.npkRequirementKgPerHa.p}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                        {c.npkRequirementKgPerHa.k}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {c.growingDurationDays ? `${c.growingDurationDays} days` : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeactivate(c._id)}
                        disabled={deactivatingId === c._id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Icon className="h-3.5 w-3.5"><path d="M18 6L6 18M6 6l12 12" /></Icon>
                        {deactivatingId === c._id ? "Deactivating..." : "Deactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <p className="py-12 text-center text-slate-500">No crops found.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
