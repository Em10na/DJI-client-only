"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Bulles de catégories : défilement automatique (marquee) + scroll
// manuel (glissement tactile / molette) + flèches gauche-droite.

type Item = { label: string; href: string; img: string };

export default function CategoryStrip({ items, marquee }: { items: Item[]; marquee: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const [canScroll, setCanScroll] = useState(false);

  // En mode marquee la liste est doublée pour boucler sans à-coup
  const list = marquee ? [...items, ...items] : items;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => setCanScroll(el.scrollWidth > el.clientWidth + 4);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [items.length, marquee]);

  // Défilement automatique — en pause au survol ou pendant une manipulation
  useEffect(() => {
    if (!marquee) return;
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      if (!paused.current) {
        el.scrollLeft += 0.6;
        const moitie = el.scrollWidth / 2;
        if (el.scrollLeft >= moitie) el.scrollLeft -= moitie;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [marquee]);

  function defiler(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    paused.current = true;
    el.scrollBy({ left: dir * 340, behavior: "smooth" });
    setTimeout(() => { paused.current = false; }, 1400);
  }

  return (
    <section
      className="circle-strip"
      aria-label="Catégories"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      onTouchStart={() => { paused.current = true; }}
      onTouchEnd={() => { setTimeout(() => { paused.current = false; }, 2500); }}
    >
      {canScroll && (
        <button className="circle-strip__arrow circle-strip__arrow--l" onClick={() => defiler(-1)} aria-label="Catégories précédentes">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      <div
        ref={trackRef}
        className={`circle-strip__track circle-strip__track--scroll${marquee ? "" : " circle-strip__track--static"}`}
      >
        {list.map((c, i) => (
          <Link key={`${c.label}-${i}`} href={c.href} className="circle-item">
            <span className="circle-item__pic">
              <img src={c.img} alt={c.label} loading="lazy" />
            </span>
            <span className="circle-item__label">{c.label}</span>
          </Link>
        ))}
      </div>

      {canScroll && (
        <button className="circle-strip__arrow circle-strip__arrow--r" onClick={() => defiler(1)} aria-label="Catégories suivantes">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </section>
  );
}
