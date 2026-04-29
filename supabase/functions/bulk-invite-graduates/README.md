# bulk-invite-graduates edge function

Admin-only endpoint that creates many graduate placeholder rows + per-graduate
signup tokens in one batch. Returns a unique `signup_url` per row that the
admin forwards to each graduate via WhatsApp. The graduate then claims the
token at `/claim?token=...` and supplies their own email + password (see
`claim-signup-token`).

## Deploy

```bash
cd madinah-dawah-app
npx supabase functions deploy bulk-invite-graduates --no-verify-jwt
```

`--no-verify-jwt` because the admin gate is enforced inside the function (same
pattern as `invite-user`).

## Request

```json
POST /functions/v1/bulk-invite-graduates
Authorization: Bearer <admin access token>
{
  "base_url": "https://madinahdawahgraduates.com",
  "rows": [
    { "full_name": "Mohammed Ali", "phone": "+9665...", "country": "Indonesia" },
    { "full_name": "Yusuf Khan",   "phone": "+9665...", "country": "Pakistan"  }
  ]
}
```

Per-row required: `full_name`, `country`. `phone` optional.
Max 100 rows per batch.

## Response

```json
{
  "ok": true,
  "created": [
    { "full_name": "...", "slug": "...", "phone": "...", "country": "...",
      "signup_url": "https://.../claim?token=..." }
  ],
  "errors": [
    { "index": 3, "full_name": "...", "error": "..." }
  ]
}
```

Partial success is allowed: a bad row goes into `errors`; valid rows still get
created. The admin UI shows both lists.
