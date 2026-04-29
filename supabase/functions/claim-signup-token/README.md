# claim-signup-token edge function

Public (unauthenticated) endpoint. Graduate visits `/claim?token=...` from a
WhatsApp invite the admin sent. They submit email + password; this function
validates the token, creates the auth user + profile, and links profile to the
pre-existing graduates row.

## Deploy

```bash
cd madinah-dawah-app
npx supabase functions deploy claim-signup-token --no-verify-jwt
```

`--no-verify-jwt` because the caller is unauthenticated by design — the token
itself is the credential.

## Request

```json
POST /functions/v1/claim-signup-token
{
  "token": "abc...",
  "email": "graduate@example.com",
  "password": "at-least-8-chars"
}
```

## Response

```json
{ "ok": true, "email": "graduate@example.com" }
```

After success, the client signs in via `supabase.auth.signInWithPassword` with
the same email + password and is routed to `/welcome` for profile completion.

## Errors

- `404 Invalid signup link` — token doesn't exist
- `410 already been used` — token was claimed before
- `410 expired` — token past `expires_at`
- `409 already has an account` — graduate row already linked (defensive)
