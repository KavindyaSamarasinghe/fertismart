import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./en.json";
import si from "./si.json";
import ta from "./ta.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      si: { translation: si },
      ta: { translation: ta },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "si", "ta"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "fertismart_lang",
    },
  });

// Keep <html lang="..."> in sync (helps fonts and screen readers)
const setHtmlLang = (lng) => {
  document.documentElement.lang = (lng || "en").slice(0, 2);
};
setHtmlLang(i18n.language);
i18n.on("languageChanged", setHtmlLang);

export default i18n;