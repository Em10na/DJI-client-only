-- ============================================================
-- KICKSOFT STUDIO — Creation de TOUTES les tables
-- Executez ce fichier en PREMIER dans Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

INSERT INTO public.roles (name) VALUES ('admin') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.roles (name) VALUES ('manager') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.roles (name) VALUES ('client') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role_id UUID REFERENCES public.roles(id),
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. COLLECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  compare_price NUMERIC,
  stock INTEGER NOT NULL DEFAULT 0,
  short_description TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. TEMPLATES (page accueil)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL DEFAULT 'home',
  title TEXT,
  subtitle TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. PAGES (statiques)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. POSTS (blog)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. FAQS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.faq (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. TICKETS SUPPORT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tickets_support (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 13. NEWSLETTER SUBSCRIBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 14. WISHLIST (favoris)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);


-- ============================================================
-- FONCTIONS UTILITAIRES
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
-- RLS — activer sur toutes les tables
-- ============================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ROLES
DROP POLICY IF EXISTS "roles_public_read" ON public.roles;
CREATE POLICY "roles_public_read" ON public.roles FOR SELECT USING (true);
DROP POLICY IF EXISTS "roles_admin_manage" ON public.roles;
CREATE POLICY "roles_admin_manage" ON public.roles FOR ALL USING (public.is_admin());

-- PROFILES
DROP POLICY IF EXISTS "profiles_owner_read" ON public.profiles;
CREATE POLICY "profiles_owner_read" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
CREATE POLICY "profiles_owner_update" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid() OR public.is_admin());

-- CATEGORIES
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_admin_insert" ON public.categories;
CREATE POLICY "categories_admin_insert" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "categories_admin_update" ON public.categories;
CREATE POLICY "categories_admin_update" ON public.categories FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;
CREATE POLICY "categories_admin_delete" ON public.categories FOR DELETE USING (public.is_admin());

-- COLLECTIONS
DROP POLICY IF EXISTS "collections_public_read" ON public.collections;
CREATE POLICY "collections_public_read" ON public.collections FOR SELECT USING (true);
DROP POLICY IF EXISTS "collections_admin_manage" ON public.collections;
CREATE POLICY "collections_admin_manage" ON public.collections FOR ALL USING (public.is_admin());

-- PRODUCTS
DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (status = 'published' OR public.is_admin());
DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
CREATE POLICY "products_admin_insert" ON public.products FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "products_admin_update" ON public.products;
CREATE POLICY "products_admin_update" ON public.products FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
CREATE POLICY "products_admin_delete" ON public.products FOR DELETE USING (public.is_admin());

-- ORDERS
DROP POLICY IF EXISTS "orders_owner_read" ON public.orders;
CREATE POLICY "orders_owner_read" ON public.orders FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "orders_owner_insert" ON public.orders;
CREATE POLICY "orders_owner_insert" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;
CREATE POLICY "orders_admin_delete" ON public.orders FOR DELETE USING (public.is_admin());

-- ORDER ITEMS
DROP POLICY IF EXISTS "order_items_owner_read" ON public.order_items;
CREATE POLICY "order_items_owner_read" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);

-- TEMPLATES
DROP POLICY IF EXISTS "templates_public_read" ON public.templates;
CREATE POLICY "templates_public_read" ON public.templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "templates_admin_manage" ON public.templates;
CREATE POLICY "templates_admin_manage" ON public.templates FOR ALL USING (public.is_admin());

-- PAGES
DROP POLICY IF EXISTS "pages_public_read" ON public.pages;
CREATE POLICY "pages_public_read" ON public.pages FOR SELECT USING (published = true OR public.is_admin());
DROP POLICY IF EXISTS "pages_admin_manage" ON public.pages;
CREATE POLICY "pages_admin_manage" ON public.pages FOR ALL USING (public.is_admin());

-- POSTS
DROP POLICY IF EXISTS "posts_public_read" ON public.posts;
CREATE POLICY "posts_public_read" ON public.posts FOR SELECT USING (published = true OR public.is_admin());
DROP POLICY IF EXISTS "posts_admin_manage" ON public.posts;
CREATE POLICY "posts_admin_manage" ON public.posts FOR ALL USING (public.is_admin());

-- FAQS
DROP POLICY IF EXISTS "faqs_public_read" ON public.faq;
CREATE POLICY "faqs_public_read" ON public.faq FOR SELECT USING (true);
DROP POLICY IF EXISTS "faqs_admin_manage" ON public.faq;
CREATE POLICY "faqs_admin_manage" ON public.faq FOR ALL USING (public.is_admin());

-- TICKETS SUPPORT
DROP POLICY IF EXISTS "tickets_owner_read" ON public.tickets_support;
CREATE POLICY "tickets_owner_read" ON public.tickets_support FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "tickets_owner_insert" ON public.tickets_support;
CREATE POLICY "tickets_owner_insert" ON public.tickets_support FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "tickets_admin_update" ON public.tickets_support;
CREATE POLICY "tickets_admin_update" ON public.tickets_support FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "tickets_admin_delete" ON public.tickets_support;
CREATE POLICY "tickets_admin_delete" ON public.tickets_support FOR DELETE USING (public.is_admin());

-- NEWSLETTER
DROP POLICY IF EXISTS "newsletter_admin_read" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_read" ON public.newsletter_subscribers FOR SELECT USING (public.is_admin() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "newsletter_public_insert" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_public_insert" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "newsletter_admin_update" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_update" ON public.newsletter_subscribers FOR UPDATE USING (public.is_admin() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "newsletter_admin_delete" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_delete" ON public.newsletter_subscribers FOR DELETE USING (public.is_admin());

-- WISHLIST
DROP POLICY IF EXISTS "wishlist_owner" ON public.wishlist;
CREATE POLICY "wishlist_owner" ON public.wishlist FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- Recharger le schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';


-- ============================================================
-- RESUME : 14 tables creees
-- ============================================================
-- 1.  roles
-- 2.  profiles
-- 3.  categories
-- 4.  collections
-- 5.  products
-- 6.  orders
-- 7.  order_items
-- 8.  templates
-- 9.  pages
-- 10. posts
-- 11. faqs
-- 12. tickets_support
-- 13. newsletter_subscribers
-- 14. wishlist
-- ============================================================
