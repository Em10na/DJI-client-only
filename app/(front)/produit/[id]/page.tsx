import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "../../components/ProductCard";
import ProductActions from "../../components/ProductActions";
import ProductGallery from "../../components/ProductGallery";
import ReviewForm from "../../components/ReviewForm";

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? "" : "star--empty"}>★</span>
      ))}
    </span>
  );
}

type Props = { params: Promise<{ id: string }> };

export default async function ProduitPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: produit } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("id", id)
    .single();

  if (!produit) notFound();

  const [{ data: similaires }, { data: accessoires }, { data: media }, { data: reviews }] = await Promise.all([
    supabase.from("products").select("*").eq("status", "published").neq("id", id).eq("category_id", produit.category_id || "").limit(5),
    supabase.from("products").select("*").eq("status", "published").neq("id", id).neq("category_id", produit.category_id || "").limit(4),
    supabase.from("product_media").select("*").eq("product_id", id).order("position"),
    supabase.from("reviews").select("id, author_name, rating, comment, sentiment, created_at").eq("product_id", id).order("created_at", { ascending: false }).limit(50),
  ]);

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const onSale = produit.compare_price && produit.compare_price > produit.price;
  const remise = onSale ? Math.round(((produit.compare_price - produit.price) / produit.compare_price) * 100) : 0;

  return (
    <div className="container">
      <div className="crumbs" style={{ paddingTop: "var(--s5)" }}>
        <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span>{" "}
        <Link href="/boutique">Boutique</Link> <span className="sep">&rsaquo;</span>{" "}
        {produit.categories?.name && (
          <><Link href={`/boutique?categorie=${produit.category_id}`}>{produit.categories.name}</Link> <span className="sep">&rsaquo;</span>{" "}</>
        )}
        <span>{produit.title}</span>
      </div>

      <section className="product-detail">
        {/* Gallery */}
        <ProductGallery media={media ?? []} fallbackImage={produit.image_url} productTitle={produit.title} />

        {/* Info */}
        <div className="pdp-info">
          {produit.categories?.name && (
            <span className="pdp-cat">&#x26A1; {produit.categories.name}</span>
          )}
          <h1>{produit.title}</h1>

          <div className="rating-row">
            {reviews && reviews.length > 0 && (
              <>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Stars value={avgRating} />
                  <strong>{avgRating.toFixed(1)}</strong>
                  <span style={{ color: "var(--fg-mute)", fontSize: "var(--text-sm)" }}>({reviews.length} avis)</span>
                </span>
                <span style={{ color: "var(--rule-strong)" }}>|</span>
              </>
            )}
            <span style={{ color: "var(--emerald)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", background: produit.stock > 0 ? "var(--emerald)" : "var(--rose)", borderRadius: "999px", display: "inline-block" }}></span>
              {produit.stock > 0 ? `En stock - ${produit.stock} articles` : "Rupture de stock"}
            </span>
            <span style={{ color: "var(--rule-strong)" }}>|</span>
            <span style={{ fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--fg-mute)" }}>
              REF: {produit.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {produit.short_description && (
            <p className="desc">{produit.short_description}</p>
          )}

          <div className="price-row">
            <span className="now">{produit.price} DT</span>
            {onSale && (
              <>
                <span className="was">{produit.compare_price} DT</span>
                <span className="save">-{remise}%</span>
              </>
            )}
          </div>

          {produit.loyalty_points > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "var(--s3)", padding: "10px 14px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "var(--r)", fontSize: "var(--text-sm)" }}>
              <span style={{ fontSize: "18px" }}>&#x2B50;</span>
              <span>Gagnez <strong style={{ color: "var(--amber)" }}>{produit.loyalty_points} points fidelite</strong> avec cet achat</span>
            </div>
          )}

          <ProductActions product={{ id: produit.id, title: produit.title, price: produit.price, image_url: produit.image_url, stock: produit.stock }} />

          <div className="pdp-features" style={{ marginTop: "var(--s5)" }}>
            <div className="pf"><span className="ic">&#x26A1;</span><span>Livraison gratuite des 50 DT</span></div>
            <div className="pf"><span className="ic">&#x21BA;</span><span>Retours gratuits sous 30 jours</span></div>
            <div className="pf"><span className="ic">&#x2605;</span><span>Garantie 2 ans</span></div>
            <div className="pf"><span className="ic">&#x2713;</span><span>Produit authentique certifie</span></div>
          </div>
        </div>
      </section>

      {/* Specifications + Description */}
      <section className="section" style={{ paddingTop: "0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s8)" }}>
          <div>
            <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s5)" }}>Caracteristiques techniques</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
              <tbody>
                {[
                  ["Reference", produit.id.slice(0, 8).toUpperCase()],
                  ["Categorie", produit.categories?.name || "Non classifie"],
                  ["Prix", `${produit.price} DT`],
                  ["Stock", `${produit.stock} unite(s)`],
                  ["Statut", produit.status === "published" ? "Disponible" : "Non disponible"],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid var(--rule)" }}>
                    <td style={{ padding: "var(--s4) 0", color: "var(--fg-mute)", fontFamily: "var(--ff-mono)", fontSize: "var(--text-xs)", letterSpacing: "0.06em", textTransform: "uppercase", width: "40%" }}>
                      {label}
                    </td>
                    <td style={{ padding: "var(--s4) 0", fontWeight: 600 }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s5)" }}>Description</h2>
            {produit.short_description ? (
              <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)", lineHeight: "1.8" }}>
                {produit.short_description}
              </p>
            ) : (
              <p style={{ color: "var(--fg-mute)", fontStyle: "italic" }}>
                Aucune description disponible pour ce produit.
              </p>
            )}
            <div style={{ marginTop: "var(--s5)", display: "flex", gap: "var(--s3)" }}>
              <Link href="/comparer" className="btn btn--ghost">Comparer ce produit</Link>
              <Link href={`/devis?produit=${encodeURIComponent(produit.title)}&ref=${produit.id.slice(0, 8)}&prix=${produit.price}`} className="btn btn--ghost">Demander un devis</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====== AVIS CLIENTS — feedback, rating & sentiment ====== */}
      <section className="reviews-section">
        <div className="section-head">
          <h2>Avis clients</h2>
        </div>

        {reviews && reviews.length > 0 ? (
          <>
            <div className="reviews-summary">
              <span className="reviews-summary__score">{avgRating.toFixed(1)}</span>
              <div className="reviews-summary__meta">
                <Stars value={avgRating} size={20} />
                <span className="reviews-summary__count">
                  Basé sur {reviews.length} avis client{reviews.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="review-list">
              {reviews.map((r) => (
                <article key={r.id} className="review-card">
                  <div className="review-card__head">
                    <span className="review-card__author">{r.author_name}</span>
                    <Stars value={r.rating} size={13} />
                    <span className="review-card__date">
                      {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <span className={`sentiment-badge sentiment-badge--${r.sentiment}`}>
                      {r.sentiment === "positif" ? "😊 Positif" : r.sentiment === "negatif" ? "😞 Négatif" : "😐 Neutre"}
                    </span>
                  </div>
                  <p className="review-card__comment">{r.comment}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: "var(--fg-mute)" }}>
            Aucun avis pour le moment. Soyez le premier à partager votre expérience !
          </p>
        )}

        <ReviewForm productId={produit.id} />
      </section>

      {/* Accessoires associes */}
      {accessoires && accessoires.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Accessoires associes</h2>
            <Link href="/boutique" className="view-all">Voir tout &rarr;</Link>
          </div>
          <div className="products">
            {accessoires.map((p) => (
              <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} loyalty_points={p.loyalty_points} />
            ))}
          </div>
        </section>
      )}

      {/* Produits similaires */}
      {similaires && similaires.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Produits similaires</h2>
            <Link href="/boutique" className="view-all">Tous les produits &rarr;</Link>
          </div>
          <div className="products">
            {similaires.map((p) => (
              <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} loyalty_points={p.loyalty_points} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
