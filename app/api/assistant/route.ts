import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ================================================================
// AI Assistant — product recommendation engine
// Analyzes the customer's description (use case) and suggests
// matching products from the catalog.
// ================================================================

type UseCase = {
  keywords: string[];
  /** Search terms to match against product title / description */
  searchTerms: string[];
  /** Human label used in the reply */
  label: string;
};

const USE_CASES: UseCase[] = [
  {
    keywords: ["voyage", "voyager", "vacances", "trip", "tourisme", "explorer", "aventure"],
    searchTerms: ["drone", "action", "sac", "batterie"],
    label: "vos voyages",
  },
  {
    keywords: ["vlog", "vlogging", "youtube", "youtubeur", "tiktok", "instagram", "reseaux sociaux", "contenu", "createur", "influenceur"],
    searchTerms: ["camera", "gimbal", "stabilisateur", "micro", "eclairage"],
    label: "la création de contenu",
  },
  {
    keywords: ["mariage", "evenement", "ceremonie", "fete", "soiree", "anniversaire"],
    searchTerms: ["camera", "gimbal", "micro", "eclairage", "drone"],
    label: "la couverture d'événements",
  },
  {
    keywords: ["sport", "plongee", "surf", "moto", "velo", "vtt", "rando", "randonnee", "ski", "extreme", "course"],
    searchTerms: ["action", "sac", "batterie"],
    label: "le sport et l'action",
  },
  {
    keywords: ["podcast", "interview", "voix", "enregistrement", "audio", "chanson", "musique", "studio"],
    searchTerms: ["micro", "audio", "eclairage"],
    label: "l'enregistrement audio",
  },
  {
    keywords: ["immobilier", "inspection", "agriculture", "chantier", "topographie", "cartographie", "surveillance", "toiture"],
    searchTerms: ["drone"],
    label: "l'usage professionnel aérien",
  },
  {
    keywords: ["photo aerienne", "paysage", "aerien", "vue du ciel", "panorama"],
    searchTerms: ["drone", "batterie", "filtre"],
    label: "la photographie aérienne",
  },
  {
    keywords: ["streaming", "stream", "gaming", "gamer", "twitch", "live", "direct"],
    searchTerms: ["micro", "camera", "eclairage"],
    label: "le streaming",
  },
  {
    keywords: ["cinema", "film", "court metrage", "documentaire", "clip", "realisateur", "tournage"],
    searchTerms: ["camera", "gimbal", "stabilisateur", "micro", "eclairage"],
    label: "la production vidéo",
  },
  {
    keywords: ["stabilise", "stabilisation", "tremble", "flou", "fluide", "smooth"],
    searchTerms: ["gimbal", "stabilisateur"],
    label: "la stabilisation",
  },
  {
    keywords: ["debutant", "commencer", "debuter", "premier", "apprendre", "simple", "facile"],
    searchTerms: ["drone", "camera", "action"],
    label: "bien débuter",
  },
];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export async function POST(request: NextRequest) {
  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }

  const message = normalize(body.message?.trim() ?? "");
  if (!message) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 });
  }

  // --- Detect the use case(s) ---
  const matched: UseCase[] = [];
  for (const uc of USE_CASES) {
    if (uc.keywords.some((kw) => message.includes(normalize(kw)))) {
      matched.push(uc);
    }
  }

  // Also detect direct product-type mentions
  const DIRECT_TERMS = ["drone", "camera", "gimbal", "stabilisateur", "micro", "action", "batterie", "eclairage", "sac", "filtre", "audio"];
  const directHits = DIRECT_TERMS.filter((t) => message.includes(t));

  const searchTerms = [...new Set([...matched.flatMap((m) => m.searchTerms), ...directHits])];

  if (searchTerms.length === 0) {
    return NextResponse.json({
      reply:
        "Pour vous conseiller au mieux, décrivez-moi votre projet ! 😊\nPar exemple :\n• « Je veux filmer mes voyages »\n• « Je fais du vlogging YouTube »\n• « Je cherche un micro pour mon podcast »\n• « Je filme des mariages »",
      products: [],
    });
  }

  // --- Budget detection (« 500 dt », « moins de 1000 dinars ») ---
  const budgetMatch = message.match(/(\d{2,6})\s*(dt|dinars?|tnd)/);
  const budget = budgetMatch ? parseInt(budgetMatch[1], 10) : null;

  // --- Search products ---
  const supabase = createAdminClient();
  const orFilter = searchTerms
    .map((t) => `title.ilike.%${t}%,short_description.ilike.%${t}%`)
    .join(",");

  let query = supabase
    .from("products")
    .select("id, title, price, image_url, stock")
    .eq("status", "published")
    .or(orFilter)
    .order("display_order", { ascending: true })
    .limit(4);

  if (budget) query = query.lte("price", budget);

  const { data: products, error } = await query;

  if (error) {
    return NextResponse.json({
      reply: "Une erreur est survenue lors de la recherche. Réessayez dans un instant !",
      products: [],
    });
  }

  const labels = matched.map((m) => m.label);
  const intro =
    labels.length > 0
      ? `Pour ${labels[0]}, voici ce que je vous recommande :`
      : "Voici les produits qui correspondent à votre besoin :";

  if (!products || products.length === 0) {
    return NextResponse.json({
      reply:
        (budget
          ? `Je n'ai pas trouvé de produit sous ${budget} DT pour ce besoin. 😕\nEssayez avec un budget plus large ou `
          : "Je n'ai pas trouvé de produit correspondant en stock actuellement. 😕\n") +
        "Parcourez notre Boutique pour voir tout le catalogue !",
      products: [],
    });
  }

  return NextResponse.json({
    reply:
      intro +
      (budget ? `\n(budget max : ${budget} DT)` : "") +
      "\n\nCliquez sur un produit pour voir sa fiche complète. Besoin d'autres conseils ? Décrivez-moi votre usage !",
    products,
  });
}
