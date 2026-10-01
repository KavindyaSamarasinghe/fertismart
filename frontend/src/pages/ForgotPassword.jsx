import React, { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/axiosClient.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/forgot-password", { email });
      setMsg(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F8F4] px-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-[#1C2D35]">Forgot password?</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email and we'll send you a reset link.
        </p>

        {msg && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {msg}
          </div>
        )}
        {error && (
          <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#287650] focus:ring-2 focus:ring-[#287650]/15"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#145C3B] py-3 text-sm font-semibold text-white transition hover:bg-[#10492F] disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-[#176344] hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}