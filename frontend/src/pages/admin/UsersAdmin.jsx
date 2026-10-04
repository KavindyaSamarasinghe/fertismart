import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import ExportCsvButton from "../../components/ExportCsvButton.jsx";
import Pagination from "../../components/Pagination.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import apiClient from "../../api/axiosClient.js";
import usePagination from "../../hooks/usePagination.js";
import { downloadCsv } from "../../utils/exportCsv.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast, errorMessage } from "../../context/ToastContext.jsx";

const empty = { name: "", email: "", password: "", role: "officer" };

const USER_COLUMNS = [
  { header: "Name", value: (u) => u.name },
  { header: "Email", value: (u) => u.email },
  { header: "Role", value: (u) => u.role },
  { header: "Region", value: (u) => u.region },
  { header: "Phone", value: (u) => u.phone },
  { header: "Assigned regions", value: (u) => (u.assignedRegions || []).join("; ") },
  { header: "Status", value: (u) => (u.isActive ? "Active" : "Inactive") },
  { header: "Created", value: (u) => (u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "") },
];

const inputClass =
  "px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]";

export default function UsersAdmin() {
  const toast = useToast();
  const { user: me } = useAuth();
  const myId = String(me?.id || me?._id || "");

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmUser, setConfirmUser] = useState(null);
  const [updating, setUpdating] = useState(false);

  const { page, setPage, totalPages, pageItems, total, pageSize } = usePagination(users, 10);

  const load = async () => {
    try {
      const { data } = await apiClient.get("/admin/users");
      setUsers(data.users);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to load users. Please try again."));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post("/admin/users", form);
      toast.success(`${form.role === "admin" ? "Administrator" : "Officer"} account created for ${form.name}.`);
      setForm(empty);
      setShowForm(false);
      setPage(1); // newest accounts are listed first
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to create the account."));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user) => {
    setUpdating(true);
    try {
      await apiClient.patch(`/admin/users/${user._id}/status`, { isActive: !user.isActive });
      toast.success(`${user.name}'s account ${user.isActive ? "deactivated" : "activated"}.`);
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update the account status."));
    } finally {
      setUpdating(false);
      setConfirmUser(null);
    }
  };

  // Confirm only when deactivating; activating is harmless
  const handleStatusClick = (u) => (u.isActive ? setConfirmUser(u) : toggleStatus(u));

  // Exports every user, not just the current page
  const handleExport = () => {
    downloadCsv("users", USER_COLUMNS, users);
    toast.success(`Exported ${users.length} user${users.length === 1 ? "" : "s"} to CSV.`);
  };

  return (
    <DashboardLayout
      title="User Accounts"
      subtitle="Provision Agricultural Officer and Administrator accounts"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <ExportCsvButton onClick={handleExport} disabled={users.length === 0} />
          <button
            onClick={() => setShowForm((s) => !s)}
            className="px-4 py-2 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition"
          >
            {showForm ? "Cancel" : "+ Add staff account"}
          </button>
        </div>
      }
    >
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4"
        >
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
          <input
            required
            type="password"
            minLength={6}
            placeholder="Temporary password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={inputClass}
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={inputClass}
          >
            <option value="officer">Agricultural Officer</option>
            <option value="admin">Administrator</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="col-span-2 px-4 py-2 rounded-lg bg-[#1C3D20] text-white text-sm font-medium hover:brightness-110 transition disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create account"}
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
            {pageItems.map((u) => {
              const isSelf = String(u._id) === myId;
              return (
                <tr key={u._id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {u.name}
                    {isSelf && <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>}
                  </td>
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
                    {!isSelf && (
                      <button
                        onClick={() => handleStatusClick(u)}
                        className="text-[#1C3D20] text-xs font-medium hover:underline"
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onChange={setPage}
      />

      <ConfirmDialog
        open={Boolean(confirmUser)}
        title="Deactivate this account?"
        message={`${confirmUser?.name ?? "This user"} (${confirmUser?.email ?? ""}) will no longer be able to sign in. You can reactivate the account at any time.`}
        confirmLabel="Deactivate"
        busy={updating}
        onConfirm={() => toggleStatus(confirmUser)}
        onCancel={() => setConfirmUser(null)}
      />
    </DashboardLayout>
  );
}