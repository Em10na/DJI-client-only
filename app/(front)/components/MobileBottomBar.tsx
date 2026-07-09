"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CartCount from "./CartCount";

export default function MobileBottomBar() {
  const pathname = usePathname();

  function actif(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    const base = href.split("?")[0];
    return pathname.startsWith(base) && base !== "/";
  }

  return (
    <nav className="bottom-bar" aria-label="Navigation rapide">
      {/* Accueil */}
      <Link href="/" className={`bottom-bar__item${pathname === "/" ? " is-active" : ""}`}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
        </svg>
        <span>Accueil</span>
      </Link>

      {/* Boutique — magasin avec rideau rouge */}
      <Link href="/boutique" className={`bottom-bar__item${actif("/boutique") ? " is-active" : ""}`}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Bâtiment */}
          <path stroke="currentColor" strokeWidth="1.9" d="M4 22V11H20V22" />
          <path stroke="currentColor" strokeWidth="1.9" d="M2 11L12 4l10 7" />
          {/* Porte */}
          <path stroke="currentColor" strokeWidth="1.9" d="M10 22v-5h4v5" />
          {/* Rideau / auvent rouge */}
          <path stroke="#ef4444" strokeWidth="3" fill="none" d="M4 11 Q12 16 20 11" />
        </svg>
        <span>Boutique</span>
      </Link>

      {/* Compte */}
      <Link href="/compte" className={`bottom-bar__item${actif("/compte") ? " is-active" : ""}`}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
        </svg>
        <span>Compte</span>
      </Link>

      {/* Panier */}
      <Link href="/panier" className={`bottom-bar__item bottom-bar__item--cart${actif("/panier") ? " is-active" : ""}`}>
        <span style={{ position: "relative", display: "inline-flex" }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <CartCount />
        </span>
        <span>Panier</span>
      </Link>
    </nav>
  );
}
