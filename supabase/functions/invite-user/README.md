# invite-user edge function

Admin-only endpoint to create a new auth user + profile (and sponsors/graduates side row).

## Deploy (first time)

```bash
cd madinah-dawah-app
npm install --save-dev supabase
npx supabase login
npx supabase link --project-ref ihjaenemczxkspmydbvz
npx supabase functions deploy invite-user --no-verify-jwt
```

The `--no-verify-jwt` flag is intentional: we verify the JWT manually inside the function so we can enforce "admin role required" before doing anything else.

## Redeploy after edits

```bash
npx supabase functions deploy invite-user --no-verify-jwt
```

## Environment

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase — no manual setup needed.

## Request shape

```json
POST /functions/v1/invite-user
Authorization: Bearer <admin user's access token>
{
  "email": "new.sponsor@example.com",
  "full_name": "Abu Bakr",
  "role": "sponsor" | "graduate" | "admin",
  "phone": "+31...",          // optional
  "country": "Netherlands",    // optional, used for sponsor rows
  "graduate_id": "<uuid>"      // optional, only for role=graduate to link existing graduate row
}
```

## Response

```json
{ "ok": true, "user_id": "...", "email": "...", "temp_password": "..." }
```

The admin forwards the temp password to the new user via WhatsApp. The user signs in and is prompted to change password on first login (app-level flow, to be built).
