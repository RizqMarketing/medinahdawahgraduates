# Deploy + handover checklist

Run through these before sending the founder the live URL.

---

## 1. Supabase

- [ ] Run migration `0010_rollup_enriched.sql` in SQL Editor (the last un-run one)
- [ ] Verify all 7 tables exist in Table Editor
- [ ] Verify 2 storage buckets exist: `graduate-photos` (public), `report-media` (private)
- [ ] **Authentication → Providers → Email**: disable "Allow new users to sign up" — only admin creates accounts
- [ ] *(Optional for launch)* Re-enable "Confirm email" if we want new users to verify before login
- [ ] Verify edge function `invite-user` is deployed and healthy

## 2. Netlify environment variables

In Netlify site settings → Environment variables:
- [ ] `VITE_SUPABASE_URL` = `https://ihjaenemczxkspmydbvz.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = (the anon key from Supabase → Settings → API)

## 3. GitHub

- [ ] Push the current `main` branch so Netlify auto-deploys
- [ ] Invite founder as repo collaborator (GitHub → Settings → Collaborators)
- [ ] Add a short README summarising what the project is

## 4. Clean up test data

Decide based on what you want the founder to see:
- [ ] Keep Musa as the demo graduate (real person from founder's Telegram, safe to show)
- [ ] Delete `admin@mdg.test`, `sponsor@mdg.test`, `graduate@mdg.test` auth users OR rename them for clarity
- [ ] Create real admin account for the founder before handover
- [ ] Seed the other 18 real graduates from the Telegram channel

## 5. Final walkthrough

Open in a fresh incognito window and walk each role:
- [ ] Admin flow: login → see dashboard → add a graduate → invite them → see invite WhatsApp message
- [ ] Graduate flow: login → submit today's report (with photo + voice note) → see it live
- [ ] Sponsor flow: login → see their graduate's report with media → scroll through heatmap
- [ ] Month navigation: past months are frozen, current month is live

## 6. Delivery

- [ ] Record the 60-second demo video (see `DEMO_SCRIPT.md`)
- [ ] Compose the WhatsApp message with: demo video + live URL + founder's admin credentials
- [ ] Send in the shared WhatsApp group
- [ ] **Share `HANDOVER.md`** as an attachment so he has the getting-started guide

## 7. Post-delivery

- [ ] Be on standby for questions
- [ ] Watch for any Supabase errors via the project's Logs tab
- [ ] Ask for feedback after 2-3 days of use
