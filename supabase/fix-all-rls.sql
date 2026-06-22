-- ============================================================
-- KICKSOFT — SECURITE COMPLETE (cahier de charge)
-- ============================================================
-- REGLES :
--   1. Produits publies, categories, contenus publics → lisibles par tous
--   2. Commandes, adresses, paniers → lisibles uniquement par le proprietaire
--   3. Admins → CRUD complet sur les contenus selon leur role
--   4. Paiements/webhooks → service_role key cote serveur uniquement
-- ============================================================


-- ============================================================
-- 1. FONCTIONS UTILITAIRES
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT r.name
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('admin', 'manager')
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- 2. ASSIGNER LE ROLE ADMIN
-- ============================================================

UPDATE profiles
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE id = (SELECT id FROM auth.users WHERE email = 'omrichayma76@gmail.com');


-- ============================================================
-- 3. ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 4. CONTENU PUBLIC — lisible par tous
--    (categories, produits publies, pages publiees, posts,
--     faq, templates, product_media, product_specs, product_variants)
-- ============================================================

-- ROLES (lecture publique)
DROP POLICY IF EXISTS "roles_public_read" ON public.roles;
CREATE POLICY "roles_public_read" ON public.roles FOR SELECT USING (true);
DROP POLICY IF EXISTS "roles_admin_manage" ON public.roles;
CREATE POLICY "roles_admin_manage" ON public.roles FOR ALL USING (public.is_admin());

-- CATEGORIES (lecture publique / CRUD admin)
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_admin_insert" ON public.categories;
CREATE POLICY "categories_admin_insert" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "categories_admin_update" ON public.categories;
CREATE POLICY "categories_admin_update" ON public.categories FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;
CREATE POLICY "categories_admin_delete" ON public.categories FOR DELETE USING (public.is_admin());

-- PRODUCTS (publies → tous / brouillons → admin seulement / CRUD admin)
DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (status = 'published' OR public.is_admin());
DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
CREATE POLICY "products_admin_insert" ON public.products FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "products_admin_update" ON public.products;
CREATE POLICY "products_admin_update" ON public.products FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
CREATE POLICY "products_admin_delete" ON public.products FOR DELETE USING (public.is_admin());

-- PRODUCT MEDIA (lecture publique / CRUD admin)
DROP POLICY IF EXISTS "product_media_read" ON public.product_media;
CREATE POLICY "product_media_read" ON public.product_media FOR SELECT USING (true);
DROP POLICY IF EXISTS "product_media_admin" ON public.product_media;
CREATE POLICY "product_media_admin" ON public.product_media FOR ALL USING (public.is_admin());

-- PRODUCT SPECS (lecture publique / CRUD admin)
DROP POLICY IF EXISTS "product_specs_read" ON public.product_specs;
CREATE POLICY "product_specs_read" ON public.product_specs FOR SELECT USING (true);
DROP POLICY IF EXISTS "product_specs_admin" ON public.product_specs;
CREATE POLICY "product_specs_admin" ON public.product_specs FOR ALL USING (public.is_admin());

-- PRODUCT VARIANTS (lecture publique / CRUD admin)
DROP POLICY IF EXISTS "product_variants_read" ON public.product_variants;
CREATE POLICY "product_variants_read" ON public.product_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "product_variants_admin" ON public.product_variants;
CREATE POLICY "product_variants_admin" ON public.product_variants FOR ALL USING (public.is_admin());

-- TEMPLATES (lecture publique / CRUD admin)
DROP POLICY IF EXISTS "templates_public_read" ON public.templates;
CREATE POLICY "templates_public_read" ON public.templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "templates_admin_manage" ON public.templates;
CREATE POLICY "templates_admin_manage" ON public.templates FOR ALL USING (public.is_admin());

-- PAGES (publiees → tous / CRUD admin)
DROP POLICY IF EXISTS "pages_public_read" ON public.pages;
CREATE POLICY "pages_public_read" ON public.pages FOR SELECT USING (published = true OR public.is_admin());
DROP POLICY IF EXISTS "pages_admin_manage" ON public.pages;
CREATE POLICY "pages_admin_manage" ON public.pages FOR ALL USING (public.is_admin());

-- POSTS (publies → tous / CRUD admin)
DROP POLICY IF EXISTS "posts_public_read" ON public.posts;
CREATE POLICY "posts_public_read" ON public.posts FOR SELECT USING (published = true OR public.is_admin());
DROP POLICY IF EXISTS "posts_admin_manage" ON public.posts;
CREATE POLICY "posts_admin_manage" ON public.posts FOR ALL USING (public.is_admin());

-- FAQ (lecture publique / CRUD admin)
DROP POLICY IF EXISTS "faq_public_read" ON public.faq;
CREATE POLICY "faq_public_read" ON public.faq FOR SELECT USING (true);
DROP POLICY IF EXISTS "faq_admin_manage" ON public.faq;
CREATE POLICY "faq_admin_manage" ON public.faq FOR ALL USING (public.is_admin());


