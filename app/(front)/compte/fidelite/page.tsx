"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Reward = { id: string; name: string; description: string | null; points_required: number; reward_type: string; reduction_value: number | null };
type Transaction = { id: string; points: number; type: string; description: string | null; created_at: string };

export default function FidelitePage() {
  const supabase = createClient();
  const [balance, setBalance] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: txns }, { data: rw }] = await Promise.all([
        supabase.from("loyalty_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("loyalty_rewards").select("*").eq("active", true).order("points_required"),
      ]);

      const pts = (txns ?? []).reduce((s: number, t: { points: number }) => s + t.points, 0);
      setBalance(pts);
      setTransactions(txns ?? []);
      setRewards(rw ?? []);
      setLoading(false);
    }
    charger();
  }, []);

  async function echangerCadeau(reward: Reward) {
    if (!userId) return;
    if (balance < reward.points_required) return;
    if (!confirm(`Echanger ${reward.points_required} points contre "${reward.name}" ?`)) return;

    const { error } = await supabase.from("loyalty_transactions").insert({
      user_id: userId,
      points: -reward.points_required,
      type: "redeem_gift",
      description: `Cadeau echange : ${reward.name}`,
      reward_id: reward.id,
    });

    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "error" });
    } else {
      setBalance(balance - reward.points_required);
      setTransactions([{
        id: crypto.randomUUID(), points: -reward.points_required,
        type: "redeem_gift", description: `Cadeau echange : ${reward.name}`,
        created_at: new Date().toISOString(),
      }, ...transactions]);
      setAlert({ message: `"${reward.name}" echange avec succes ! Contactez-nous pour la livraison.`, type: "success" });
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 5000);
  }

  const TYPE_LABELS: Record<string, string> = {
    earn: "Gagne", redeem_reduction: "Reduction", redeem_gift: "Cadeau", admin_adjust: "Ajustement",
  };

  if (loading) return <p style={{ color: "var(--fg-mute)" }}>Chargement...</p>;

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s5)" }}>Programme de fidelite</h2>

      {alert.message && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--r)", marginBottom: "var(--s5)", fontSize: "var(--text-sm)", background: alert.type === "success" ? "#f0fdf4" : "#fef2f2", color: alert.type === "success" ? "#16a34a" : "#dc2626", border: `1px solid ${alert.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {alert.message}
        </div>
      )}

      {/* Solde */}
      <div style={{ padding: "var(--s7)", background: "linear-gradient(135deg, #fff7ed, #fef3c7)", border: "1px solid #fed7aa", borderRadius: "var(--r-lg)", textAlign: "center", marginBottom: "var(--s7)" }}>
        <div style={{ fontSize: "11px", fontFamily: "var(--ff-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "#92400e", marginBottom: "var(--s2)" }}>Votre solde</div>
        <div style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 800, color: "#d97706", lineHeight: 1 }}>{balance}</div>
        <div style={{ fontSize: "var(--text-md)", color: "#92400e", marginTop: "var(--s2)" }}>points fidelite</div>
      </div>

      {/* Recompenses disponibles */}
      <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--s4)" }}>Recompenses disponibles</h3>
      {rewards.length === 0 ? (
        <p style={{ color: "var(--fg-mute)", marginBottom: "var(--s6)" }}>Aucune recompense disponible pour le moment.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--s4)", marginBottom: "var(--s7)" }}>
          {rewards.map((r) => {
            const canRedeem = balance >= r.points_required;
            return (
              <div key={r.id} style={{ padding: "var(--s5)", background: "var(--paper)", border: `1px solid ${canRedeem ? "#fed7aa" : "var(--rule)"}`, borderRadius: "var(--r)", opacity: canRedeem ? 1 : 0.6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s2)" }}>
                  <span style={{ fontSize: "20px" }}>{r.reward_type === "reduction" ? "💰" : "🎁"}</span>
                  <span style={{ fontFamily: "var(--ff-mono)", fontSize: "var(--text-xs)", padding: "2px 8px", borderRadius: "999px", background: r.reward_type === "reduction" ? "#fef3c7" : "#dbeafe", color: r.reward_type === "reduction" ? "#92400e" : "#1e40af" }}>
                    {r.reward_type === "reduction" ? "Reduction" : "Cadeau"}
                  </span>
                </div>
                <h4 style={{ fontWeight: 700, fontSize: "var(--text-base)", marginBottom: "var(--s1)" }}>{r.name}</h4>
                {r.description && <p style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)", marginBottom: "var(--s3)" }}>{r.description}</p>}
                <div style={{ fontFamily: "var(--ff-display)", fontWeight: 800, fontSize: "var(--text-lg)", color: canRedeem ? "#d97706" : "var(--fg-mute)", marginBottom: "var(--s3)" }}>
                  {r.points_required} pts
                </div>
                {r.reward_type === "gift" && (
                  <button
                    onClick={() => echangerCadeau(r)}
                    disabled={!canRedeem}
                    style={{ width: "100%", padding: "10px", background: canRedeem ? "var(--indigo)" : "var(--bg-deep)", color: canRedeem ? "#fff" : "var(--fg-mute)", border: "none", borderRadius: "var(--r)", fontWeight: 600, fontSize: "var(--text-sm)", cursor: canRedeem ? "pointer" : "not-allowed" }}
                  >
                    {canRedeem ? "Echanger" : `${r.points_required - balance} pts manquants`}
                  </button>
                )}
                {r.reward_type === "reduction" && (
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)", textAlign: "center" }}>
                    {canRedeem ? "Utilisable au checkout" : `${r.points_required - balance} pts manquants`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Historique */}
      <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--s4)" }}>Historique des points</h3>
      {transactions.length === 0 ? (
        <p style={{ color: "var(--fg-mute)" }}>Aucune transaction pour le moment. Achetez des produits pour gagner des points !</p>
      ) : (
        <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)", overflow: "hidden" }}>
          {transactions.map((t, i) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--s4)", borderBottom: i < transactions.length - 1 ? "1px solid var(--rule)" : "none" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{t.description || TYPE_LABELS[t.type] || t.type}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)" }}>{new Date(t.created_at).toLocaleDateString("fr-FR")} — {TYPE_LABELS[t.type] || t.type}</div>
              </div>
              <div style={{ fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: "var(--text-md)", color: t.points > 0 ? "#16a34a" : "#dc2626" }}>
                {t.points > 0 ? "+" : ""}{t.points}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
