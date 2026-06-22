-- ============================================================
-- KICKSOFT — Systeme de Points de Fidelite
-- Executez dans Supabase SQL Editor
-- ============================================================

-- 1. Ajouter colonne loyalty_points aux produits
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;

-- 2. Table des recompenses (paliers definis par l'admin)
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'gift',
  reduction_value NUMERIC,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table des transactions (historique complet par utilisateur)
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  reward_id UUID REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loyalty_rewards_public_read" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_public_read" ON public.loyalty_rewards
  FOR SELECT USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "loyalty_rewards_admin_insert" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_admin_insert" ON public.loyalty_rewards
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "loyalty_rewards_admin_update" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_admin_update" ON public.loyalty_rewards
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "loyalty_rewards_admin_delete" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_admin_delete" ON public.loyalty_rewards
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "loyalty_tx_read" ON public.loyalty_transactions;
CREATE POLICY "loyalty_tx_read" ON public.loyalty_transactions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "loyalty_tx_insert" ON public.loyalty_transactions;
CREATE POLICY "loyalty_tx_insert" ON public.loyalty_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "loyalty_tx_admin_manage" ON public.loyalty_transactions;
CREATE POLICY "loyalty_tx_admin_manage" ON public.loyalty_transactions
  FOR ALL USING (public.is_admin());

-- 5. Fonction pour crediter les points a la livraison (idempotente)
CREATE OR REPLACE FUNCTION public.credit_order_loyalty_points(p_order_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_total_points INTEGER := 0;
  v_item RECORD;
BEGIN
  SELECT user_id INTO v_user_id FROM public.orders WHERE id = p_order_id;
  IF v_user_id IS NULL THEN RETURN 0; END IF;

  IF EXISTS (
    SELECT 1 FROM public.loyalty_transactions
    WHERE order_id = p_order_id AND type = 'earn'
  ) THEN RETURN 0; END IF;

  FOR v_item IN
    SELECT oi.quantity, p.loyalty_points, p.title
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id AND p.loyalty_points > 0
  LOOP
    v_total_points := v_total_points + (v_item.loyalty_points * v_item.quantity);
  END LOOP;

  IF v_total_points > 0 THEN
    INSERT INTO public.loyalty_transactions (user_id, order_id, points, type, description)
    VALUES (v_user_id, p_order_id, v_total_points, 'earn',
            'Points gagnes - commande #' || LEFT(p_order_id::text, 8));
  END IF;

  RETURN v_total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Donnees de test
INSERT INTO public.loyalty_rewards (name, description, points_required, reward_type, reduction_value, active) VALUES
  ('5 DT de reduction', 'Echangez 100 points contre 5 DT de remise', 100, 'reduction', 5.00, true),
  ('10 DT de reduction', 'Echangez 200 points contre 10 DT de remise', 200, 'reduction', 10.00, true),
  ('Livraison gratuite', 'Echangez 500 points pour une livraison offerte', 500, 'gift', NULL, true),
  ('Accessoire offert', 'Echangez 1000 points pour un accessoire premium', 1000, 'gift', NULL, true)
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
