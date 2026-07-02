-- ============================================================
-- KICKSOFT — Migration v3 : Product Media (images + vidéos)
-- Exécutez dans Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_media (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  url         TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'image', -- 'image' ou 'video'
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les images publiées
DROP POLICY IF EXISTS "media_public_read" ON public.product_media;
CREATE POLICY "media_public_read" ON public.product_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_media.product_id
        AND (products.status = 'published' OR public.is_admin())
    )
  );

-- Admin peut tout gérer
DROP POLICY IF EXISTS "media_admin_insert" ON public.product_media;
CREATE POLICY "media_admin_insert" ON public.product_media
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "media_admin_update" ON public.product_media;
CREATE POLICY "media_admin_update" ON public.product_media
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "media_admin_delete" ON public.product_media;
CREATE POLICY "media_admin_delete" ON public.product_media
  FOR DELETE USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
