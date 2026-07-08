"use client";

import { useRef, useState } from "react";
import { useCart } from "@/lib/cart";

type Props = {
  product: { id: string; title: string; price: number; image_url: string | null; stock: number };
  showQty?: boolean;
};

function flyToCart(source: HTMLElement | null) {
  if (typeof window === "undefined" || !source) return;

  // Pick whichever cart icon is currently visible in the DOM
  const cartIcon = [
    document.querySelector<HTMLElement>(".icon-btn--cart"),
    document.querySelector<HTMLElement>(".bottom-bar__item--cart"),
  ].find((el) => {
    if (!el) return false;
    const s = window.getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden";
  });
  if (!cartIcon) return;

  const sr = source.getBoundingClientRect();
  const tr = cartIcon.getBoundingClientRect();

  const fly = document.createElement("div");
  fly.className = "cart-fly";
  fly.style.left = `${sr.left + sr.width / 2 - 7}px`;
  fly.style.top = `${sr.top + sr.height / 2 - 7}px`;
  document.body.appendChild(fly);

  // Force reflow so the browser registers the start position before transition
  void fly.getBoundingClientRect();

  fly.classList.add("cart-fly--go");
  fly.style.left = `${tr.left + tr.width / 2 - 7}px`;
  fly.style.top = `${tr.top + tr.height / 2 - 7}px`;
  fly.style.opacity = "0";
  fly.style.width = "4px";
  fly.style.height = "4px";

  setTimeout(() => {
    fly.remove();
    cartIcon.classList.add("cart-bounce");
    setTimeout(() => cartIcon.classList.remove("cart-bounce"), 600);
  }, 780);
}

export default function AddToCartButton({ product, showQty = false }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
    flyToCart(btnRef.current);
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
        ref={btnRef}
        className="btn btn--indigo"
        style={{ flex: 1, minWidth: "160px" }}
        onClick={handleAdd}
      >
        {added ? "Ajoute !" : "Ajouter au panier"} &rarr;
      </button>
    </>
  );
}
