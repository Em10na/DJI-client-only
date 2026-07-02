-- ============================================================
-- KICKSOFT — Migration v2
-- Guest checkout, display_order, loyalty rate update
-- Executez dans Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. ORDERS : guest checkout support
-- ============================================================
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_address TEXT;

-- ============================================================
-- 2. PRODUCTS : display_order pour tri admin
-- ============================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- 3. RLS : mise a jour pour commandes guest
-- ============================================================

-- Orders : admin voit tout, owner voit les siennes
DROP POLICY IF EXISTS "orders_owner_read" ON public.orders;
CREATE POLICY "orders_owner_read" ON public.orders
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Orders : insert pour utilisateurs authentifies
DROP POLICY IF EXISTS "orders_owner_insert" ON public.orders;
CREATE POLICY "orders_owner_insert" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());
-- Note : les commandes guest sont inserees via service_role (bypass RLS)

-- ============================================================
-- 4. LOYALTY : mise a jour du taux (100 DT = 1 point)
-- ============================================================
CREATE OR REPLACE FUNCTION public.credit_order_loyalty_points(p_order_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_order_total NUMERIC;
  v_product_bonus INTEGER := 0;
  v_amount_points INTEGER := 0;
  v_first_order_bonus INTEGER := 0;
  v_total_points INTEGER := 0;
  v_item RECORD;
  v_delivered_count INTEGER;
  v_expiry TIMESTAMPTZ;
BEGIN
  SELECT user_id, total INTO v_user_id, v_order_total
  FROM public.orders WHERE id = p_order_id;
  IF v_user_id IS NULL THEN RETURN 0; END IF;

  -- Idempotent : ne crediter qu'une fois
  IF EXISTS (
    SELECT 1 FROM public.loyalty_transactions
    WHERE order_id = p_order_id AND type = 'earn'
  ) THEN RETURN 0; END IF;

  -- Points par montant depense (1 pt / 100 DT)
  v_amount_points := FLOOR(v_order_total / 100)::INTEGER;

  -- Bonus par produit
  FOR v_item IN
    SELECT oi.quantity, p.loyalty_points
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id AND p.loyalty_points > 0
  LOOP
    v_product_bonus := v_product_bonus + (v_item.loyalty_points * v_item.quantity);
  END LOOP;

  -- Bonus premiere commande livree
  SELECT COUNT(*) INTO v_delivered_count
  FROM public.orders
  WHERE user_id = v_user_id AND status = 'delivered' AND id != p_order_id;
  IF v_delivered_count = 0 THEN
    v_first_order_bonus := 100;
  END IF;

  v_total_points := v_amount_points + v_product_bonus + v_first_order_bonus;
  v_expiry := now() + INTERVAL '365 days';

  IF v_total_points > 0 THEN
    INSERT INTO public.loyalty_transactions (user_id, order_id, points, type, description, expires_at)
    VALUES (v_user_id, p_order_id, v_amount_points + v_product_bonus, 'earn',
            'Commande #' || LEFT(p_order_id::text, 8) || ' (' || v_amount_points || ' pts achat + ' || v_product_bonus || ' pts bonus produit)',
            v_expiry);

    IF v_first_order_bonus > 0 THEN
      INSERT INTO public.loyalty_transactions (user_id, order_id, points, type, description, expires_at)
      VALUES (v_user_id, p_order_id, v_first_order_bonus, 'earn',
              'Bonus premiere commande !', v_expiry);
    END IF;
  END IF;

  RETURN v_total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Recharger le schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
