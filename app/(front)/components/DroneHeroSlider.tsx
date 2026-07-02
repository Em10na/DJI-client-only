"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SLIDES = [
  {
    bg: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=95&auto=format&fit=crop",
    badge: "Nouveau — 2025",
    name: "Drone\nSérie Pro",
    tagline: "L'air comme terrain de jeu",
    buy: "/boutique",
    more: "/solutions",
  },
  {
    bg: "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=1920&q=95&auto=format&fit=crop",
    badge: "Photo & Vidéo",
    name: "Caméra\nCinématique",
    tagline: "Chaque image, un chef-d'œuvre",
    buy: "/boutique",
    more: "/solutions",
  },
  {
    bg: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=1920&q=95&auto=format&fit=crop",
    badge: "Stabilisation",
    name: "Gimbal\nSérie Master",
    tagline: "Zéro vibration. Résultat parfait.",
    buy: "/boutique",
    more: "/solutions",
  },
  {
    bg: "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=1920&q=95&auto=format&fit=crop",
    badge: "Action Extrême",
    name: "Caméra\nd'Action 4K",
    tagline: "Aucune aventure ne vous résiste",
    buy: "/boutique",
    more: "/solutions",
  },
  {
    bg: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1920&q=95&auto=format&fit=crop",
    badge: "Son Professionnel",
    name: "Audio\nPro Series",
    tagline: "Un son cristallin, une prise parfaite",
    buy: "/boutique",
    more: "/boutique",
  },
];

const DURATION = 8000;

export default function DroneHeroSlider() {
  const [idx, setIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setAnimKey((k) => k + 1);
    setProgress(0);
    if (paused) return;

    const t0 = Date.now();
    const tick = setInterval(() => {
      setProgress(Math.min(((Date.now() - t0) / DURATION) * 100, 100));
    }, 60);

    const next = setTimeout(() => {
      setIdx((i) => (i + 1) % SLIDES.length);
    }, DURATION);

    return () => { clearInterval(tick); clearTimeout(next); };
  }, [idx, paused]);

  const go = (i: number) => { if (i !== idx) setIdx(i); };
  const s = SLIDES[idx];

  return (
    <section
      className="djihero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background stack */}
      {SLIDES.map((sl, i) => (
        <div
          key={i}
          className={`djihero__bg${i === idx ? " djihero__bg--on" : ""}`}
          style={{ backgroundImage: `url(${sl.bg})` }}
        />
      ))}

      {/* Dark overlays */}
      <div className="djihero__vignette" />
      <div className="djihero__grad-bottom" />

      {/* Centered content */}
      <div key={animKey} className="djihero__center">
        <p className="djihero__badge">{s.badge}</p>
        <h1 className="djihero__name">
          {s.name.split("\n").map((l, i) => <span key={i}>{l}<br /></span>)}
        </h1>
        <p className="djihero__tagline">{s.tagline}</p>
        <div className="djihero__ctas">
          <Link href={s.buy} className="djihero__btn djihero__btn--white">Acheter</Link>
          <Link href={s.more} className="djihero__btn djihero__btn--ghost">
            En savoir plus
            <svg width="13" height="9" viewBox="0 0 14 10" fill="none">
              <path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Arrows */}
      <button
        className="djihero__arrow djihero__arrow--l"
        onClick={() => go((idx - 1 + SLIDES.length) % SLIDES.length)}
        aria-label="Précédent"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        className="djihero__arrow djihero__arrow--r"
        onClick={() => go((idx + 1) % SLIDES.length)}
        aria-label="Suivant"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Bottom bar: counter + progress lines */}
      <div className="djihero__foot">
        <span className="djihero__count">
          <strong>0{idx + 1}</strong> / 0{SLIDES.length}
        </span>
        <div className="djihero__lines">
          {SLIDES.map((_, i) => (
            <button key={i} className="djihero__line" onClick={() => go(i)} aria-label={`Slide ${i + 1}`}>
              <span
                className="djihero__line-fill"
                style={{ width: i === idx ? `${progress}%` : i < idx ? "100%" : "0%" }}
              />
            </button>
          ))}
        </div>
        <div className="djihero__scroll-hint">
          <span />
        </div>
      </div>
    </section>
  );
}
