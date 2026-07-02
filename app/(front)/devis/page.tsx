"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function DevisForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const produitNom = searchParams.get("produit");
  const produitRef = searchParams.get("ref");
  const produitPrix = searchParams.get("prix");
  const hasProduit = !!(produitNom && produitRef);

  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");
  const [form, setForm] = useState({
    societe: "", nom: "", email: "", telephone: "",
    secteur: "Entreprise", budget: produitPrix || "", description: hasProduit
      ? `Demande de devis pour le produit : ${produitNom} (Ref: ${produitRef}, Prix catalogue: ${produitPrix} DT)`
      : "",
  });

  async function envoyerDevis(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    const subject = hasProduit
      ? `[DEVIS] ${form.societe} - ${form.secteur} - Produit: ${produitNom} (${produitRef})`
      : `[DEVIS] ${form.societe} - ${form.secteur}`;
    const { error } = await supabase.from("tickets_support").insert({
      subject,
      message: `Societe: ${form.societe}\nNom: ${form.nom}\nEmail: ${form.email}\nTelephone: ${form.telephone}\nSecteur: ${form.secteur}\nBudget: ${form.budget}\n\nDescription:\n${form.description}`,
      status: "open",
    });
    if (error) setErreur("Erreur : " + error.message);
    else setEnvoye(true);
  }

  return (
    <div style={{ maxWidth: "720px" }}>
      {/* Bandeau produit */}
      {hasProduit && !envoye && (
        <div style={{ padding: "var(--s4)", marginBottom: "var(--s5)", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "var(--r)", display: "flex", alignItems: "center", gap: "var(--s3)" }}>
          <span style={{ fontSize: "20px" }}>&#x1F4E6;</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Devis pour : {produitNom}</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)" }}>Ref: {produitRef} | Prix catalogue: {produitPrix} DT</div>
          </div>
        </div>
      )}

      {envoye ? (
        <div style={{ textAlign: "center", padding: "var(--s8) 0" }}>
          <div style={{ fontSize: "48px", marginBottom: "var(--s4)" }}>&#x2713;</div>
          <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--s3)" }}>Demande envoyee !</h2>
          <p style={{ color: "var(--fg-soft)" }}>Notre equipe vous repondra sous 24 heures ouvrables.</p>
          <Link href="/" className="btn btn--indigo" style={{ marginTop: "var(--s5)" }}>Retour a l&apos;accueil</Link>
        </div>
      ) : (
        <form className="contact-form" onSubmit={envoyerDevis}>
          {erreur && <p style={{ color: "var(--rose)", marginBottom: "var(--s4)" }}>{erreur}</p>}
          <div className="field-row">
            <div className="field">
              <label htmlFor="d-societe">Societe / Organisation</label>
              <input id="d-societe" type="text" required placeholder="Nom de votre entreprise" value={form.societe} onChange={(e) => setForm({ ...form, societe: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="d-nom">Nom complet</label>
              <input id="d-nom" type="text" required placeholder="Prenom Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="d-email">Email professionnel</label>
              <input id="d-email" type="email" required placeholder="vous@entreprise.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="d-tel">Telephone</label>
              <input id="d-tel" type="tel" placeholder="+216 XX XXX XXX" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="d-secteur">Secteur d&apos;activite</label>
              <select id="d-secteur" value={form.secteur} onChange={(e) => setForm({ ...form, secteur: e.target.value })}>
                <option>Entreprise</option>
                <option>Education</option>
                <option>Commerce</option>
                <option>Industrie</option>
                <option>Sante</option>
                <option>Evenementiel</option>
                <option>Autre</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="d-budget">Budget estimatif (DT)</label>
              <input id="d-budget" type="text" placeholder="Ex: 5000 - 10000" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="d-desc">Description du besoin</label>
            <textarea id="d-desc" required placeholder="Decrivez vos besoins : types de produits, quantites, contraintes techniques, delais..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
          </div>
          <button className="btn btn--indigo btn--block" type="submit" style={{ padding: "16px", fontSize: "var(--text-base)", marginTop: "var(--s2)" }}>
            Envoyer la demande de devis &rarr;
          </button>
        </form>
      )}
    </div>
  );
}

export default function DevisPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span> <span>Devis</span>
          </div>
          <h1>Demander un devis</h1>
          <p>Recevez une offre personnalisee sous 24h. Gratuit et sans engagement.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: "720px" }}>
          <Suspense fallback={<p style={{ textAlign: "center", color: "var(--fg-mute)" }}>Chargement...</p>}>
            <DevisForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
