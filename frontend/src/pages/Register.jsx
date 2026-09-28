import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    region: "Nuwara Eliya",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/farmer");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="text-lg font-bold tracking-tight mb-8 block text-center text-[#1C3D20]"
        >
          FertiSmart SL
        </Link>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-1 text-slate-900">Create a farmer account</h2>
          <p className="text-sm text-slate-500 mb-6">
            Officer and Administrator accounts are provisioned separately.
          </p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
              <input
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Region</label>
              <select
                name="region"
                value={form.region}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1C3D20]"
              >
                <option value="Nuwara Eliya">Nuwara Eliya</option>
                <option value="Bandarawela">Bandarawela</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#1C3D20] text-white font-semibold hover:brightness-110 transition disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-[#1C3D20] font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
