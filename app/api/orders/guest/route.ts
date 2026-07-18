import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { guest_name, guest_phone, guest_address, items } = body;

  if (!guest_name?.trim() || !guest_phone?.trim() || !guest_address?.trim()) {
    return NextResponse.json({ error: "Nom, telephone et adresse sont obligatoires." }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Le panier est vide." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const productIds = items.map((i: { product_id: string }) => i.product_id);
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, price, stock")
    .in("id", productIds);

  if (prodErr || !products) {
    return NextResponse.json({ error: "Erreur de verification des produits." }, { status: 500 });
  }

  const priceMap = new Map(products.map((p) => [p.id, p]));

  let verifiedTotal = 0;
  const verifiedItems: { product_id: string; quantity: number; unit_price: number }[] = [];

  for (const item of items) {
    const product = priceMap.get(item.product_id);
    if (!product) {
      return NextResponse.json({ error: `Produit introuvable: ${item.product_id}` }, { status: 400 });
    }
    if (item.quantity > product.stock) {
      return NextResponse.json({ error: `Stock insuffisant pour le produit.` }, { status: 400 });
    }
    verifiedItems.push({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: product.price,
    });
    verifiedTotal += product.price * item.quantity;
  }

  const livraison = verifiedTotal >= 50 ? 0 : 7;
  const grandTotal = verifiedTotal + livraison;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: null,
      total: grandTotal,
      status: "pending",
      guest_name: guest_name.trim(),
      guest_phone: guest_phone.trim(),
      guest_address: guest_address.trim(),
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Erreur lors de la creation de la commande." }, { status: 500 });
  }

  const orderItems = verifiedItems.map((item) => ({
    order_id: order.id,
    ...item,
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
  if (itemsErr) {
    return NextResponse.json({ error: "Erreur lors de l'ajout des articles." }, { status: 500 });
  }

  return NextResponse.json({ id: order.id });
}
