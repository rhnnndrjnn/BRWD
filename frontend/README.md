# BRWD. Florencia — website update

Copy `src/` over your project's `src/` (keep your own `src/assets/logo.png`), then:

```bash
npm i @supabase/supabase-js
cp .env.example .env      # fill in your Supabase URL + anon key
npm run dev
```

Your `tailwind.config.js` already needs the `earth` colour scale (unchanged).

## Supabase setup (5 minutes)

1. Create a project → **SQL Editor** → paste and run `supabase/schema.sql`
   (tables, security rules, realtime, the `brwd` storage bucket, and the menu seed).
2. **Authentication → Users → Add user** (tick _Auto confirm_) for the owner and each employee.
3. Link each one to a username + role with the two `insert into profiles …` statements at the bottom of `schema.sql`.
4. Put the project URL and anon key in `.env`.

Staff sign in at **/employee** and **/owner** with that username + password.
With no `.env` the site runs in **demo mode** (data saved in the browser; logins `employee / employee123` and `owner / owner123`).

## Where things are

- `lib/db.js` – every Supabase call (and the demo-mode twin). `lib/cart.js` – browser-storage cart.
- `pages/` – customer pages, `pages/Employee.jsx`, `pages/Owner.jsx`; `components/staff/` – portal panels.
- Prices: 22oz defaults to +₱20 (`SIZE_UPCHARGE`), add-ons ₱9 (`ADDON_PRICE`), add-on names per category in `lib/constants.js`.