-- ============================================================
-- 5. DONNEES PRIVEES — proprietaire uniquement + admin
--    (commandes, adresses, paniers, profils, favoris)
-- ============================================================

-- PROFILES (le proprietaire lit/modifie le sien / admin voit tout)
DROP POLICY IF EXISTS "profiles_read" ON public.profiles;
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid() OR public.is_admin());

-- ORDERS (proprietaire lit ses commandes / admin voit tout)
DROP POLICY IF EXISTS "orders_read" ON public.orders;
CREATE POLICY "orders_read" ON public.orders FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;
CREATE POLICY "orders_admin_delete" ON public.orders FOR DELETE USING (public.is_admin());

-- ORDER ITEMS (proprietaire via commande / admin)
DROP POLICY IF EXISTS "order_items_read" ON public.order_items;
CREATE POLICY "order_items_read" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);

-- ADDRESSES (proprietaire uniquement / admin voit tout)
DROP POLICY IF EXISTS "addresses_read" ON public.addresses;
CREATE POLICY "addresses_read" ON public.addresses FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "addresses_insert" ON public.addresses;
CREATE POLICY "addresses_insert" ON public.addresses FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "addresses_update" ON public.addresses;
CREATE POLICY "addresses_update" ON public.addresses FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "addresses_delete" ON public.addresses;
CREATE POLICY "addresses_delete" ON public.addresses FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- CARTS (proprietaire uniquement / admin voit tout)
DROP POLICY IF EXISTS "carts_read" ON public.carts;
CREATE POLICY "carts_read" ON public.carts FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "carts_insert" ON public.carts;
CREATE POLICY "carts_insert" ON public.carts FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "carts_update" ON public.carts;
CREATE POLICY "carts_update" ON public.carts FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "carts_delete" ON public.carts;
CREATE POLICY "carts_delete" ON public.carts FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- CART ITEMS (proprietaire via panier)
DROP POLICY IF EXISTS "cart_items_read" ON public.cart_items;
CREATE POLICY "cart_items_read" ON public.cart_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND (carts.user_id = auth.uid() OR public.is_admin()))
);
DROP POLICY IF EXISTS "cart_items_manage" ON public.cart_items;
CREATE POLICY "cart_items_manage" ON public.cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND (carts.user_id = auth.uid() OR public.is_admin()))
);

-- WISHLIST (proprietaire uniquement)
DROP POLICY IF EXISTS "wishlist_owner" ON public.wishlist;
CREATE POLICY "wishlist_owner" ON public.wishlist FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- 6. SUPPORT & NEWSLETTER
-- ============================================================

-- TICKETS SUPPORT (proprietaire + visiteur anonyme peut creer / admin tout)
DROP POLICY IF EXISTS "tickets_read" ON public.tickets_support;
CREATE POLICY "tickets_read" ON public.tickets_support FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "tickets_insert" ON public.tickets_support;
CREATE POLICY "tickets_insert" ON public.tickets_support FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "tickets_admin_update" ON public.tickets_support;
CREATE POLICY "tickets_admin_update" ON public.tickets_support FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "tickets_admin_delete" ON public.tickets_support;
CREATE POLICY "tickets_admin_delete" ON public.tickets_support FOR DELETE USING (public.is_admin());

-- NEWSLETTER (inscription publique / lecture admin + proprietaire)
DROP POLICY IF EXISTS "newsletter_read" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_read" ON public.newsletter_subscribers FOR SELECT USING (
  public.is_admin() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
DROP POLICY IF EXISTS "newsletter_insert" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_insert" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "newsletter_update" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_update" ON public.newsletter_subscribers FOR UPDATE USING (
  public.is_admin() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
DROP POLICY IF EXISTS "newsletter_delete" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_delete" ON public.newsletter_subscribers FOR DELETE USING (public.is_admin());


-- ============================================================
-- 7. RELOAD SCHEMA CACHE
-- ============================================================
NOTIFY pgrst, 'reload schema';


-- ============================================================
-- RESUME SECURITE (cahier de charge)
-- ============================================================
--
-- VISITEUR (non connecte) :
--   LIRE  → produits publies, categories, faq, pages/posts publies,
--           templates, product_media/specs/variants
--   ECRIRE → newsletter (inscription), tickets (formulaire contact)
--
-- CLIENT (connecte, role client) :
--   LIRE  → + ses commandes, order_items, profil, favoris,
--           ses adresses, son panier, ses tickets
--   ECRIRE → commandes, adresses, panier, favoris, tickets, profil
--
-- ADMIN / MANAGER (connecte, role admin/manager) :
--   LIRE  → tout
--   ECRIRE → CRUD complet sur toutes les tables
--
-- PAIEMENT :
--   Les webhooks de paiement utilisent la service_role key
--   (cote serveur uniquement, jamais exposee au frontend)
--
-- ============================================================
