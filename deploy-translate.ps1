# =============================================================================
# One-shot deploy for the AR -> EN report translation feature (PowerShell).
#
# Does the same thing as deploy-translate.sh, but works on Windows PowerShell:
#   1) Applies the new database migration
#   2) Deploys the `translate-report` edge function
#   3) Saves your Anthropic API key as a Supabase secret
#
# Run from inside madinah-dawah-app/:
#   powershell -ExecutionPolicy Bypass -File deploy-translate.ps1
# =============================================================================

Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Madinah Dawah - translate-report deploy"                   -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Before you continue, make sure you have:"
Write-Host "  * An Anthropic API key (starts with sk-ant-)."
Write-Host "    Get one at: https://console.anthropic.com/settings/keys"
Write-Host ""

$confirm = Read-Host "Ready to proceed? [y/N]"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
  Write-Host "Aborted."
  exit 1
}

Write-Host ""
Write-Host "----------------------------------------------------------"
Write-Host "  Step 1 of 3 - Applying database migration"
Write-Host "----------------------------------------------------------"
npx supabase db push
if (-not $?) {
  Write-Host ""
  Write-Host "Migration failed. Stopping before deploy." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "----------------------------------------------------------"
Write-Host "  Step 2 of 3 - Deploying the translate-report function"
Write-Host "----------------------------------------------------------"
npx supabase functions deploy translate-report --no-verify-jwt
if (-not $?) {
  Write-Host ""
  Write-Host "Function deploy failed. Stopping before secret save." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "----------------------------------------------------------"
Write-Host "  Step 3 of 3 - Saving your Anthropic API key"
Write-Host "----------------------------------------------------------"
Write-Host "Paste your key (it will not be shown on screen) and press Enter:"
$secureKey = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
$key = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrWhiteSpace($key)) {
  Write-Host "No key entered. Aborted before saving." -ForegroundColor Red
  exit 1
}

if (-not $key.StartsWith('sk-ant-')) {
  Write-Host "Warning: that doesn't look like an Anthropic key (should start with sk-ant-)." -ForegroundColor Yellow
  $confirm2 = Read-Host "Save it anyway? [y/N]"
  if ($confirm2 -ne 'y' -and $confirm2 -ne 'Y') {
    Write-Host "Aborted."
    exit 1
  }
}

npx supabase secrets set "ANTHROPIC_API_KEY=$key"
if (-not $?) {
  Write-Host ""
  Write-Host "Saving the secret failed." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Done. Backend is live."                                   -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next: tell Claude to push the frontend so Netlify rebuilds."
Write-Host ""
