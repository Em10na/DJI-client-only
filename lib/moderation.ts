// ================================================================
// Moderation — profanity filter for review comments
// Normalizes text (accents, leetspeak, separators) then checks
// a FR/EN/dialect word list with word boundaries.
// ================================================================

const BAD_WORDS = [
  // Français
  "merde", "putain", "pute", "connard", "connarde", "connasse", "con",
  "salope", "salaud", "encule", "enculer", "batard", "batarde", "bordel",
  "nique", "niquer", "ntm", "fdp", "pd", "bite", "couille", "couilles",
  "chiotte", "chier", "emmerde", "emmerder", "cul", "branleur", "branler",
  "pouffiasse", "poufiasse", "garce", "ordure", "abruti", "cretin", "debile",
  // Anglais
  "fuck", "fucking", "fucker", "shit", "bitch", "asshole", "bastard",
  "dick", "cunt", "whore", "slut", "motherfucker", "wtf", "stfu",
  "douche", "douchebag", "prick", "piss", "crap",
  // Dialecte / translit
  "zebi", "zabi", "miboun", "9ahba", "kahba", "9a7ba", "zamel", "zaml",
  "nayek", "na3al", "yil3an", "sorm",
];

// Leetspeak / obfuscation mapping
const LEET_MAP: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t",
  "@": "a", "$": "s", "!": "i", "€": "e",
};

/** Normalize: lowercase, strip accents, de-leet, collapse separators. */
function normalize(text: string): string {
  let t = text.toLowerCase();
  // Strip accents (é → e, ç → c ...)
  t = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
  // De-leetspeak
  t = t.replace(/[0134570@$!€]/g, (c) => LEET_MAP[c] ?? c);
  // Remove separators used to evade filters: m.e.r.d.e / m-e-r-d-e / m_e_r_d_e
  t = t.replace(/(\w)[.\-_*+ ]{1,2}(?=\w[.\-_*+ ]{1,2}\w)/g, "$1");
  return t;
}

export type ModerationResult = {
  clean: boolean;
  /** Words that triggered the filter (normalized form) */
  flagged: string[];
};

/** Check a comment for profanity. */
export function moderateComment(text: string): ModerationResult {
  const normalized = normalize(text);
  const collapsed = normalized.replace(/[^a-z0-9]/g, ""); // aggressive pass
  const flagged: string[] = [];

  for (const word of BAD_WORDS) {
    // Word-boundary match on the normalized text
    const re = new RegExp(`(?:^|[^a-z0-9])${word}(?:$|[^a-z0-9])`, "i");
    if (re.test(normalized)) {
      flagged.push(word);
      continue;
    }
    // Aggressive pass: catches "m e r d e" / "m.e.r.d.e" fully collapsed —
    // only for words long enough to avoid false positives (e.g. "con" in "conforme")
    if (word.length >= 5 && collapsed.includes(word)) {
      flagged.push(word);
    }
  }

  return { clean: flagged.length === 0, flagged };
}
