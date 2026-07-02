-- ================================================================
-- Migration v4 — Product Reviews (avis clients)
-- Ratings + comments + sentiment analysis
-- Run this in the Supabase SQL Editor
-- ================================================================

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  -- Sentiment analysis result: 'positif' | 'neutre' | 'negatif'
  sentiment text not null default 'neutre',
  -- Raw sentiment score (-1.0 .. +1.0)
  sentiment_score numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists reviews_product_idx on reviews (product_id, created_at desc);

-- RLS: public read, writes only via service role (API route with profanity filter)
alter table reviews enable row level security;

drop policy if exists "reviews_public_read" on reviews;
create policy "reviews_public_read"
  on reviews for select
  using (true);

-- No insert/update/delete policies: only the service-role key
-- (used by /api/reviews after moderation) can write.
