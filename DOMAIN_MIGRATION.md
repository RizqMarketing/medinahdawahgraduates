# Domain migration: netlify.app → madinahdawahgraduates.com

Run this when DNS for `madinahdawahgraduates.com` is ready and the founder approves the switch. Top to bottom, one section at a time.

---

## 1. Netlify — add custom domain + SSL

**Where:** Netlify site → Domain management
Direct link: https://app.netlify.com/ (pick the MDG site → Domain management)

- [ ] Add custom domain: `madinahdawahgraduates.com`
- [ ] Add subdomain alias: `www.madinahdawahgraduates.com`
- [ ] Decide which is primary — recommend apex (`madinahdawahgraduates.com`) as primary, `www` as redirect
- [ ] Configure DNS at your registrar:
  - Apex: A records → Netlify's IPs (Netlify will show them), or ALIAS/ANAME to `<site>.netlify.app` if registrar supports it
  - `www`: CNAME to `<site>.netlify.app`
- [ ] Wait for DNS to propagate (usually 5–30 min; can take up to 24h)
- [ ] Netlify auto-provisions Let's Encrypt SSL — should see "HTTPS" enabled without manual action
- [ ] Open `https://madinahdawahgraduates.com` in a fresh browser — should load the app with a valid cert

---

## 2. Supabase — switch Site URL

**Where:** Supabase Dashboard → Authentication → URL Configuration
Direct link: https://supabase.com/dashboard/project/ihjaenemczxkspmydbvz/auth/url-configuration

- [ ] Change **Site URL** from `https://madinahdawahgraduates.netlify.app` to `https://madinahdawahgraduates.com`
- [ ] Click **Save changes**
- [ ] Redirect URLs list: confirm both of these are present (should already be pre-added from pilot launch):
  - `https://madinahdawahgraduates.com/**`
  - `https://www.madinahdawahgraduates.com/**`
- [ ] Optional: remove `https://madinahdawahgraduates.netlify.app/**` from redirect list if you want to force traffic through the new domain only. (Keeping it is harmless — auth still works from both URLs until users are migrated.)

---

## 3. App config — update hardcoded URLs

Most of the app uses `window.location.origin` so it follows whichever domain the user is on. The handful of hardcoded references:

- [ ] `PILOT_LAUNCH.md` — section 6, both graduate + sponsor onboarding WhatsApp messages. Replace `https://madinahdawahgraduates.netlify.app` with `https://madinahdawahgraduates.com` (4 occurrences).
- [ ] Search once more to catch any drift:
  ```
  grep -rn "netlify.app" src/ public/ *.md
  ```
  Review + replace any other hardcoded references.
- [ ] Commit + push:
  ```
  git commit -m "Switch onboarding URLs to madinahdawahgraduates.com"
  git push
  ```

---

## 4. Email templates — no change needed

The 4 bilingual email templates use `{{ .ConfirmationURL }}` which Supabase generates dynamically from the current Site URL. After Step 2, new emails will point to the new domain automatically. Nothing to paste.

---

## 5. Verification (do BEFORE telling existing graduates)

- [ ] Open `https://madinahdawahgraduates.com` in incognito → admin login works
- [ ] Trigger "Forgot password?" with your own email → email arrives → link goes to `https://madinahdawahgraduates.com/reset-password` (not netlify.app)
- [ ] Set a new password → redirects to `https://madinahdawahgraduates.com/login`
- [ ] Create a throwaway graduate via invite flow → the WhatsApp message preview shows the new domain in the login link
- [ ] Delete the throwaway

---

## 6. Tell the graduates + sponsors

- [ ] WhatsApp message to active graduates + sponsors: "System has moved to https://madinahdawahgraduates.com — please bookmark the new address. Old netlify.app link still works but will be retired."
- [ ] Keep netlify.app working for ~30 days as a grace period. After that:
  - Remove the `netlify.app/**` entry from Supabase redirect URLs
  - Optional: set up a Netlify redirect rule in `netlify.toml` that 301s the old domain to the new one

---

## Known caveats

- **Email clients may cache old URLs** — anyone who received a magic-link or reset email before the switch still has a netlify.app link. Those expire after 1 hour anyway, so this is mostly a next-day concern.
- **SSL cert provisioning can take ~1–5 min** after Netlify sees DNS — if HTTPS shows a warning right after switching, wait and refresh.
- **Test from at least two devices / one mobile** — some DNS caches lag. If it works on desktop but not phone, don't panic; give it an hour.
