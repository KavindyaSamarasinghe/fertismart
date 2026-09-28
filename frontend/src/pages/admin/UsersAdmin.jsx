import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import apiClient from "../../api/axiosClient.js";

const empty = { name: "", email: "", password: "", role: "officer" };

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const { data } = await apiClient.get("/admin/users");
    setUsers(data.users);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiClient.post("/admin/users", form);
      setForm(empty);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  const toggleStatus = async (id, isActive) => {
    await apiClient.patch(`/admin/users/${id}/status`, { isActive: !isActive });
    load();
  };

  return (
    <DashboardLayout
      title="User Accounts"
      subtitle="Provision Agricultural Officer and Administrator accounts"
      actions={
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition"
        >
          {showForm ? "Cancel" : "+ Add staff account"}
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
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <input
            required
            type="password"
            minLength={6}
            placeholder="Temporary password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
          >
            <option value="officer">Agricultural Officer</option>
            <option value="admin">Administrator</option>
          </select>
          <button
            type="submit"
            className="col-span-2 px-4 py-2 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition"
          >
            Create account
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Role</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium text-slate-900">{u.name}</td>
                <td className="px-5 py-3 text-slate-600">{u.email}</td>
                <td className="px-5 py-3 text-slate-600 capitalize">{u.role}</td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                      u.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => toggleStatus(u._id, u.isActive)}
                    className="text-[#1C3D20] text-xs font-medium hover:underline"
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
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
