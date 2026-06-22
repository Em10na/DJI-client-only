"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  productId: string;
  className?: string;
};

export default function WishlistButton({ productId, className = "" }: Props) {
  const supabase = createClient();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (data) setIsFav(true);
    }
    check();
  }, [productId]);

  async function toggle() {
    if (!userId) {
      window.location.href = "/auth/connexion";
      return;
    }
    setLoading(true);
    if (isFav) {
      await supabase.from("wishlist").delete().eq("user_id", userId).eq("product_id", productId);
      setIsFav(false);
    } else {
      await supabase.from("wishlist").insert({ user_id: userId, product_id: productId });
      setIsFav(true);
    }
    setLoading(false);
  }

  return (
    <button
      className={className}
      onClick={toggle}
      disabled={loading}
      aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
      style={{ color: isFav ? "var(--rose)" : undefined }}
    >
      {isFav ? "♥" : "♡"}
    </button>
  );
}
