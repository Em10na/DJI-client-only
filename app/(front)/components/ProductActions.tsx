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
      <Link href="/devis" className="btn btn--ink">Demander un devis</Link>
      <WishlistButton productId={product.id} className="btn btn--ghost" />
    </div>
  );
}
