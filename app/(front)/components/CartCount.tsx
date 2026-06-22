"use client";

import { useCart } from "@/lib/cart";

export default function CartCount() {
  const { count } = useCart();
  if (count === 0) return null;
  return <span className="count">{count}</span>;
}
