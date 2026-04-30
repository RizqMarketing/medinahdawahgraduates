#!/usr/bin/env bash
# =============================================================================
# One-shot deploy for the AR → EN report translation feature.
#
# What it does, in order:
#   1) Applies the new database migration (adds notes_en + overall_text_en
#      columns to your Supabase DB)
#   2) Deploys the `translate-report` edge function
#   3) Saves your Anthropic API key as a Supabase secret so the function
#      can call Claude
#
# Run from inside `madinah-dawah-app/`:
#   bash deploy-translate.sh
# =============================================================================
set -e

cd "$(dirname "$0")"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Madinah Dawah — translate-report deploy"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Before you continue, make sure you have:"
echo "  • An Anthropic API key (starts with sk-ant-)."
echo "    Get one at: https://console.anthropic.com/settings/keys"
echo ""
read -r -p "Ready to proceed? [y/N] " confirm
case "$confirm" in
  y|Y|yes|YES) ;;
  *) echo "Aborted." ; exit 1 ;;
esac

echo ""
echo "──────────────────────────────────────────────────────────"
echo "  Step 1 of 3 — Applying database migration"
echo "──────────────────────────────────────────────────────────"
npx supabase db push

echo ""
echo "──────────────────────────────────────────────────────────"
echo "  Step 2 of 3 — Deploying the translate-report function"
echo "──────────────────────────────────────────────────────────"
npx supabase functions deploy translate-report --no-verify-jwt

echo ""
echo "──────────────────────────────────────────────────────────"
echo "  Step 3 of 3 — Saving your Anthropic API key"
echo "──────────────────────────────────────────────────────────"
echo "Paste your key (it will not be shown on screen) and press Enter:"
read -r -s ANTHROPIC_KEY
echo ""
if [ -z "$ANTHROPIC_KEY" ]; then
  echo "✗ No key entered. Aborted before saving."
  echo "  Re-run this script when you have your key."
  exit 1
fi
if [[ "$ANTHROPIC_KEY" != sk-ant-* ]]; then
  echo "⚠  That doesn't look like an Anthropic key (should start with 'sk-ant-')."
  read -r -p "   Save it anyway? [y/N] " confirm2
  case "$confirm2" in
    y|Y|yes|YES) ;;
    *) echo "Aborted." ; exit 1 ;;
  esac
fi
npx supabase secrets set ANTHROPIC_API_KEY="$ANTHROPIC_KEY"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✓ Backend is live."
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Next: push the frontend so the AR/EN toggle shows up on the website."
echo "(Or just say so to Claude and it'll commit + push for you.)"
echo ""
