import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Leaf = ({ className = "h-8 w-8 text-[#1C3D20]" }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
    <path d="M16 29V16C16 9 11 5 3 5c0 8 4 12 13 11z" />
    <path d="M16 20c0-7 5-12 13-12 0 8-4 13-13 12z" opacity=".75" />
  </svg>
);

const Icon = ({ children, className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const perks = [
  { title: "Healthy Soil", text: "Better nutrient balance", icon: <Icon><path d="M12 3c4 3 4 7 0 10-4-3-4-7 0-10z" /><path d="M12 13v8M8 21h8" /></Icon> },
  { title: "Higher Yields", text: "More productive harvests", icon: <Icon><path d="M4 20V13M10 20V8M16 20v-6M20 20v-3" /></Icon> },
  { title: "Lower Costs", text: "Use fertilizer efficiently", icon: <Icon><circle cx="9" cy="9" r="5" /><circle cx="15" cy="15" r="5" /><path d="M9 7v4M7 9h4" /></Icon> },
];

const Field = ({ label, required, icon, right, className = "", ...props }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
        {icon}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-slate-300 bg-white py-3.5 pl-12 pr-12 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1C3D20] focus:ring-4 focus:ring-[#1C3D20]/10"
      />
      {right && <span className="absolute inset-y-0 right-0 flex w-12 items-center justify-center">{right}</span>}
    </div>
  </label>
);

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    region: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

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
    <div className="grid w-full bg-[#F8FAFC] lg:h-screen lg:grid-cols-2">
      {/* Left: photo + pitch */}
      <div className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(/register-field.jpg), linear-gradient(160deg,#e7efe8 0%,#bcd6c4 55%,#7fa88c 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-[#F8FAFC]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#eef3ee]/95 via-[#eef3ee]/55 to-transparent" />
        <Leaf className="pointer-events-none absolute -right-6 bottom-16 h-64 w-64 text-white/40" />

        <div className="relative flex h-full flex-col justify-center px-14 py-16 xl:px-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1C3D20]">
            Smart Farming · Better Yields
          </p>
          <h1 className="mt-4 max-w-lg text-4xl font-bold leading-tight text-slate-900 xl:text-5xl">
            Join <span className="text-[#1C3D20]">FertiSmart SL</span> and grow with data.
          </h1>
          <p className="mt-5 max-w-sm text-slate-600">
            Get personalized fertilizer recommendations based on your soil analysis and crop needs.
          </p>

          <ul className="mt-10 space-y-5">
            {perks.map((p) => (
              <li key={p.title} className="flex items-center gap-4">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-emerald-100 text-[#1C3D20]">
                  {p.icon}
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">{p.title}</span>
                  <span className="block text-sm text-slate-500">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-col lg:h-screen lg:overflow-y-auto">
        <header className="flex items-center justify-between px-6 py-5 lg:px-14">
          <Link to="/" className="flex items-center gap-2.5">
            <Leaf />
            <span className="text-lg font-bold tracking-tight text-slate-900">FertiSmart SL</span>
          </Link>
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#1C3D20] hover:underline">
              Log in
            </Link>
          </p>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-14">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-10 shadow-lg shadow-slate-200/60">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-[#1C3D20] text-white">
                <Icon className="h-6 w-6"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" /></Icon>
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create a Farmer Account</h2>
                <p className="text-sm text-slate-500">Fill in your details to get started.</p>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <Field
                label="Full Name" required name="name" value={form.name} onChange={handleChange}
                placeholder="Enter your full name" autoComplete="name"
                icon={<Icon><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" /></Icon>}
              />

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Email" required type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="Enter your email address" autoComplete="email"
                  icon={<Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icon>}
                />
                <Field
                  label="Password" required type={showPw ? "text" : "password"} name="password" value={form.password}
                  onChange={handleChange} placeholder="Create a password" autoComplete="new-password" minLength={6}
                  icon={<Icon><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></Icon>}
                  right={
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="text-slate-400 hover:text-slate-600" aria-label={showPw ? "Hide password" : "Show password"}>
                      <Icon>{showPw ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 002.8 2.8" /><path d="M9.5 5.4A10.4 10.4 0 0112 5c5 0 9 4 10 7-.4 1.1-1.1 2.3-2.1 3.4M6.2 6.9C4.2 8.1 2.7 9.9 2 12c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8" /></> : <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>}</Icon>
                    </button>
                  }
                />
              </div>

              <Field
                label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="Enter your phone number" autoComplete="tel"
                icon={<Icon><path d="M4 4h4l2 5-2.5 1.5a11 11 0 005 5L14 13l5 2v4a2 2 0 01-2 2C9.5 21 3 14.5 3 6a2 2 0 011-2z" /></Icon>}
              />

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Region <span className="text-red-500">*</span>
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                    <Icon><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></Icon>
                  </span>
                  <select
                    name="region" required value={form.region} onChange={handleChange}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-3.5 pl-12 pr-12 text-base text-slate-900 outline-none transition focus:border-[#1C3D20] focus:ring-4 focus:ring-[#1C3D20]/10"
                  >
                    <option value="" disabled>Select your region</option>
                    <option value="Nuwara Eliya">Nuwara Eliya</option>
                    <option value="Bandarawela">Bandarawela</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400">
                    <Icon><path d="M6 9l6 6 6-6" /></Icon>
                  </span>
                </div>
              </label>

              <button
                type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1C3D20] py-3.5 text-base font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                <Icon className="h-5 w-5"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></Icon>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">OR</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-emerald-50 px-4 py-3.5">
              <Icon className="mt-0.5 h-5 w-5 flex-none text-[#1C3D20]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></Icon>
              <p className="text-sm text-slate-600">
                Your information is safe and will only be used for agricultural service purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
