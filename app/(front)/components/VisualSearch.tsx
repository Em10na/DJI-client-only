"use client";

import { useRef, useState } from "react";
import Link from "next/link";

type FoundProduct = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
};

// ImageNet labels (MobileNet output) → our catalog terms
const LABEL_MAP: { match: string[]; term: string; label: string }[] = [
  { match: ["reflex camera", "polaroid", "digital camera", "camcorder", "lens cap", "projector", "binoculars", "telephoto"], term: "camera", label: "Caméra" },
  { match: ["warplane", "airliner", "airship", "wing", "projectile", "missile", "space shuttle", "kite", "parachute", "radio telescope"], term: "drone", label: "Drone" },
  { match: ["microphone", "mike"], term: "micro", label: "Microphone" },
  { match: ["loudspeaker", "radio", "tape player", "cd player", "cassette", "speaker"], term: "audio", label: "Audio" },
  { match: ["tripod", "crutch"], term: "gimbal", label: "Stabilisateur / Gimbal" },
  { match: ["backpack", "purse", "mailbag", "suitcase", "plastic bag"], term: "sac", label: "Sac" },
  { match: ["spotlight", "lampshade", "table lamp", "torch", "candle", "jack-o'-lantern"], term: "eclairage", label: "Éclairage" },
  { match: ["remote control", "joystick", "power drill", "combination lock"], term: "accessoire", label: "Accessoire" },
  { match: ["ipod", "cellular", "hand-held computer", "notebook", "laptop", "monitor", "screen"], term: "camera", label: "Appareil électronique" },
];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Impossible de charger ${src}`));
    document.head.appendChild(s);
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function getModel(): Promise<any> {
  const w = window as any;
  if (w.__mobilenetModel) return w.__mobilenetModel;
  await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js");
  const model = await w.mobilenet.load();
  w.__mobilenetModel = model;
  return model;
}

export default function VisualSearch() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading-model" | "analyzing" | "done" | "error">("idle");
  const [detected, setDetected] = useState<string[]>([]);
  const [products, setProducts] = useState<FoundProduct[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setPreview(null);
    setStatus("idle");
    setDetected([]);
    setProducts([]);
    setErrorMsg("");
  }

  function onFile(file: File | undefined | null) {
    if (!file || !file.type.startsWith("image/")) return;
    reset();
    setPreview(URL.createObjectURL(file));
  }

  async function analyze() {
    if (!imgRef.current) return;
    setErrorMsg("");
    try {
      setStatus("loading-model");
      const model = await getModel();

      setStatus("analyzing");
      const predictions: { className: string; probability: number }[] =
        await model.classify(imgRef.current, 5);

      // Map ImageNet labels to catalog terms
      const terms = new Set<string>();
      const labels = new Set<string>();
      for (const p of predictions) {
        const cn = p.className.toLowerCase();
        for (const entry of LABEL_MAP) {
          if (entry.match.some((m) => cn.includes(m))) {
            terms.add(entry.term);
            labels.add(entry.label);
          }
        }
      }

      setDetected([...labels]);

      if (terms.size === 0) {
        setProducts([]);
        setStatus("done");
        return;
      }

      const res = await fetch("/api/visual-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms: [...terms] }),
      });
      const data = await res.json();
      setProducts(data.products ?? []);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMsg("L'analyse a échoué. Vérifiez votre connexion et réessayez.");
    }
  }

  return (
    <>
      {/* Camera button (sits inside the search bar) */}
      <button
        type="button"
        className="vs-btn"
        onClick={() => setOpen(true)}
        aria-label="Recherche par image"
        title="Recherche par image"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      </button>

      {open && (
        <div className="vs-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="vs-modal" role="dialog" aria-label="Recherche visuelle">
            <div className="vs-modal__head">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                Recherche visuelle
              </h3>
              <button className="vs-modal__close" onClick={() => { setOpen(false); reset(); }} aria-label="Fermer">✕</button>
            </div>

            <p className="vs-modal__hint">
              Prenez en photo ou téléversez l&apos;image d&apos;un produit — notre IA le reconnaît et trouve les articles correspondants.
            </p>

            {/* Dropzone / preview */}
            <div
              className={`vs-drop ${preview ? "vs-drop--has-img" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFile(e.dataTransfer.files?.[0]);
              }}
            >
              {preview ? (
                <img ref={imgRef} src={preview} alt="Aperçu" crossOrigin="anonymous" />
              ) : (
                <div className="vs-drop__placeholder">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span>Cliquez ou glissez une image ici</span>
                  <small>JPG, PNG, WEBP — photo du produit recherché</small>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </div>

            {/* Actions */}
            {preview && status !== "done" && (
              <button
                className="btn btn--indigo btn--block"
                onClick={analyze}
                disabled={status === "loading-model" || status === "analyzing"}
                style={{ marginTop: "var(--s4)" }}
              >
                {status === "loading-model"
                  ? "Chargement de l'IA... (première fois uniquement)"
                  : status === "analyzing"
                  ? "Analyse de l'image..."
                  : "🔍 Analyser l'image"}
              </button>
            )}

            {status === "error" && <p className="vs-error">{errorMsg}</p>}

            {/* Results */}
            {status === "done" && (
              <div className="vs-results">
                {detected.length > 0 && (
                  <p className="vs-results__detected">
                    Détecté : {detected.map((d) => <span key={d} className="vs-tag">{d}</span>)}
                  </p>
                )}

                {products.length > 0 ? (
                  <div className="vs-products">
                    {products.map((p) => (
                      <Link key={p.id} href={`/produit/${p.id}`} className="vs-product" onClick={() => setOpen(false)}>
                        <img src={p.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=70&auto=format&fit=crop"} alt={p.title} />
                        <span className="vs-product__title">{p.title}</span>
                        <span className="vs-product__price">{p.price} DT</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="vs-results__empty">
                    {detected.length > 0
                      ? "Aucun produit correspondant dans le catalogue actuellement."
                      : "Objet non reconnu. 😕 Essayez avec une photo plus nette ou un autre angle."}
                  </p>
                )}

                <div style={{ display: "flex", gap: "var(--s3)", marginTop: "var(--s4)" }}>
                  <button className="btn btn--ghost" onClick={reset}>Autre image</button>
                  <Link href="/boutique" className="btn btn--indigo" onClick={() => setOpen(false)}>
                    Voir la boutique →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
