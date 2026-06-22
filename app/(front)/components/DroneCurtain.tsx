"use client";

import { useEffect, useState } from "react";

export default function DroneCurtain() {
  const [phase, setPhase] = useState<"closed" | "opening" | "done">("closed");

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("curtain-seen");
    if (alreadySeen) {
      setPhase("done");
      return;
    }
    const t1 = setTimeout(() => setPhase("opening"), 1600);
    const t2 = setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("curtain-seen", "1");
    }, 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "done") return null;

  return (
    <div className={`curtain ${phase === "opening" ? "curtain--open" : ""}`}>
      {/* Left panel */}
      <div className="curtain__panel curtain__panel--left">
        <div className="curtain__drone-grid">
          <img src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80&auto=format&fit=crop" alt="" className="curtain__drone curtain__drone--1" />
          <img src="https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=600&q=80&auto=format&fit=crop" alt="" className="curtain__drone curtain__drone--2" />
          <img src="https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&q=80&auto=format&fit=crop" alt="" className="curtain__drone curtain__drone--3" />
        </div>
        <div className="curtain__overlay"></div>
      </div>

      {/* Right panel */}
      <div className="curtain__panel curtain__panel--right">
        <div className="curtain__drone-grid">
          <img src="https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&q=80&auto=format&fit=crop" alt="" className="curtain__drone curtain__drone--4" />
          <img src="https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=600&q=80&auto=format&fit=crop" alt="" className="curtain__drone curtain__drone--5" />
          <img src="https://images.unsplash.com/photo-1521405924368-64c5b84bec60?w=600&q=80&auto=format&fit=crop" alt="" className="curtain__drone curtain__drone--6" />
        </div>
        <div className="curtain__overlay"></div>
      </div>

      {/* Center logo */}
      <div className="curtain__center">
        <div className="curtain__logo">
          <span className="curtain__logo-mark">K</span>
          <span className="curtain__logo-text">KICKSOFT</span>
        </div>
        <div className="curtain__tagline">Technology Takes Flight</div>
        <div className="curtain__loader">
          <div className="curtain__loader-bar"></div>
        </div>
      </div>
    </div>
  );
}
