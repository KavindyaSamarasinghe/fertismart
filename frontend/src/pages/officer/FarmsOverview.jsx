import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import Pagination from "../../components/Pagination.jsx";
import apiClient from "../../api/axiosClient.js";
import usePagination from "../../hooks/usePagination.js";

const Icon = ({ children, className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const BADGE_PALETTE = [
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-slate-100 text-slate-600",
];
function badgeColor(label) {
  if (!label) return BADGE_PALETTE[BADGE_PALETTE.length - 1];
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return BADGE_PALETTE[hash % BADGE_PALETTE.length];
}

export default function FarmsOverview() {
  const [farms, setFarms] = useState([]);
  const [region, setRegion] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/farms", { params: region ? { region } : {} });
      setFarms(data.farms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [region]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return farms;
    return farms.filter((f) =>
      [f.farmName, f.farmer?.name, f.region].some((v) => v?.toLowerCase().includes(q))
    );
  }, [farms, search]);

  const { page, setPage, totalPages, pageItems, total, pageSize } = usePagination(filtered, 10);

 
  useEffect(() => {
    setPage(1);
  }, [search, region, setPage]);

  return (
    <DashboardLayout
      title="Farms Overview"
      subtitle="All registered farms across your assigned regions"
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
              placeholder="Search farm, farmer or region..."
              className="w-72 rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1C3D20] focus:ring-4 focus:ring-[#1C3D20]/10"
            />
          </div>

          <div className="relative">
            <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" />
            </Icon>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 outline-none transition focus:border-[#1C3D20] focus:ring-4 focus:ring-[#1C3D20]/10"
            >
              <option value="">All regions</option>
              <option value="Nuwara Eliya">Nuwara Eliya</option>
              <option value="Bandarawela">Bandarawela</option>
            </select>
            <Icon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
              <path d="M6 9l6 6 6-6" />
            </Icon>
          </div>
        </div>
      }
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-4 px-6 py-5">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-emerald-50 text-[#1C3D20]">
            <Icon className="h-6 w-6"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /></Icon>
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Registered Farms</h2>
            <p className="text-sm text-slate-500">{filtered.length} farm{filtered.length === 1 ? "" : "s"} found</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Farm</th>
                <th className="px-6 py-3">Farmer</th>
                <th className="px-6 py-3">Region</th>
                <th className="px-6 py-3">Area (ha)</th>
                <th className="px-6 py-3">Soil type</th>
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
                pageItems.map((f) => (
                  <tr key={f._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5 font-medium text-slate-900">
                        <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-emerald-50 text-[#1C3D20]">
                          <Icon className="h-4 w-4"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /></Icon>
                        </span>
                        {f.farmName || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-400"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" /></Icon>
                        {f.farmer?.name || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></Icon>
                        {f.region}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{f.areaHectares}</td>
                    <td className="px-6 py-3.5">
                      {f.soilType ? (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeColor(f.soilType)}`}>
                          {f.soilType}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="relative flex justify-end">
                        <button
                          type="button"
                          onClick={() => setOpenMenu(openMenu === f._id ? null : f._id)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Row actions"
                        >
                          <Icon className="h-5 w-5"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></Icon>
                        </button>
                        {openMenu === f._id && (
                          <div className="absolute right-0 top-9 z-10 w-40 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
                            <button type="button" className="block w-full px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">View details</button>
                            <button type="button" className="block w-full px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Edit farm</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <p className="py-12 text-center text-slate-500">No farms found.</p>
          )}
        </div>
      </div>

      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onChange={setPage}
        />
      )}
    </DashboardLayout>
  );
}
