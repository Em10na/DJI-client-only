"use client";

import { useState } from "react";

type MediaItem = { id: string; url: string; type: string; position: number };

type Props = {
  media: MediaItem[];
  fallbackImage: string | null;
  productTitle: string;
};

function getYoutubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

function getVimeoId(url: string) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
}

export default function ProductGallery({ media, fallbackImage, productTitle }: Props) {
  const fallback = fallbackImage || "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900&q=80&auto=format&fit=crop";

  // Si pas de médias, afficher juste l'image principale
  const items: MediaItem[] = media.length > 0 ? media : [{ id: "fallback", url: fallback, type: "image", position: 0 }];

  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const current = items[active];

  function renderMain(item: MediaItem, fullscreen = false) {
    const ytId = getYoutubeId(item.url);
    const vimeoId = getVimeoId(item.url);
    const size = fullscreen ? "100%" : "100%";

    if (item.type === "video" || ytId || vimeoId || isDirectVideo(item.url)) {
      if (ytId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=${fullscreen ? 1 : 0}&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: size, height: "100%", border: "none", display: "block" }}
          />
        );
      }
      if (vimeoId) {
        return (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${fullscreen ? 1 : 0}`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ width: size, height: "100%", border: "none", display: "block" }}
          />
        );
      }
      return (
        <video controls autoPlay={fullscreen} style={{ width: size, height: "100%", objectFit: "contain", background: "#000" }}>
          <source src={item.url} />
        </video>
      );
    }
    return (
      <img
        src={item.url}
        alt={productTitle}
        style={{ width: size, height: "100%", objectFit: "contain", display: "block", cursor: "zoom-in" }}
        onClick={() => setLightbox(true)}
      />
    );
  }

  function renderThumb(item: MediaItem) {
    const ytId = getYoutubeId(item.url);
    const vimeoId = getVimeoId(item.url);
    const isVid = item.type === "video" || ytId || vimeoId || isDirectVideo(item.url);

    if (isVid) {
      const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : undefined;
      return (
        <div style={{ width: "100%", height: "100%", background: "#0f172a", display: "grid", placeItems: "center", position: "relative" }}>
          {thumb && <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />}
          <div style={{ position: "absolute", width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "grid", placeItems: "center" }}>
            <span style={{ fontSize: 12, color: "#0f172a", marginLeft: 2 }}>▶</span>
          </div>
        </div>
      );
    }
    return <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  }

  return (
    <>
      <div className="gallery" style={{ display: "flex", gap: "var(--s4)", alignItems: "flex-start" }}>
        {/* Thumbnails column */}
        {items.length > 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, width: 72 }}>
            {items.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setActive(idx)}
                style={{
                  width: 72, height: 72, borderRadius: 8, overflow: "hidden", padding: 0, border: "none",
                  outline: active === idx ? "2px solid var(--indigo)" : "2px solid transparent",
                  outlineOffset: 2,
                  cursor: "pointer",
                  transition: "outline 0.2s",
                  opacity: active === idx ? 1 : 0.65,
                }}
              >
                {renderThumb(item)}
              </button>
            ))}
          </div>
        )}

        {/* Main viewer */}
        <figure className="gallery-main" style={{ flex: 1, margin: 0, borderRadius: "var(--r-lg)", overflow: "hidden", background: "var(--bg)", aspectRatio: "1 / 1", position: "relative" }}>
          {renderMain(current)}

          {/* Navigation arrows if multiple */}
          {items.length > 1 && (
            <>
              <button
                onClick={() => setActive((active - 1 + items.length) % items.length)}
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.9)", cursor: "pointer", display: "grid", placeItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 16, zIndex: 2 }}
              >‹</button>
              <button
                onClick={() => setActive((active + 1) % items.length)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.9)", cursor: "pointer", display: "grid", placeItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 16, zIndex: 2 }}
              >›</button>

              {/* Dots */}
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2 }}>
                {items.map((_, i) => (
                  <button key={i} onClick={() => setActive(i)}
                    style={{ width: i === active ? 20 : 6, height: 6, borderRadius: 3, border: "none", background: i === active ? "var(--indigo)" : "rgba(255,255,255,0.7)", cursor: "pointer", padding: 0, transition: "width 0.3s, background 0.2s" }} />
                ))}
              </div>
            </>
          )}
        </figure>
      </div>

      {/* Lightbox */}
      {lightbox && current.type !== "video" && !getYoutubeId(current.url) && !getVimeoId(current.url) && (
        <div
          onClick={() => setLightbox(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}
        >
          <img src={current.url} alt={productTitle} style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setLightbox(false)}
            style={{ position: "fixed", top: 20, right: 20, width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center" }}>✕</button>
          {items.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setActive((active - 1 + items.length) % items.length); }}
                style={{ position: "fixed", left: 20, top: "50%", transform: "translateY(-50%)", width: 48, height: 48, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 24, cursor: "pointer", display: "grid", placeItems: "center" }}>‹</button>
              <button onClick={(e) => { e.stopPropagation(); setActive((active + 1) % items.length); }}
                style={{ position: "fixed", right: 20, top: "50%", transform: "translateY(-50%)", width: 48, height: 48, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 24, cursor: "pointer", display: "grid", placeItems: "center" }}>›</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
