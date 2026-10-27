# Viva

Vite + React + Supabase. Google sign-in, admin-approved contributions, all data behind RPC functions.

## Setup
1. `cp .env.example .env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` (publishable key).
2. `npm install`, then `npm run dev`.
3. Database: `supabase/schema.sql`. Data load: `SBP=<access token> SUPABASE_REF=<ref> python -I scripts/import_workbook.py viva_question_bank_with_proctor_reviews.xlsx`.
4. Supabase > Authentication > Providers > Google: add the Google client ID and secret. Add the production URL under URL Configuration.
5. Admins are the emails in `public.admin_emails`.
