-- BRWD. Florencia — Supabase schema
-- Run this whole file once in Supabase > SQL Editor.

create extension if not exists "pgcrypto";

/* ---------------------------------------------------------------- tables */
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role text not null check (role in ('employee', 'owner'))
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  detail text default '',
  price numeric not null,
  price_22 numeric,
  category text not null check (category in ('Coffee','Milktea','Frappe','Fruit Tea','Other')),
  image text default '',
  available boolean not null default true,
  has_hot boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists beans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  available boolean not null default true
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_name text not null,
  phone text default '',
  payment_method text not null check (payment_method in ('cash','gcash')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','verifying','paid','rejected')),
  receipt_url text,
  arrival_time timestamptz not null,
  items jsonb not null,
  total numeric not null,
  note text default '',
  status text not null default 'pending'
    check (status in ('pending','preparing','ready','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  body text default '',
  order_code text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

/* -------------------------------------------------------------- helpers */
create or replace function is_staff() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;

create or replace function is_owner() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'owner');
$$;

-- username -> login email (the login form only asks for a username)
create or replace function email_for_username(u text) returns text
language sql security definer set search_path = public, auth stable as $$
  select au.email from profiles p join auth.users au on au.id = p.id
  where lower(p.username) = lower(u) limit 1;
$$;

-- customers track their own orders by code (they cannot read the orders table)
create or replace function orders_by_codes(codes text[]) returns setof orders
language sql security definer set search_path = public stable as $$
  select * from orders where code = any(codes) order by created_at desc;
$$;

create or replace function attach_receipt(p_code text, p_url text) returns void
language sql security definer set search_path = public as $$
  update orders set receipt_url = p_url, payment_status = 'verifying'
  where code = p_code and payment_method = 'gcash' and status <> 'cancelled';
$$;

grant execute on function email_for_username(text) to anon, authenticated;
grant execute on function orders_by_codes(text[]) to anon, authenticated;
grant execute on function attach_receipt(text, text) to anon, authenticated;

/* ------------------------------------------------------------------ RLS */
alter table profiles enable row level security;
alter table products enable row level security;
alter table beans enable row level security;
alter table orders enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table settings enable row level security;

-- profiles: you can read and rename yourself (role can't be changed from the app)
create policy "own profile read" on profiles for select to authenticated using (id = auth.uid());
create policy "own profile rename" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

-- menu is public; employees can toggle availability, owner can do everything
create policy "products public read" on products for select using (true);
create policy "products staff update" on products for update to authenticated using (is_staff());
create policy "products owner insert" on products for insert to authenticated with check (is_owner());
create policy "products owner delete" on products for delete to authenticated using (is_owner());

-- employees may only flip availability; every other column change needs the owner
create or replace function guard_product_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_owner() and (
    new.name is distinct from old.name or new.detail is distinct from old.detail or
    new.price is distinct from old.price or new.price_22 is distinct from old.price_22 or
    new.category is distinct from old.category or new.image is distinct from old.image or
    new.has_hot is distinct from old.has_hot
  ) then
    raise exception 'Only the owner can edit product details';
  end if;
  return new;
end $$;
create trigger products_guard before update on products
  for each row execute function guard_product_update();

create policy "beans public read" on beans for select using (true);
create policy "beans staff update" on beans for update to authenticated using (is_staff());
create policy "beans owner write" on beans for insert to authenticated with check (is_owner());

create policy "settings public read" on settings for select using (true);
create policy "settings staff write" on settings for all to authenticated
  using (is_staff()) with check (is_staff());

-- orders: anyone can place one, only staff can see/update them
create policy "orders customer insert" on orders for insert to anon, authenticated with check (true);
create policy "orders staff read" on orders for select to authenticated using (is_staff());
create policy "orders staff update" on orders for update to authenticated using (is_staff());

-- messages: anyone can send, staff read/update, owner delete
create policy "messages insert" on messages for insert to anon, authenticated with check (true);
create policy "messages staff read" on messages for select to authenticated using (is_staff());
create policy "messages staff update" on messages for update to authenticated using (is_staff());
create policy "messages owner delete" on messages for delete to authenticated using (is_owner());

-- notifications: created by the app on every transaction, read by staff
create policy "notifications insert" on notifications for insert to anon, authenticated with check (true);
create policy "notifications staff read" on notifications for select to authenticated using (is_staff());
create policy "notifications staff update" on notifications for update to authenticated using (is_staff());

/* ------------------------------------------------------------- realtime */
alter publication supabase_realtime add table orders, messages, notifications, products, beans, settings;

/* -------------------------------------------------------------- storage */
insert into storage.buckets (id, name, public) values ('brwd', 'brwd', true)
on conflict (id) do nothing;

create policy "brwd public read" on storage.objects for select using (bucket_id = 'brwd');
create policy "brwd receipts upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'brwd' and (storage.foldername(name))[1] = 'receipts');
create policy "brwd staff upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'brwd' and is_staff());

/* ----------------------------------------------------------------- seed */
insert into beans (name) values ('Premium Arabica'), ('Premium Barako'), ('Premium Robusta')
on conflict do nothing;

insert into settings (key, value) values
  ('store_open', '{"open": true}'),
  ('gcash', '{"name": "BRWD Florencia", "number": "0918-937-0101", "qr": ""}')
on conflict do nothing;

insert into products (name, detail, price, price_22, category, image, has_hot) values
('Florencia Latte','Double espresso, silky milk, and a soft cocoa finish',135,155,'Coffee','https://images.unsplash.com/photo-1565252556328-92ee4a9a0983?auto=format&fit=crop&w=1000&q=82',true),
('Sea Salt Spanish','Condensed milk, sea salt cream, and rich espresso',155,175,'Coffee','https://images.unsplash.com/photo-1553329537-7a06eb26021c?auto=format&fit=crop&w=1000&q=82',true),
('Brown Sugar Americano','Espresso, muscovado, and filtered water',125,145,'Coffee','https://images.unsplash.com/photo-1593200934786-75d1c755ceb3?auto=format&fit=crop&w=1000&q=82',true),
('Oat Cappuccino','Double espresso with velvety steamed oat milk',160,180,'Coffee','https://images.unsplash.com/photo-1520903304654-28bd223f96d7?auto=format&fit=crop&w=1000&q=82',true),
('Dark Mocha Frappe','Cocoa, espresso, milk, and whipped cream',175,195,'Frappe','https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1000&q=82',false),
('Caramel Cloud','Caramel, coffee, fresh milk, and whipped cream',175,195,'Frappe','https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=1000&q=82',false),
('Matcha Cream','Ceremonial matcha, milk, and whipped cream',185,205,'Frappe','https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=1000&q=82',false),
('Cookies & Cream','Chocolate cookies, fresh milk, and soft cream',170,190,'Frappe','https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=1000&q=82',false),
('Brown Sugar Pearl','Fresh milk, chewy pearls, and dark muscovado',155,175,'Milktea','https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=1000&q=82',false),
('Wintermelon Cream','Wintermelon tea with lightly salted cheese foam',145,165,'Milktea','https://images.unsplash.com/photo-1525803377221-4f6ccdaa5133?auto=format&fit=crop&w=1000&q=82',false),
('Classic Okinawa','Roasted brown sugar and house black milk tea',145,165,'Milktea','https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&w=1000&q=82',false),
('Jasmine Honey','Fragrant jasmine tea, fresh milk, and wild honey',150,170,'Milktea','https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=82',false),
('Strawberry Fruit Tea','Black tea shaken with strawberry and fresh fruit',140,160,'Fruit Tea','https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&w=1000&q=82',false),
('Passion Fruit Green Tea','Jasmine green tea with tangy passion fruit',140,160,'Fruit Tea','https://images.unsplash.com/photo-1525803377221-4f6ccdaa5133?auto=format&fit=crop&w=1000&q=82',false),
('Lychee Peach Tea','Light peach tea with lychee and nata de coco',145,165,'Fruit Tea','https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=82',false),
('Mango Pomelo','Sweet mango, pomelo bits, and chilled green tea',150,170,'Fruit Tea','https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=1000&q=82',false),
('Butter Croissant','Flaky, golden, and baked fresh every morning',95,null,'Other','https://images.unsplash.com/photo-1565252556328-92ee4a9a0983?auto=format&fit=crop&w=1000&q=82',false),
('Chocolate Crumb','Dark chocolate cake with a crisp cocoa crumble',115,null,'Other','https://images.unsplash.com/photo-1534432182912-63863115e106?auto=format&fit=crop&w=1000&q=82',false),
('Café Cocoa','Single-origin cocoa and delicately steamed milk',135,null,'Other','https://images.unsplash.com/photo-1593200934786-75d1c755ceb3?auto=format&fit=crop&w=1000&q=82',false),
('Morning Pairing','A butter croissant served with brewed coffee',185,null,'Other','https://images.unsplash.com/photo-1520903304654-28bd223f96d7?auto=format&fit=crop&w=1000&q=82',false);

/* ------------------------------------------------- creating staff accounts
1. Supabase > Authentication > Users > "Add user" (tick "Auto confirm user").
   Use any email you control, e.g. owner@yourdomain.com, and a password.
2. Then link it to a username + role (replace the email / username):

   insert into profiles (id, username, role)
   select id, 'owner', 'owner' from auth.users where email = 'owner@yourdomain.com';

   insert into profiles (id, username, role)
   select id, 'employee', 'employee' from auth.users where email = 'employee@yourdomain.com';

Staff then log in at /employee or /owner with the username + password.
*/
