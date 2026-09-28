import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import apiClient from "../../api/axiosClient.js";

export default function FarmsOverview() {
  const [farms, setFarms] = useState([]);
  const [region, setRegion] = useState("");

  const load = async () => {
    const { data } = await apiClient.get("/farms", { params: region ? { region } : {} });
    setFarms(data.farms);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  return (
    <DashboardLayout
      title="Farms Overview"
      subtitle="All registered farms across your assigned regions"
      actions={
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
        >
          <option value="">All regions</option>
          <option value="Nuwara Eliya">Nuwara Eliya</option>
          <option value="Bandarawela">Bandarawela</option>
        </select>
      }
    >
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">Farm</th>
              <th className="text-left px-5 py-3">Farmer</th>
              <th className="text-left px-5 py-3">Region</th>
              <th className="text-left px-5 py-3">Area (ha)</th>
              <th className="text-left px-5 py-3">Soil type</th>
            </tr>
          </thead>
          <tbody>
            {farms.map((f) => (
              <tr key={f._id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium text-slate-900">{f.farmName || "—"}</td>
                <td className="px-5 py-3 text-slate-600">{f.farmer?.name}</td>
                <td className="px-5 py-3 text-slate-600">{f.region}</td>
                <td className="px-5 py-3 text-slate-600">{f.areaHectares}</td>
                <td className="px-5 py-3 text-slate-600">{f.soilType || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {farms.length === 0 && (
          <p className="text-center text-slate-500 py-10">No farms found.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
