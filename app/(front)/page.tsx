import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProductCard from "./components/ProductCard";
import DroneHeroSlider from "./components/DroneHeroSlider";
import ScrollReveal from "./components/ScrollReveal";

// Circle category strip items (djistores.ae style marquee)
const CIRCLE_CATS = [
  { label: "Drones Pro", href: "/boutique?q=drone", img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=300&q=80&auto=format&fit=crop" },
  { label: "Caméras", href: "/boutique?q=camera", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&q=80&auto=format&fit=crop" },
  { label: "Action 4K", href: "/boutique?q=action", img: "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=300&q=80&auto=format&fit=crop" },
  { label: "Gimbals", href: "/boutique?q=gimbal", img: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=300&q=80&auto=format&fit=crop" },
  { label: "Audio Pro", href: "/boutique?q=audio", img: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&q=80&auto=format&fit=crop" },
  { label: "Batteries", href: "/boutique?q=batterie", img: "https://images.unsplash.com/photo-1619641805634-b867f535071c?w=300&q=80&auto=format&fit=crop" },
  { label: "Éclairage", href: "/boutique?q=eclairage", img: "https://images.unsplash.com/photo-1519558260268-cde7e03a0152?w=300&q=80&auto=format&fit=crop" },
  { label: "Sacs & Étuis", href: "/boutique?q=sac", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80&auto=format&fit=crop" },
];

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: template }, { data: featured }, { data: categories }, { data: whatsNew }, { data: handheld }] = await Promise.all([
    supabase.from("templates").select("*").eq("page", "home").single(),
    supabase.from("products").select("*").eq("status", "published").eq("featured", true).limit(4),
    supabase.from("categories").select("*").order("name").limit(6),
    supabase.from("products").select("*").eq("status", "published").order("display_order", { ascending: true }).order("created_at", { ascending: false }).limit(8),
    supabase.from("products").select("*").eq("status", "published").order("display_order", { ascending: true }).order("created_at", { ascending: false }).range(8, 11),
  ]);

  return (
    <>
      {/* ====== HERO — BANNER CAROUSEL ====== */}
      <DroneHeroSlider />

      {/* ====== PROMO TILES (2-col banner grid, djistores style) ====== */}
      <section className="promo-tiles">
        <div className="container">
          <div className="promo-tiles__grid">
            <Link href="/boutique?q=camera" className="promo-tile">
              <div className="promo-tile__bg" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&q=85&auto=format&fit=crop)" }} />
              <div className="promo-tile__content">
                <p className="promo-tile__tagline">Tout-en-Un</p>
                <h2 className="promo-tile__name">Caméra 360 Pro</h2>
                <span className="promo-tile__cta">Acheter</span>
              </div>
            </Link>
            <Link href="/boutique?q=gimbal" className="promo-tile">
              <div className="promo-tile__bg" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=1000&q=85&auto=format&fit=crop)" }} />
              <div className="promo-tile__content">
                <p className="promo-tile__tagline">Des merveilles dans votre paume</p>
                <h2 className="promo-tile__name">Gimbal Mobile 8</h2>
                <span className="promo-tile__cta">Acheter</span>
              </div>
            </Link>
            <Link href="/boutique?q=audio" className="promo-tile">
              <div className="promo-tile__bg" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1000&q=85&auto=format&fit=crop)" }} />
              <div className="promo-tile__content">
                <p className="promo-tile__tagline">Plus qu&apos;un son</p>
                <h2 className="promo-tile__name">Micro Sans Fil Mini</h2>
                <span className="promo-tile__cta">Acheter</span>
              </div>
            </Link>
            <Link href="/boutique?q=drone" className="promo-tile">
              <div className="promo-tile__bg" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1000&q=85&auto=format&fit=crop)" }} />
              <div className="promo-tile__content">
                <p className="promo-tile__tagline">Au-dessus de tout, voyez tout</p>
                <h2 className="promo-tile__name">Drone Avata 360</h2>
                <span className="promo-tile__cta">Acheter</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ====== CIRCLE CATEGORY STRIP (auto-scrolling marquee) ====== */}
      <section className="circle-strip" aria-label="Catégories">
        <div className="circle-strip__track">
          {[...CIRCLE_CATS, ...CIRCLE_CATS].map(({ label, href, img }, i) => (
            <Link key={`${label}-${i}`} href={href} className="circle-item">
              <span className="circle-item__pic">
                <img src={img} alt={label} loading="lazy" />
              </span>
              <span className="circle-item__label">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ====== WHAT'S NEW ====== */}
      <section className="section" style={{ paddingTop: "var(--s5)" }}>
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="section-head">
              <div>
                <span className="section-tag">Nouveau</span>
                <h2>Quoi de neuf</h2>
              </div>
              <Link href="/boutique" className="view-all">
                Voir tout
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100} className="stagger">
            <div className="products products--4">
              {whatsNew && whatsNew.length > 0 ? (
                whatsNew.map((p) => (
                  <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} loyalty_points={p.loyalty_points} badge={p.compare_price && p.compare_price > p.price ? "Promo" : undefined} />
                ))
              ) : (
                <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--fg-mute)" }}>
                  Aucun produit pour le moment. <Link href="/admin/produits" style={{ color: "var(--indigo)" }}>Ajoutez-en depuis l&apos;admin</Link>
                </p>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ====== SERIES: CAMERAS (video banner + 4 products) ====== */}
      <section className="series-section">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <h2 className="series-section__label">Caméras Professionnelles</h2>
            <div className="series-banner">
              <video
                className="series-banner__video"
                autoPlay
                muted
                loop
                playsInline
                poster="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1600&q=85&auto=format&fit=crop"
              >
                <source src="https://videos.pexels.com/video-files/2890196/2890196-hd_1920_1080_30fps.mp4" type="video/mp4" />
              </video>
              <div className="series-banner__content">
                <h3 className="series-banner__name">Caméra Cinéma Pro</h3>
                <p className="series-banner__tagline">Filmez comme un professionnel</p>
                <Link href="/boutique?q=camera" className="series-banner__btn">
                  Acheter
                  <svg width="12" height="9" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </div>
            </div>
          </ScrollReveal>
          {featured && featured.length > 0 && (
            <ScrollReveal animation="fade-up" delay={100} className="stagger">
              <div className="series-products">
                {featured.map((p) => (
                  <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} loyalty_points={p.loyalty_points} badge={p.compare_price && p.compare_price > p.price ? "Promo" : undefined} />
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* ====== PRODUCT VIDEO SHOWCASE (banner size) ====== */}
      <section className="series-section">
        <div className="container">
          <div className="pvid pvid--banner">
        <video
          className="pvid__video"
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=80&auto=format&fit=crop"
        >
          <source src="/front/videos/dji-product.mp4" type="video/mp4" />
        </video>

        <div className="pvid__overlay" />

        <div className="pvid__content">
          <p className="pvid__badge">Produit en Vedette</p>
          <h2 className="pvid__title">DJI<br /><span className="pvid__thin">Série Professionnelle</span></h2>
          <p className="pvid__desc">
            Précision, autonomie et performance. La référence mondiale de la capture aérienne.
          </p>
          <div className="pvid__specs">
            <div className="pvid__spec"><strong>4K</strong><span>Ultra HD</span></div>
            <div className="pvid__sep" />
            <div className="pvid__spec"><strong>45 min</strong><span>Autonomie</span></div>
            <div className="pvid__sep" />
            <div className="pvid__spec"><strong>15 km</strong><span>Portée</span></div>
            <div className="pvid__sep" />
            <div className="pvid__spec"><strong>GPS</strong><span>Précision</span></div>
          </div>
          <div className="pvid__ctas">
            <Link href="/boutique" className="pvid__btn pvid__btn--white">
              Acheter maintenant
            </Link>
          </div>
        </div>
          </div>
        </div>
      </section>

      {/* ====== SERIES: HANDHELD — VLOGGING (banner + 4 products) ====== */}
      <section className="series-section">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <h2 className="series-section__label">Prise en Main · Vlogging Quotidien</h2>
            <div className="series-banner">
              <div className="series-banner__bg" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=1600&q=85&auto=format&fit=crop)" }} />
              <div className="series-banner__content">
                <h3 className="series-banner__name">Caméra d&apos;Action 6 Pro</h3>
                <p className="series-banner__tagline">La caméra d&apos;action à la qualité d&apos;image révolutionnaire</p>
                <Link href="/boutique?q=action" className="series-banner__btn">
                  Acheter
                  <svg width="12" height="9" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </div>
            </div>
          </ScrollReveal>
          {handheld && handheld.length > 0 && (
            <ScrollReveal animation="fade-up" delay={100} className="stagger">
              <div className="series-products">
                {handheld.map((p) => (
                  <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} loyalty_points={p.loyalty_points} badge={p.compare_price && p.compare_price > p.price ? "Promo" : undefined} />
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* ====== SHOP OUR SELECTIONS (categories) ====== */}
      {categories && categories.length > 0 && (
        <section className="section" style={{ paddingTop: "var(--s5)" }}>
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="section-head">
                <div>
                  <span className="section-tag">Explorer</span>
                  <h2>Nos Sélections</h2>
                </div>
                <Link href="/boutique" className="view-all">
                  Tous les produits
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={100} className="stagger">
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
            </ScrollReveal>
          </div>
        </section>
      )}

    </>
  );
}
