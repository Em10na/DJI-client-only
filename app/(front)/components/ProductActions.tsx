"use client";

import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";
import Link from "next/link";

type Props = {
  product: { id: string; title: string; price: number; image_url: string | null; stock: number };
};

export default function ProductActions({ product }: Props) {
  return (
    <div className="pdp-cta" style={{ marginTop: "var(--s5)", display: "flex", gap: "var(--s3)", flexWrap: "wrap", alignItems: "center" }}>
      <AddToCartButton product={product} showQty />
      <Link href={`/devis?produit=${encodeURIComponent(product.title)}&ref=${product.id.slice(0, 8)}&prix=${product.price}`} className="btn btn--ink">Demander un devis</Link>
      <WishlistButton productId={product.id} className="btn btn--ghost" />
    </div>
  );
}
