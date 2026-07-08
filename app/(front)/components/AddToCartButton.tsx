"use client";

import { useRef, useState } from "react";
import { useCart } from "@/lib/cart";

type Props = {
  product: { id: string; title: string; price: number; image_url: string | null; stock: number };
  showQty?: boolean;
};

function flyToCart(source: HTMLElement | null, imageUrl: string | null) {
  if (typeof window === "undefined" || !source) return;

  const cartIcon = [
    document.querySelector<HTMLElement>(".icon-btn--cart"),
    document.querySelector<HTMLElement>(".bottom-bar__item--cart"),
  ].find((el) => {
    if (!el) return false;
    const s = window.getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden";
  });
  if (!cartIcon) return;

  // Start from the product image if possible, otherwise from the button
  const card = source.closest<HTMLElement>(".product-card");
  const imgEl = card?.querySelector<HTMLImageElement>(".img-wrap img");
  const origin = imgEl ?? source;

  const sr = origin.getBoundingClientRect();
  const tr = cartIcon.getBoundingClientRect();

  const SIZE = 64;
  const sx = sr.left + sr.width  / 2 - SIZE / 2;
  const sy = sr.top  + sr.height / 2 - SIZE / 2;
  const ex = tr.left + tr.width  / 2 - SIZE / 2;
  const ey = tr.top  + tr.height / 2 - SIZE / 2;

  // Arc apex — 160px above the highest of the two points
  const mx = (sx + ex) / 2;
  const my = Math.min(sy, ey) - 160;

  const fly = document.createElement("div");
  fly.className = "cart-fly";

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
    fly.appendChild(img);
  }

  document.body.appendChild(fly);

  // 3-keyframe arc with continuous rotation
  const anim = fly.animate(
    [
      { transform: `translate(${sx}px, ${sy}px) scale(1)    rotate(0deg)`,   opacity: "0.72" },
      { transform: `translate(${mx}px, ${my}px) scale(0.72) rotate(210deg)`, opacity: "0.60", offset: 0.45 },
      { transform: `translate(${ex}px, ${ey}px) scale(0.18) rotate(400deg)`, opacity: "0"    },
    ],
    { duration: 1500, easing: "ease-in-out", fill: "forwards" }
  );

  anim.onfinish = () => {
    fly.remove();
    cartIcon.classList.add("cart-bounce");
    setTimeout(() => cartIcon.classList.remove("cart-bounce"), 750);
  };
}

export default function AddToCartButton({ product, showQty = false }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
    flyToCart(btnRef.current, product.image_url);
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
