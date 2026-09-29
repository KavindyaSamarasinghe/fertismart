
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_HOME = {
  farmer: "/farmer",
  officer: "/officer",
  admin: "/admin",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(form.email, form.password);
      navigate(ROLE_HOME[user.role] || "/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F4] font-sans text-[#1C2D35]">
      {/* ================= NAVBAR ================= */}
      <header className="relative z-20 border-b border-slate-100 bg-white">
        <nav className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-16 xl:px-20">
          {/* Brand */}
          <Link
            to="/"
            aria-label="FertiSmart SL home"
            className="flex shrink-0 items-center gap-3"
          >
            <svg
              viewBox="0 0 48 48"
              className="h-10 w-10"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M24 42V23"
                stroke="#145C3B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M24 26C8 26 5 13 5 5C19 5 28 12 24 26Z"
                fill="#56A878"
              />
              <path
                d="M24 33C24 17 34 7 44 7C45 20 39 31 24 33Z"
                fill="#176344"
              />
              <path
                d="M24 26L14 15M24 32L35 17"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>

            <span className="text-lg font-bold tracking-tight text-[#194C36] sm:text-xl">
              FertiSmart SL
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-7 md:flex lg:gap-9">
            <Link
              to="/"
              className="border-b-2 border-[#176344] py-2 text-sm font-medium text-[#176344]"
            >
              Home
            </Link>

            <Link
              to="/#about"
              className="py-2 text-sm text-slate-600 transition-colors hover:text-[#176344]"
            >
              About
            </Link>

            <Link
              to="/#features"
              className="py-2 text-sm text-slate-600 transition-colors hover:text-[#176344]"
            >
              Features
            </Link>

            <Link
              to="/#contact"
              className="py-2 text-sm text-slate-600 transition-colors hover:text-[#176344]"
            >
              Contact
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-[#145C3B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10492F] focus:outline-none focus:ring-4 focus:ring-[#145C3B]/20"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile navigation button */}
          <Link
            to="/register"
            className="rounded-lg bg-[#145C3B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#10492F] md:hidden"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="relative isolate flex min-h-[calc(100vh-76px)] items-center overflow-hidden">
        {/* Light green background */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#F8FAF7] via-[#F1F7F1] to-[#EAF2E9]" />

        {/* Decorative background shapes */}
        <div className="pointer-events-none absolute -right-28 top-10 -z-10 hidden h-80 w-80 rotate-[-25deg] rounded-[90%_0_90%_0] bg-[#DDEADD]/50 lg:block" />

        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:px-16 lg:py-12 xl:gap-20 xl:px-20 xl:py-14">
          {/* ================= LEFT: LOGIN FORM ================= */}
          <section className="mx-auto w-full max-w-[520px] lg:mx-0 lg:justify-self-center">
            {/* Heading */}
            <div className="mb-7">
              <div className="mb-4 flex items-center gap-2.5">
                <svg
                  viewBox="0 0 32 32"
                  className="h-7 w-7 shrink-0"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M16 28V15"
                    stroke="#176344"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 17C5 17 4 9 4 4C14 4 19 8 16 17Z"
                    fill="#56A878"
                  />
                  <path
                    d="M16 22C16 12 22 5 29 5C30 14 25 21 16 22Z"
                    fill="#176344"
                  />
                </svg>

                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#548366] sm:text-xs sm:tracking-[0.18em]">
                  Your smart farming journey
                </span>
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#1C2D35] sm:text-5xl">
                Welcome back
              </h1>

              <p className="mt-3 text-base leading-7 text-slate-500 sm:text-lg">
                Sign in to your account to continue
              </p>
            </div>

            {/* Login card */}
            <div className="rounded-2xl border border-white bg-white p-6 shadow-[0_12px_45px_rgba(28,61,32,0.07)] sm:p-8">
              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-[#263A36]"
                  >
                    Email address
                  </label>

                  <div className="flex items-center rounded-lg border border-slate-300 bg-white transition focus-within:border-[#287650] focus-within:ring-2 focus-within:ring-[#287650]/15">
                    <span className="pl-4 text-[#648078]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                        />
                        <path d="m4 7 8 6 8-6" />
                      </svg>
                    </span>

                    <input
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full min-w-0 rounded-lg bg-transparent px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-[#263A36]"
                  >
                    Password
                  </label>

                  <div className="flex items-center rounded-lg border border-slate-300 bg-white transition focus-within:border-[#287650] focus-within:ring-2 focus-within:ring-[#287650]/15">
                    <span className="pl-4 text-[#648078]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <rect
                          x="5"
                          y="10"
                          width="14"
                          height="11"
                          rx="2"
                        />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                        <path d="M12 14v3" />
                      </svg>
                    </span>

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      required
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full min-w-0 rounded-lg bg-transparent px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="mr-3 shrink-0 rounded p-1 text-[#648078] transition hover:text-[#176344] focus:outline-none focus:ring-2 focus:ring-[#287650]/30"
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          className="h-5 w-5"
                          aria-hidden="true"
                        >
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 5.2A11 11 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.2-2.4 3.4" />
                          <path d="M6.2 6.2C3.8 7.7 2.5 10 2 12c1 2.5 4.5 7 10 7 1.3 0 2.5-.3 3.6-.8" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          className="h-5 w-5"
                          aria-hidden="true"
                        >
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-[#176344] transition hover:text-[#10492F] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* Sign in button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#145C3B] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10492F] focus:outline-none focus:ring-4 focus:ring-[#145C3B]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="opacity-25"
                        />
                        <path
                          d="M21 12a9 9 0 0 0-9-9"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="ml-1 h-5 w-5"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Register link */}
              <p className="text-center text-sm leading-6 text-slate-500">
                New to FertiSmart SL?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[#176344] transition hover:text-[#10492F] hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>

            <p className="mt-5 text-center text-xs text-slate-400">
              Smart farming starts with the right decisions.
            </p>
          </section>

          {/* ================= RIGHT: AGRICULTURAL VISUAL ================= */}
          <section className="relative hidden h-[540px] w-full items-center justify-center lg:flex xl:h-[600px]">
            {/* Image container */}
            <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-[#DDEADD]">
              <img
                src="https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1600&q=85"
                alt="Fresh green plants representing sustainable agriculture"
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading="eager"
              />

              {/* Gradient only over image */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#102D1E]/80 via-[#102D1E]/10 to-transparent" />
            </div>

            {/* Nutrient information card */}
            <div className="absolute left-5 top-6 z-10 w-[220px] rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg backdrop-blur-md xl:left-7 xl:top-7">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#548366]">
                Smart soil insights
              </p>

              {[
                ["N", "Nitrogen", "Supports plant growth"],
                ["P", "Phosphorus", "Supports root growth"],
                ["K", "Potassium", "Supports crop health"],
              ].map(([symbol, name, description]) => (
                <div
                  key={symbol}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E5F1E8] text-sm font-bold text-[#176344]">
                    {symbol}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#263A36]">
                      {name}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Image caption */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-7 xl:p-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-2 text-xs font-medium text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#A7E5A5]" />
                Smarter decisions, healthier crops
              </div>

              <h2 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
                Grow better.
                <br />
                Farm smarter.
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-white/90 xl:text-base">
                Make informed fertilizer decisions with soil analysis,
                crop data, and intelligent recommendations designed to
                support sustainable farming.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
