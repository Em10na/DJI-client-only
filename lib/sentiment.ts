// ================================================================
// Sentiment analysis — lexicon-based, French + English
// Handles negation ("pas bon" → negative) and intensifiers.
// Returns a score in [-1, 1] and a label: positif | neutre | negatif
// ================================================================

const POSITIVE = new Set([
  // Français
  "excellent", "excellente", "super", "genial", "geniale", "parfait",
  "parfaite", "top", "magnifique", "incroyable", "impeccable", "rapide",
  "satisfait", "satisfaite", "recommande", "recommander", "bon", "bonne",
  "bien", "meilleur", "meilleure", "qualite", "fiable", "solide", "efficace",
  "pratique", "beau", "belle", "content", "contente", "heureux", "heureuse",
  "merci", "bravo", "adore", "adorer", "aime", "aimer", "formidable",
  "extraordinaire", "superbe", "agreable", "conforme", "propre", "soigne",
  "professionnel", "professionnelle", "reactif", "reactive", "durable",
  // Anglais
  "great", "good", "awesome", "amazing", "perfect", "excellent", "love",
  "loved", "best", "fast", "quality", "recommend", "recommended", "happy",
  "satisfied", "wonderful", "fantastic", "nice", "reliable", "solid",
]);

const NEGATIVE = new Set([
  // Français
  "mauvais", "mauvaise", "nul", "nulle", "decevant", "decevante", "decu",
  "decue", "deception", "lent", "lente", "casse", "cassee", "horrible",
  "pire", "arnaque", "cher", "chere", "probleme", "problemes", "defectueux",
  "defectueuse", "defaut", "defauts", "panne", "retard", "endommage",
  "endommagee", "faux", "fausse", "fragile", "mediocre", "insatisfait",
  "insatisfaite", "regrette", "regretter", "eviter", "jamais", "inutile",
  "incomplet", "incomplete", "abime", "abimee", "rembourser", "remboursement",
  "plainte", "triste", "catastrophe", "catastrophique", "deteste", "detester",
  // Anglais
  "bad", "poor", "terrible", "awful", "worst", "slow", "broken", "damaged",
  "defective", "disappointed", "disappointing", "scam", "expensive", "hate",
  "hated", "refund", "problem", "problems", "useless", "cheap", "fake",
]);

const NEGATORS = new Set([
  "pas", "non", "jamais", "aucun", "aucune", "sans", "ni",
  "not", "no", "never", "dont", "doesnt", "didnt", "isnt", "wasnt",
]);

const INTENSIFIERS = new Set([
  "tres", "trop", "vraiment", "totalement", "completement", "absolument",
  "extremement", "hyper", "ultra", "si", "tellement",
  "very", "really", "totally", "extremely", "so", "absolutely",
]);

export type SentimentResult = {
  /** -1.0 (très négatif) .. +1.0 (très positif) */
  score: number;
  label: "positif" | "neutre" | "negatif";
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Lexicon lookup with tolerance for stretched letters ("gooood" → "good"). */
function wordValue(word: string): number {
  if (POSITIVE.has(word)) return 1;
  if (NEGATIVE.has(word)) return -1;
  // Collapse letter runs of 3+ down to 2 ("goooood" → "good", "nuuuul" → "nuul"→?)
  const squashed2 = word.replace(/(.)\1{2,}/g, "$1$1");
  if (POSITIVE.has(squashed2)) return 1;
  if (NEGATIVE.has(squashed2)) return -1;
  // Collapse to single letters ("nuuul" → "nul")
  const squashed1 = word.replace(/(.)\1+/g, "$1");
  if (POSITIVE.has(squashed1)) return 1;
  if (NEGATIVE.has(squashed1)) return -1;
  return 0;
}

/** Analyze the sentiment of the comment TEXT only. */
export function analyzeSentiment(text: string): SentimentResult {
  const tokens = tokenize(text);
  let score = 0;
  let hits = 0;

  for (let i = 0; i < tokens.length; i++) {
    const value = wordValue(tokens[i]);
    if (value === 0) continue;

    // Check the 2 preceding words for negation / intensity
    let multiplier = 1;
    for (let j = Math.max(0, i - 2); j < i; j++) {
      if (NEGATORS.has(tokens[j])) multiplier *= -1;
      else if (INTENSIFIERS.has(tokens[j])) multiplier *= 1.5;
    }

    score += value * multiplier;
    hits++;
  }

  if (hits === 0) return { score: 0, label: "neutre" };

  // Normalize into [-1, 1]
  const normalized = Math.max(-1, Math.min(1, score / hits));

  let label: SentimentResult["label"] = "neutre";
  if (normalized >= 0.2) label = "positif";
  else if (normalized <= -0.2) label = "negatif";

  return { score: Math.round(normalized * 100) / 100, label };
}

/**
 * Analyze a REVIEW: blends the comment text with the star rating.
 * The rating is a strong signal — 5★ with a neutral text is still positive.
 */
export function analyzeReviewSentiment(text: string, rating: number): SentimentResult {
  const textResult = analyzeSentiment(text);
  // Map rating 1..5 → -1..+1  (1★=-1, 3★=0, 5★=+1)
  const ratingScore = (rating - 3) / 2;

  // If the text carries no sentiment words, trust the rating alone.
  // Otherwise blend: text 60% / rating 40%.
  const blended =
    textResult.score === 0
      ? ratingScore
      : textResult.score * 0.6 + ratingScore * 0.4;

  const score = Math.max(-1, Math.min(1, blended));

  let label: SentimentResult["label"] = "neutre";
  if (score >= 0.2) label = "positif";
  else if (score <= -0.2) label = "negatif";

  return { score: Math.round(score * 100) / 100, label };
}
