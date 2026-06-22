"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Reward = { id: string; name: string; description: string | null; points_required: number; reward_type: string; reduction_value: number | null; active: boolean; created_at: string };
type Transaction = { id: string; user_id: string; order_id: string | null; points: number; type: string; description: string | null; created_at: string; profiles?: { full_name: string } | null };
type UserBalance = { user_id: string; full_name: string; balance: number };

export default function FidelitePage() {
  const supabase = createClient();
  const [onglet, setOnglet] = useState<"rewards" | "users" | "history">("rewards");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", description: "", points_required: "", reward_type: "gift", reduction_value: "", active: true });
  const [adjustForm, setAdjustForm] = useState({ user_id: "", points: "", description: "" });
  const [profiles, setProfiles] = useState<{ id: string; full_name: string }[]>([]);

  async function chargerRewards() { const { data } = await supabase.from("loyalty_rewards").select("*").order("points_required"); setRewards(data ?? []); }
  async function chargerTransactions() { const { data } = await supabase.from("loyalty_transactions").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(100); setTransactions(data ?? []); }
  async function chargerBalances() {
    const { data: txns } = await supabase.from("loyalty_transactions").select("user_id, points, profiles(full_name)");
    const map = new Map<string, UserBalance>();
    (txns ?? []).forEach((t: Record<string, unknown>) => {
      const uid = t.user_id as string;
      const pts = t.points as number;
      const prof = t.profiles as { full_name: string } | { full_name: string }[] | null;
      const name = Array.isArray(prof) ? prof[0]?.full_name : prof?.full_name;
      const existing = map.get(uid);
      if (existing) { existing.balance += pts; }
      else { map.set(uid, { user_id: uid, full_name: name ?? "Inconnu", balance: pts }); }
    });
    setBalances(Array.from(map.values()).sort((a, b) => b.balance - a.balance));
  }
  async function chargerProfiles() { const { data } = await supabase.from("profiles").select("id, full_name"); setProfiles(data ?? []); }

  useEffect(() => { Promise.all([chargerRewards(), chargerTransactions(), chargerBalances(), chargerProfiles()]).then(() => setLoading(false)); }, []);

  function ouvrirAjoutReward() {
    setEditId(null); setErreurs({});
    setForm({ name: "", description: "", points_required: "", reward_type: "gift", reduction_value: "", active: true });
    setShowModal(true);
  }
  function ouvrirEditionReward(r: Reward) {
    setEditId(r.id); setErreurs({});
    setForm({ name: r.name, description: r.description ?? "", points_required: String(r.points_required), reward_type: r.reward_type, reduction_value: String(r.reduction_value ?? ""), active: r.active });
    setShowModal(true);
  }

  function validerReward(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Le nom est obligatoire.";
    if (!form.points_required || isNaN(Number(form.points_required)) || Number(form.points_required) <= 0) e.points_required = "Points requis invalides.";
    if (form.reward_type === "reduction" && (!form.reduction_value || isNaN(Number(form.reduction_value)) || Number(form.reduction_value) <= 0)) e.reduction_value = "Valeur de reduction invalide.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function sauvegarderReward() {
    if (!validerReward()) return;
    const payload = {
      name: form.name.trim(), description: form.description.trim() || null,
      points_required: parseInt(form.points_required), reward_type: form.reward_type,
      reduction_value: form.reward_type === "reduction" ? parseFloat(form.reduction_value) : null,
      active: form.active,
    };
    if (editId) {
      const { error } = await supabase.from("loyalty_rewards").update(payload).eq("id", editId);
      if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); return; }
      setAlert({ message: "Recompense mise a jour !", type: "success" });
    } else {
      const { error } = await supabase.from("loyalty_rewards").insert(payload);
      if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); return; }
      setAlert({ message: "Recompense ajoutee !", type: "success" });
    }
    setShowModal(false); chargerRewards();
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function supprimerReward(id: string) {
    if (!confirm("Confirmer la suppression ?")) return;
    await supabase.from("loyalty_rewards").delete().eq("id", id);
    setAlert({ message: "Recompense supprimee.", type: "success" }); chargerRewards();
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function ajusterPoints() {
    if (!adjustForm.user_id || !adjustForm.points || isNaN(Number(adjustForm.points))) return;
    const { error } = await supabase.from("loyalty_transactions").insert({
      user_id: adjustForm.user_id,
      points: parseInt(adjustForm.points),
      type: "admin_adjust",
      description: adjustForm.description.trim() || "Ajustement admin",
    });
    if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); return; }
    setAlert({ message: "Points ajustes avec succes !", type: "success" });
    setShowAdjustModal(false); setAdjustForm({ user_id: "", points: "", description: "" });
    chargerBalances(); chargerTransactions();
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  const TYPE_LABELS: Record<string, { label: string; classe: string }> = {
    earn: { label: "Gagne", classe: "bg-success" },
    redeem_reduction: { label: "Reduction", classe: "bg-warning text-dark" },
    redeem_gift: { label: "Cadeau", classe: "bg-info text-white" },
    admin_adjust: { label: "Ajustement", classe: "bg-secondary" },
  };

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1"><i className="ti ti-star text-warning me-2"></i>Programme de fidelite</h5>
          <p className="mb-0 text-muted">Gerez les recompenses, soldes et transactions</p>
        </div>
        {onglet === "rewards" && (
          <button className="btn btn-primary" onClick={ouvrirAjoutReward}><i className="ti ti-plus me-1"></i> Ajouter une recompense</button>
        )}
        {onglet === "users" && (
          <button className="btn btn-primary" onClick={() => { setAdjustForm({ user_id: "", points: "", description: "" }); setShowAdjustModal(true); }}><i className="ti ti-plus me-1"></i> Ajuster des points</button>
        )}
      </div>

      {alert.message && <div className={`alert alert-${alert.type} mb-4`}>{alert.message}</div>}

      <ul className="nav nav-tabs mb-0">
        <li className="nav-item"><button className={`nav-link ${onglet === "rewards" ? "active" : ""}`} onClick={() => setOnglet("rewards")}><i className="ti ti-gift me-1"></i> Recompenses <span className="badge bg-light-primary text-primary ms-1">{rewards.length}</span></button></li>
        <li className="nav-item"><button className={`nav-link ${onglet === "users" ? "active" : ""}`} onClick={() => setOnglet("users")}><i className="ti ti-users me-1"></i> Soldes utilisateurs <span className="badge bg-light-primary text-primary ms-1">{balances.length}</span></button></li>
        <li className="nav-item"><button className={`nav-link ${onglet === "history" ? "active" : ""}`} onClick={() => setOnglet("history")}><i className="ti ti-list me-1"></i> Historique <span className="badge bg-light-primary text-primary ms-1">{transactions.length}</span></button></li>
      </ul>

      <div className="card" style={{ borderTopLeftRadius: 0 }}>
        <div className="card-body">
          {loading ? <p className="text-center text-muted">Chargement...</p> : (
            <>
              {/* ONGLET RECOMPENSES */}
              {onglet === "rewards" && (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead><tr><th>Nom</th><th>Type</th><th>Points requis</th><th>Valeur</th><th>Statut</th><th className="text-end">Actions</th></tr></thead>
                    <tbody>
                      {rewards.length === 0 ? <tr><td colSpan={6} className="text-center text-muted py-4">Aucune recompense — <button className="btn btn-link p-0" onClick={ouvrirAjoutReward}>Ajouter</button></td></tr> : rewards.map((r) => (
                        <tr key={r.id}>
                          <td><h6 className="fw-semibold mb-0">{r.name}</h6><small className="text-muted">{r.description}</small></td>
                          <td><span className={`badge ${r.reward_type === "reduction" ? "bg-warning text-dark" : "bg-info text-white"}`}>{r.reward_type === "reduction" ? "Reduction" : "Cadeau"}</span></td>
                          <td className="fw-semibold">{r.points_required} pts</td>
                          <td>{r.reward_type === "reduction" ? `${r.reduction_value} DT` : "—"}</td>
                          <td><span className={`badge ${r.active ? "bg-success" : "bg-secondary"}`}>{r.active ? "Actif" : "Inactif"}</span></td>
                          <td className="text-end">
                            <div className="d-flex gap-2 justify-content-end">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => ouvrirEditionReward(r)}><i className="ti ti-edit"></i></button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => supprimerReward(r.id)}><i className="ti ti-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ONGLET SOLDES UTILISATEURS */}
              {onglet === "users" && (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead><tr><th>Utilisateur</th><th>Solde</th><th className="text-end">Actions</th></tr></thead>
                    <tbody>
                      {balances.length === 0 ? <tr><td colSpan={3} className="text-center text-muted py-4">Aucun point attribue pour le moment.</td></tr> : balances.map((b) => (
                        <tr key={b.user_id}>
                          <td><h6 className="fw-semibold mb-0">{b.full_name}</h6></td>
                          <td><span className={`fw-semibold ${b.balance > 0 ? "text-success" : b.balance < 0 ? "text-danger" : ""}`}>{b.balance} pts</span></td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => { setAdjustForm({ user_id: b.user_id, points: "", description: "" }); setShowAdjustModal(true); }}>
                              <i className="ti ti-adjustments me-1"></i> Ajuster
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ONGLET HISTORIQUE */}
              {onglet === "history" && (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead><tr><th>Utilisateur</th><th>Type</th><th>Points</th><th>Description</th><th>Date</th></tr></thead>
                    <tbody>
                      {transactions.length === 0 ? <tr><td colSpan={5} className="text-center text-muted py-4">Aucune transaction.</td></tr> : transactions.map((t) => (
                        <tr key={t.id}>
                          <td>{t.profiles?.full_name ?? "Inconnu"}</td>
                          <td><span className={`badge ${TYPE_LABELS[t.type]?.classe ?? "bg-secondary"}`}>{TYPE_LABELS[t.type]?.label ?? t.type}</span></td>
                          <td><span className={`fw-semibold ${t.points > 0 ? "text-success" : "text-danger"}`}>{t.points > 0 ? "+" : ""}{t.points}</span></td>
                          <td className="text-muted">{t.description ?? "—"}</td>
                          <td className="text-muted">{new Date(t.created_at).toLocaleDateString("fr-FR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Recompense */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">{editId ? "Modifier la recompense" : "Nouvelle recompense"}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Nom <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control ${erreurs.name ? "is-invalid" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: 5 DT de reduction" />
                    {erreurs.name && <div className="invalid-feedback">{erreurs.name}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description visible par le client"></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Points requis <span className="text-danger">*</span></label>
                    <input type="number" className={`form-control ${erreurs.points_required ? "is-invalid" : ""}`} value={form.points_required} onChange={(e) => setForm({ ...form, points_required: e.target.value })} placeholder="100" />
                    {erreurs.points_required && <div className="invalid-feedback">{erreurs.points_required}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.reward_type} onChange={(e) => setForm({ ...form, reward_type: e.target.value })}>
                      <option value="reduction">Reduction (DT)</option>
                      <option value="gift">Cadeau</option>
                    </select>
                  </div>
                  {form.reward_type === "reduction" && (
                    <div className="col-md-6">
                      <label className="form-label">Valeur reduction (DT) <span className="text-danger">*</span></label>
                      <input type="number" step="0.01" className={`form-control ${erreurs.reduction_value ? "is-invalid" : ""}`} value={form.reduction_value} onChange={(e) => setForm({ ...form, reduction_value: e.target.value })} placeholder="5.00" />
                      {erreurs.reduction_value && <div className="invalid-feedback">{erreurs.reduction_value}</div>}
                    </div>
                  )}
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                      <label className="form-check-label">{form.active ? "Actif" : "Inactif"}</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setShowModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={sauvegarderReward}>Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajustement */}
      {showAdjustModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">Ajuster les points</h5>
                <button className="btn-close" onClick={() => setShowAdjustModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Utilisateur <span className="text-danger">*</span></label>
                    <select className="form-select" value={adjustForm.user_id} onChange={(e) => setAdjustForm({ ...adjustForm, user_id: e.target.value })}>
                      <option value="">Choisir un utilisateur</option>
                      {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Points <span className="text-danger">*</span></label>
                    <input type="number" className="form-control" value={adjustForm.points} onChange={(e) => setAdjustForm({ ...adjustForm, points: e.target.value })} placeholder="Ex: 50 ou -30" />
                    <small className="text-muted">Positif = ajouter, Negatif = retirer</small>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Raison</label>
                    <input type="text" className="form-control" value={adjustForm.description} onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })} placeholder="Ex: Bonus anniversaire" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setShowAdjustModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={ajusterPoints} disabled={!adjustForm.user_id || !adjustForm.points}>Confirmer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
