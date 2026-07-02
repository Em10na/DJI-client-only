"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If the customer is logged in, auto-fill their name from the profile
  useEffect(() => {
    const supabase = createClient();

    /** Turn "emna.omri@esprit.tn" or "emna_omri" into "Emna Omri" */
    function toDisplayName(raw: string): string {
      let n = raw.trim();
      if (n.includes("@")) n = n.split("@")[0]; // strip email domain
      n = n.replace(/[._-]+/g, " ").replace(/\d+/g, "").trim();
      return n
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }

    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          const raw =
            profile?.full_name?.trim() ||
            (user.user_metadata?.full_name as string | undefined)?.trim() ||
            user.email ||
            "";

          const fullName = toDisplayName(raw);
          if (fullName) {
            setName(fullName);
            setIsLoggedIn(true);
          }
        }
      } catch {
        // not logged in — fall back to manual input
      } finally {
        setCheckingAuth(false);
      }
    }
    loadUser();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (rating === 0) {
      setError("Veuillez choisir une note en cliquant sur les étoiles.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          author_name: name,
          rating,
          comment,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        return;
      }

      setSuccess(true);
      if (!isLoggedIn) setName("");
      setRating(0);
      setComment("");
      router.refresh(); // reload server-fetched review list
    } catch {
      setError("Impossible d'envoyer votre avis. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <h3>Laisser un avis</h3>

      <div className="review-form__row">
        {isLoggedIn ? (
          <div className="review-form__user">
            <span className="review-form__user-avatar">
              {name.charAt(0).toUpperCase()}
            </span>
            <strong>{name}</strong>
          </div>
        ) : (
          <input
            type="text"
            placeholder={checkingAuth ? "Chargement..." : "Votre nom complet"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            disabled={checkingAuth}
            required
          />
        )}
        <div className="star-picker" role="radiogroup" aria-label="Note sur 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={(hover || rating) >= n ? "is-active" : ""}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <textarea
        placeholder="Partagez votre expérience avec ce produit..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
        required
      />

      <div style={{ marginTop: "var(--s4)" }}>
        <button type="submit" className="btn btn--indigo" disabled={loading || checkingAuth}>
          {loading ? "Envoi en cours..." : "Publier mon avis"}
        </button>
      </div>

      {error && <p className="review-form__error">{error}</p>}
      {success && <p className="review-form__success">Merci ! Votre avis a été publié.</p>}
    </form>
  );
}
