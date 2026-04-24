# Pilot launch checklist

Clean-slate launch with the first real graduate + sponsor pair.
Work top-to-bottom on launch day. Everything marked **MANUAL** can't be scripted — Mazin does it in the Supabase / Netlify dashboards.

---

## 1. Pre-launch (before touching prod)

- [ ] Owner/admin has confirmed **which graduate + which sponsor** are the pilot pair (WhatsApp)
- [ ] Their WhatsApp numbers + preferred language (EN/AR) on hand
- [ ] You know the admin Supabase login for running the reset migration

---

## 2. Wipe the database (clean slate)

- [ ] **MANUAL:** Supabase Dashboard → SQL Editor → paste + run `supabase/migrations/0021_reset_for_launch.sql`
  - Last `select` in the migration will show row counts — confirm all operational tables are `0`
  - `profiles` should show 1 (admin) or however many admins you kept
- [ ] **MANUAL:** Supabase Dashboard → Auth → Users → delete every non-admin auth user.
  Before deleting, run this in SQL Editor to identify which auth user holds the admin profile — that's the ONE to keep:
  ```sql
  select u.id, u.email, p.role
  from auth.users u left join profiles p on p.id = u.id;
  ```
  Delete every row where `role` is null or not 'admin'. If you delete the row with `role = 'admin'`, the profiles cascade wipes the admin profile and login succeeds but routes nowhere — recovery is inserting a new profile via service_role.
