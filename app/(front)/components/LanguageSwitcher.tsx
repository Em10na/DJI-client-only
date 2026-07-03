"use client";

import { useEffect, useState } from "react";

// ================================================================
// Language switcher — full-site translation via Google Translate
// FR (original) / EN / AR. Sets the googtrans cookie then reloads;
// the hidden Google widget translates every page automatically.
// ================================================================

const LANGS = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "ar", label: "ع" },
] as const;

type LangCode = (typeof LANGS)[number]["code"];

function getCurrentLang(): LangCode {
  const m = document.cookie.match(/googtrans=\/fr\/(\w+)/);
  if (m && (m[1] === "en" || m[1] === "ar")) return m[1];
  return "fr";
}

function clearCookie(name: string) {
  const past = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `${name}=; path=/; expires=${past}`;
  document.cookie = `${name}=; domain=${location.hostname}; path=/; expires=${past}`;
  document.cookie = `${name}=; domain=.${location.hostname}; path=/; expires=${past}`;
}

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState<LangCode>("fr");

  useEffect(() => {
    setCurrent(getCurrentLang());

    // Inject the hidden Google Translate widget (only if a translation is active
    // or will be — cheap enough to always load once)
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const w = window as any;
    if (!w.googleTranslateElementInit) {
      w.googleTranslateElementInit = () => {
        new w.google.translate.TranslateElement(
          { pageLanguage: "fr", autoDisplay: false },
          "google_translate_element"
        );
      };
      const s = document.createElement("script");
      s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  function switchTo(lang: LangCode) {
    if (lang === current) return;

    if (lang === "fr") {
      clearCookie("googtrans");
    } else {
      document.cookie = `googtrans=/fr/${lang}; path=/`;
      document.cookie = `googtrans=/fr/${lang}; domain=${location.hostname}; path=/`;
    }
    location.reload();
  }

  return (
    <>
      {/* Hidden container required by the Google widget */}
      <div id="google_translate_element" style={{ display: "none" }} />

      <span className="lang-switcher" aria-label="Choisir la langue">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {LANGS.map((l) => (
          <button
            key={l.code}
            className={`lang-switcher__btn ${current === l.code ? "is-active" : ""}`}
            onClick={() => switchTo(l.code)}
            aria-label={`Langue ${l.label}`}
          >
            {l.label}
          </button>
        ))}
      </span>
    </>
  );
}
