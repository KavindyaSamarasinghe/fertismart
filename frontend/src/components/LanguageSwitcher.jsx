import React from "react";
import { useTranslation } from "react-i18next";

const LANGS = [
  ["en", "English"],
  ["si", "සිංහල"],
  ["ta", "தமிழ்"],
];

export default function LanguageSwitcher({ dark = false }) {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex rounded-lg border p-1 ${
        dark ? "border-white/20 bg-white/10" : "border-slate-200 bg-white"
      }`}
    >
      {LANGS.map(([code, label]) => {
        const active = current === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => i18n.changeLanguage(code)}
            aria-pressed={active}
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-[#1C3D20] text-white"
                : dark
                ? "text-white/70 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}