- [ ] **MANUAL:** Supabase Dashboard → Storage → `report-media` → select all → delete objects
- [ ] **MANUAL:** Supabase Dashboard → Storage → `graduate-photos` → delete every demo photo (Musa's demo photo too — the real graduate will upload their own)

---

## 3. Arabic email templates (one-time, must be done before invites go out)

Supabase Auth sends English-only emails by default. If the pilot pair is Arabic-first, they'll receive English when clicking "forgot password" or receiving an invite. Paste the bilingual templates below into:

**Supabase Dashboard → Authentication → Email Templates**

Supabase variables to keep: `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`.

### 3a. Reset Password (most critical — graduates will use this)

**Subject:**
```
Madinah Dawah Graduates — إعادة تعيين كلمة المرور / Password reset
```

**Body (HTML):**
```html
<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right; padding: 16px; line-height: 1.8;">
  <p>السلام عليكم ورحمة الله وبركاته،</p>
  <p>وصلنا طلب لإعادة تعيين كلمة المرور الخاصة بحسابك في "خريجي دعوة المدينة".</p>
  <p>اضغط على الرابط أدناه لتعيين كلمة مرور جديدة. هذا الرابط صالح لفترة محدودة.</p>
  <p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #0a7a4b; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">إعادة تعيين كلمة المرور</a></p>
  <p style="color: #666; font-size: 13px;">إن لم تطلب ذلك، يمكنك تجاهل هذا البريد.</p>
</div>
<hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
<div dir="ltr" style="font-family: Arial, sans-serif; padding: 16px; line-height: 1.6;">
  <p>Assalamu alaykum wa rahmatullahi wa barakatuh,</p>
  <p>We received a request to reset the password for your Madinah Dawah Graduates account.</p>
  <p>Click the link below to set a new password. The link expires shortly.</p>
  <p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #0a7a4b; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Reset password</a></p>
  <p style="color: #666; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
</div>
```

### 3b. Confirm Signup

**Subject:**
```
Madinah Dawah Graduates — تأكيد البريد الإلكتروني / Confirm your email
```

**Body (HTML):**
```html
<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right; padding: 16px; line-height: 1.8;">
  <p>السلام عليكم ورحمة الله وبركاته،</p>
  <p>جزاك الله خيراً على الانضمام إلى "خريجي دعوة المدينة". اضغط على الرابط أدناه لتأكيد بريدك الإلكتروني.</p>
  <p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #0a7a4b; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">تأكيد البريد</a></p>
</div>
<hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
<div dir="ltr" style="font-family: Arial, sans-serif; padding: 16px; line-height: 1.6;">
  <p>Assalamu alaykum wa rahmatullahi wa barakatuh,</p>
  <p>JazakAllahu khayran for joining Madinah Dawah Graduates. Click the link below to confirm your email.</p>
  <p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #0a7a4b; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Confirm email</a></p>
</div>
```

### 3c. Magic Link (only matters if you enable passwordless login)

**Subject:**
```
Madinah Dawah Graduates — رابط تسجيل الدخول / Your login link
```

**Body (HTML):**
```html
<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right; padding: 16px; line-height: 1.8;">
  <p>السلام عليكم ورحمة الله وبركاته،</p>
  <p>اضغط على الرابط أدناه لتسجيل الدخول إلى "خريجي دعوة المدينة". الرابط صالح لفترة محدودة.</p>
  <p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #0a7a4b; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">تسجيل الدخول</a></p>
</div>
<hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
<div dir="ltr" style="font-family: Arial, sans-serif; padding: 16px; line-height: 1.6;">
  <p>Assalamu alaykum wa rahmatullahi wa barakatuh,</p>
  <p>Click the link below to sign in to Madinah Dawah Graduates. The link expires shortly.</p>
  <p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #0a7a4b; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Sign in</a></p>
</div>
```

### 3d. Invite User (only if you switch away from the temp-password flow)

**Subject:**
```
Madinah Dawah Graduates — دعوة للانضمام / You're invited
```

**Body (HTML):**
```html
<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right; padding: 16px; line-height: 1.8;">
  <p>السلام عليكم ورحمة الله وبركاته،</p>
  <p>تمت دعوتك للانضمام إلى "خريجي دعوة المدينة". اضغط أدناه لإعداد حسابك.</p>
  <p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #0a7a4b; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">إعداد الحساب</a></p>
</div>
<hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
<div dir="ltr" style="font-family: Arial, sans-serif; padding: 16px; line-height: 1.6;">
  <p>Assalamu alaykum wa rahmatullahi wa barakatuh,</p>
  <p>You've been invited to join Madinah Dawah Graduates. Click below to set up your account.</p>
  <p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #0a7a4b; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Set up account</a></p>
</div>
```

---

## 4. Netlify / env sanity check

- [ ] **MANUAL:** Netlify site → Environment variables → confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` still match the project you just wiped
- [ ] Open the live URL in an incognito window → confirm the page loads without console errors and that logging in as admin works

---

## 5. Dry run with a throwaway test account (before the real invite)

This catches anything broken by the wipe + email templates before the real pair sees it.

- [ ] Log in as admin → create a throwaway graduate via the invite flow → note the temp password
- [ ] Log out → log in with throwaway creds → file a report with a photo + voice note → submit
- [ ] Trigger a password reset on the throwaway account → confirm the Arabic/English email arrives and the reset link works
- [ ] Log back in as admin → create a throwaway sponsor → assign them to the test graduate → log in as sponsor → confirm the sponsor dashboard renders the report with media
- [ ] Once confirmed clean: **delete the throwaway accounts** (Supabase → Auth → Users) and truncate content again if needed (re-run 0021)

---

## 6. Real pilot invite

- [ ] Admin creates the real graduate account → copies temp password
- [ ] Send the onboarding WhatsApp message below to the graduate (along with temp password)
- [ ] Admin creates the real sponsor account → assigns the graduate → copies temp password
- [ ] Send the onboarding WhatsApp message below to the sponsor (along with temp password)

### Graduate onboarding WhatsApp message

**English version:**
```
Assalamu alaykum wa rahmatullah,

JazakAllahu khayran for being part of Madinah Dawah Graduates. This is the new system your sponsor will use to see your work, in sha Allah.

🔗 Link: https://madinahdawahgraduates.com
📧 Email: <their email>
🔑 Temporary password: <paste here>

After logging in, please change your password from the profile menu.

To start: just file today's report — your activities, hours, and one short video or voice note (under 30 seconds) showing a moment from your teaching. Your sponsor will see it automatically.

BarakAllahu feek. If anything is unclear just send me a message here.
```

**Arabic version:**
```
السلام عليكم ورحمة الله وبركاته،

جزاك الله خيراً على كونك جزءًا من "خريجي دعوة المدينة". هذا هو النظام الجديد الذي سيستخدمه الممول لمتابعة عملك إن شاء الله.

🔗 الرابط: https://madinahdawahgraduates.com
📧 البريد: <بريدك>
🔑 كلمة المرور المؤقتة: <انسخها هنا>

بعد تسجيل الدخول، يرجى تغيير كلمة المرور من قائمة الملف الشخصي.

للبدء: فقط قم بتقديم تقرير اليوم — أنشطتك، الساعات، ومقطع فيديو قصير أو رسالة صوتية (أقل من ٣٠ ثانية) تُظهر لحظة من تدريسك. سيراه الممول تلقائيًا.

بارك الله فيك. إن كان هناك أي غموض أرسل لي رسالة هنا.
```

### Sponsor onboarding WhatsApp message

**English version:**
```
Assalamu alaykum wa rahmatullah,

JazakAllahu khayran for your support. This is the new platform where you'll see the daily work of the graduate you're sponsoring, in sha Allah.

🔗 Link: https://madinahdawahgraduates.com
📧 Email: <their email>
🔑 Temporary password: <paste here>

After logging in, please change your password from the profile menu.

You'll see your graduate's daily reports, a short video or voice note from them most days, their monthly hours, and the subjects they teach. No action needed from your side — just a window into the work your sadaqah is enabling.

BarakAllahu feek.
```

**Arabic version:**
```
السلام عليكم ورحمة الله وبركاته،

جزاك الله خيراً على دعمك. هذه هي المنصة الجديدة التي سترى فيها العمل اليومي للخريج الذي تكفله إن شاء الله.

🔗 الرابط: https://madinahdawahgraduates.com
📧 البريد: <بريدك>
🔑 كلمة المرور المؤقتة: <انسخها هنا>

بعد تسجيل الدخول، يرجى تغيير كلمة المرور من قائمة الملف الشخصي.

سترى تقارير الخريج اليومية، ومقطعاً قصيراً أو رسالة صوتية منه في معظم الأيام، وساعاته الشهرية، والمواد التي يدرّسها. لا يُطلب منك أي إجراء — فقط نافذة على العمل الذي تمكّنه صدقتك.

بارك الله فيك.
```

---

## 7. First 72 hours — watch for

- [ ] Did the graduate file their first report? If not by day 2, gentle check-in on WhatsApp
- [ ] Does the sponsor see the report? (Admin can log in as themselves and spot-check via admin view)
- [ ] Any Supabase errors? → Supabase Dashboard → Logs → Postgres logs / Edge function logs
- [ ] Any JS errors? → Open the live URL, check browser console, ask the pair if anything looked broken
- [ ] Did anyone click "forgot password"? Confirm Arabic/English template arrived correctly

Collect anything surprising into memory + the WhatsApp group so the owner sees progress.

---

## Known gaps accepted for this pilot (fix only if they actually surface)

- Arabic plurals use single form (grammatically off for count≠1, but readable)
- Numbers inside Arabic sentences not yet wrapped in `<bdi>` (can scramble visually on some devices)
- Activity category dropdown UI isn't wired (migration 0013 is in DB, report form still uses free-text — subject breakdown still works via `subjects.js` regex)
- Browser-native validation tooltips + native date pickers use OS locale, not app locale
