"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";

type Props = {
  product: { id: string; title: string; price: number; image_url: string | null; stock: number };
  showQty?: boolean;
};

export default function AddToCartButton({ product, showQty = false }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (product.stock <= 0) {
    return <button className="btn btn--ghost" disabled style={{ flex: 1, opacity: 0.5 }}>Rupture de stock</button>;
  }

  return (
    <>
      {showQty && (
        <div className="qty">
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Diminuer">&#x2212;</button>
          <input type="text" value={qty} readOnly inputMode="numeric" aria-label="Quantite" />
          <button type="button" onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Augmenter">+</button>
        </div>
      )}
      <button
        className="btn btn--indigo"
        style={{ flex: 1, minWidth: "160px" }}
        onClick={handleAdd}
      >
        {added ? "Ajoute !" : "Ajouter au panier"} &rarr;
      </button>
    </>
  );
}
