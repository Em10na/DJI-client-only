import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProductCard from "./components/ProductCard";
import NewsletterForm from "./components/NewsletterForm";
import DroneCurtain from "./components/DroneCurtain";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: template }, { data: featured }, { data: categories }, { data: trending }, { data: nouveautes }] = await Promise.all([
    supabase.from("templates").select("*").eq("page", "home").single(),
    supabase.from("products").select("*").eq("status", "published").eq("featured", true).limit(5),
    supabase.from("categories").select("*").order("name").limit(6),
    supabase.from("products").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(5),
    supabase.from("products").select("*").eq("status", "published").order("created_at", { ascending: false }).range(5, 9),
  ]);

  return (
    <>
      <DroneCurtain />

      {/* ====== HERO — DRONZA STYLE ====== */}
      <section className="dronza-hero">
        {/* Mini drones d'ambiance */}
        <img src="/front/images/drone-hero.png" alt="" className="real-drone real-drone--1" />
        <img src="/front/images/drone-hero.png" alt="" className="real-drone real-drone--2" />

        {/* Slider arrows */}
        <button className="dronza-hero__arrow dronza-hero__arrow--left" aria-label="Precedent">&#x2039;</button>
        <button className="dronza-hero__arrow dronza-hero__arrow--right" aria-label="Suivant">&#x203A;</button>

        <div className="container dronza-hero__grid">
          {/* Left column — text */}
          <div className="dronza-hero__left">
            <div className="dronza-hero__title-box">
              <h1>{template?.title || "Equipements Tech pour les meilleures performances"}</h1>
            </div>
            <p className="dronza-hero__desc">
              {template?.subtitle || "Decouvrez notre gamme de drones, gadgets et equipements professionnels. Technologie de pointe, livraison rapide et garantie 2 ans sur tous nos produits."}
            </p>
            <Link href="/boutique" className="dronza-hero__cta">
              Explorer la boutique
              <svg width="16" height="12" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <div className="dronza-hero__stats">
              <div className="dronza-hero__stat"><strong>500+</strong><span>Produits</span></div>
              <div className="dronza-hero__stat"><strong>24h</strong><span>Livraison</span></div>
              <div className="dronza-hero__stat"><strong>2 ans</strong><span>Garantie</span></div>
            </div>
          </div>

          {/* Right column — circle + drone */}
          <div className="dronza-hero__right">
            <div className="dronza-hero__circle"></div>
            <div className="dronza-hero__circle-ring"></div>
            <img
              src="/front/images/drone-hero.png"
              alt="Drone Kicksoft"
              className="dronza-hero__drone"
            />
            <div className="dronza-hero__shadow"></div>
          </div>
        </div>

        {/* Gear icon bottom-left */}
        <div className="dronza-hero__gear">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.36-7.36l-1.42 1.42M7.05 16.95l-1.42 1.42m12.73 0l-1.42-1.42M7.05 7.05L5.63 5.63"/></svg>
        </div>
      </section>

      {/* ====== FEATURES BAR ====== */}
      <section className="features-bar">
        <div className="container">
          <div className="features-bar__grid">
            <div className="features-bar__item">
              <div className="features-bar__icon">&#x26A1;</div>
              <div><strong>Livraison Express</strong><span>24-48h partout en Tunisie</span></div>
            </div>
            <div className="features-bar__item">
              <div className="features-bar__icon">&#x21BA;</div>
              <div><strong>Retours Gratuits</strong><span>Sous 30 jours</span></div>
            </div>
            <div className="features-bar__item">
              <div className="features-bar__icon">&#x2605;</div>
              <div><strong>Garantie 2 Ans</strong><span>Sur tous nos produits</span></div>
            </div>
            <div className="features-bar__item">
              <div className="features-bar__icon">&#x1F512;</div>
              <div><strong>Paiement Securise</strong><span>100% protege</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TRENDING PRODUCTS ====== */}
      <section className="section" style={{ paddingTop: "var(--s8)" }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-tag">Tendance</span>
              <h2>Produits populaires</h2>
            </div>
            <Link href="/boutique" className="view-all">
              Voir tout
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
          <div className="products">
            {trending && trending.length > 0 ? (
              trending.map((p) => (
                <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} loyalty_points={p.loyalty_points} badge={p.compare_price && p.compare_price > p.price ? "Promo" : undefined} />
              ))
            ) : (
              <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--fg-mute)" }}>
                Aucun produit pour le moment. <Link href="/admin/produits" style={{ color: "var(--indigo)" }}>Ajoutez-en depuis l&apos;admin</Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ====== PROMO BANNERS ====== */}
      <section className="section" style={{ paddingTop: "0" }}>
        <div className="container">
          <div className="discount-row">
            <article className="discount-card discount-card--watch">
              <span className="meta">CETTE SEMAINE</span>
              <h3>Mega Remises<br /><span className="pct">Jusqu&apos;a -50%</span></h3>
              <Link href="/boutique" className="shop-now">
                Voir les offres
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <img className="product" src="https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&q=80&auto=format&fit=crop" alt="" />
            </article>
            <article className="discount-card discount-card--airpods">
              <span className="meta">EDITION LIMITEE</span>
              <h3>Accessoires Pro<br /><span className="pct">-30%</span></h3>
              <Link href="/boutique" className="shop-now">
                Decouvrir
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <img className="product" src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80&auto=format&fit=crop" alt="" />
            </article>
          </div>
        </div>
      </section>

      {/* ====== CATEGORIES ====== */}
      {categories && categories.length > 0 && (
        <section className="section" style={{ paddingTop: "var(--s5)" }}>
          <div className="container">
            <div className="section-head">
              <div>
                <span className="section-tag">Explorer</span>
                <h2>Parcourir par categorie</h2>
              </div>
              <Link href="/boutique" className="view-all">
                Tous les produits
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
            <div className="cats-grid">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/boutique?categorie=${cat.id}`} className="cat-tile">
                  <div className="pic">
                    <img src={cat.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80&auto=format&fit=crop"} alt={cat.name} />
                  </div>
                  <div className="name">{cat.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== NOUVEAUTES ====== */}
      {nouveautes && nouveautes.length > 0 && (
        <section className="section" style={{ paddingTop: "0" }}>
          <div className="container">
            <div className="section-head">
              <div>
                <span className="section-tag">Nouveau</span>
                <h2>Derniers arrivages</h2>
              </div>
              <Link href="/boutique" className="view-all">
                Plus de produits
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
            <div className="compact-row">
              {nouveautes.map((p) => (
                <article key={p.id} className="compact-card">
                  <div className="pic">
                    <img src={p.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80&auto=format&fit=crop"} alt={p.title} />
                  </div>
                  <div>
                    <div className="stock">EN STOCK - {p.stock}</div>
                    <div className="name">{p.title}</div>
                    <div className="price">{p.price} DT</div>
                    <Link href={`/produit/${p.id}`} className="btn">Commander &rarr;</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== BRAND STRIP ====== */}
      <section className="brands">
        <div className="container">
          <div className="brand-row">
            <span className="brand-logo">Kicksoft</span>
            <span className="brand-logo">TechPro</span>
            <span className="brand-logo">InnoGear</span>
            <span className="brand-logo">SmartDev</span>
            <span className="brand-logo">ProKit</span>
            <span className="brand-logo">NetWare</span>
          </div>
        </div>
      </section>

      {/* ====== CTA PRO ====== */}
      <section className="section">
        <div className="container">
          <div className="discount-row">
            <article className="discount-card discount-card--watch" style={{ flex: 1 }}>
              <span className="meta">PROFESSIONNELS</span>
              <h3>Solutions sur mesure<br /><span className="pct">pour votre entreprise</span></h3>
              <Link href="/solutions" className="shop-now">
                Decouvrir nos solutions
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </article>
            <article className="discount-card discount-card--airpods" style={{ flex: 1 }}>
              <span className="meta">REVENDEURS</span>
              <h3>Devenez partenaire<br /><span className="pct">Kicksoft</span></h3>
              <Link href="/revendeurs" className="shop-now">
                En savoir plus
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ====== NEWSLETTER ====== */}
      <section style={{ background: "var(--paper)" }}>
        <div className="container">
          <div className="newsletter">
            <div className="newsletter-grid">
              <div>
                <h2>Recevez <strong>10% de reduction</strong> sur votre premiere commande</h2>
                <p>Inscrivez-vous a notre newsletter pour recevoir nos offres exclusives, lancements de produits et conseils tech.</p>
              </div>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
