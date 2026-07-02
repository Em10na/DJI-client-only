import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { moderateComment } from "@/lib/moderation";
import { analyzeReviewSentiment } from "@/lib/sentiment";

// GET /api/reviews?product_id=xxx — list reviews for a product
export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("product_id");
  if (!productId) {
    return NextResponse.json({ error: "product_id est requis." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, author_name, rating, comment, sentiment, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Erreur de chargement des avis." }, { status: 500 });
  }
  return NextResponse.json({ reviews: data });
}

// POST /api/reviews — submit a review (moderated + sentiment-analyzed)
export async function POST(request: NextRequest) {
  let body: { product_id?: string; author_name?: string; rating?: number; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide." }, { status: 400 });
  }

  const { product_id, author_name, rating, comment } = body;

  // --- Validation ---
  if (!product_id?.trim()) {
    return NextResponse.json({ error: "Produit manquant." }, { status: 400 });
  }
  const name = author_name?.trim() ?? "";
  if (name.length < 2 || name.length > 60) {
    return NextResponse.json({ error: "Veuillez saisir votre nom (2-60 caracteres)." }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating! < 1 || rating! > 5) {
    return NextResponse.json({ error: "La note doit etre entre 1 et 5 etoiles." }, { status: 400 });
  }
  const text = comment?.trim() ?? "";
  if (text.length < 2 || text.length > 2000) {
    return NextResponse.json({ error: "Le commentaire doit contenir entre 2 et 2000 caracteres." }, { status: 400 });
  }

  // --- Profanity filter (name + comment) ---
  const commentCheck = moderateComment(text);
  const nameCheck = moderateComment(name);
  if (!commentCheck.clean || !nameCheck.clean) {
    return NextResponse.json(
      { error: "Votre commentaire contient des mots inappropries. Merci de rester courtois." },
      { status: 422 }
    );
  }

  const supabase = createAdminClient();

  // Verify the product exists
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", product_id)
    .single();
  if (!product) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }

  // --- Sentiment analysis (comment text + star rating blended) ---
  const sentiment = analyzeReviewSentiment(text, rating!);

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      product_id,
      author_name: name,
      rating,
      comment: text,
      sentiment: sentiment.label,
      sentiment_score: sentiment.score,
    })
    .select("id, author_name, rating, comment, sentiment, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Erreur lors de l'enregistrement de l'avis." }, { status: 500 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
