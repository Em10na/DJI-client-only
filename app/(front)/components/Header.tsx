import Link from "next/link";
import CartCount from "./CartCount";
import NotificationBell from "./NotificationBell";
import SideMenu from "./SideMenu";
import HeaderSearch from "./HeaderSearch";

export default function Header() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="site-header site-header--compact">
        <div className="container">
          <SideMenu />

          <Link href="/" className="brand" aria-label="DJI Store TN — Accueil">
            <img src="/assets/images/logos/logo-store.png" alt="DJI Store TN" className="brand-logo" />
          </Link>

          <HeaderSearch />

          <div className="icon-row">
            <NotificationBell />
            <Link href="/compte" className="icon-btn header-icon--desktop" aria-label="Mon compte">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
              </svg>
            </Link>
            <Link href="/panier" className="icon-btn icon-btn--cart header-icon--desktop" aria-label="Panier">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <CartCount />
            </Link>
          </div>
        </div>

        <nav className="main-nav main-nav--header" aria-label="Primary">
          <Link href="/">Accueil</Link>
          <Link href="/boutique">Boutique</Link>
          <Link href="/a-propos">A propos</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </header>
    </>
  );
}
