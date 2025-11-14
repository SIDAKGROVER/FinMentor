<#
Secure helper: set OPENAI_API_KEY in backend/.env

This script prompts you for the OpenAI API key (hidden), then
writes or updates the `OPENAI_API_KEY=` line in `backend/.env`.

Usage (PowerShell):
  cd d:\finmentor-prototype
  powershell -ExecutionPolicy Bypass -File .\backend\scripts\set_openai_key.ps1

Security:
- The key is read securely (no echo) and written only to the local file
  `backend/.env`. Do NOT commit this file to git.
#>

Param()

function Write-ErrorAndExit([string]$msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

try {
    # Prompt for the key securely
    $secure = Read-Host -AsSecureString -Prompt 'Enter your OpenAI API key (sk-...)'
    if (-not $secure) { Write-ErrorAndExit 'No key entered.' }

    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $key = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

    # Resolve env path (backend/.env)
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    $envPath = Join-Path $scriptDir '..\.env' | Resolve-Path -ErrorAction SilentlyContinue
    if (-not $envPath) {
        # create backend/.env if not present
        $envPath = Join-Path $scriptDir '..\.env'
        New-Item -Path $envPath -ItemType File -Force | Out-Null
    } else {
        $envPath = $envPath.Path
    }

    # Read existing lines and update or append the key
    $lines = @()
    if (Test-Path $envPath) {
        $lines = Get-Content $envPath -ErrorAction SilentlyContinue
    }

    $updated = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^\s*OPENAI_API_KEY\s*=') {
            $lines[$i] = "OPENAI_API_KEY=$key"
            $updated = $true
            break
        }
    }
    if (-not $updated) {
        $lines += "OPENAI_API_KEY=$key"
    }

    # Write back (overwrite) - preserve existing file permissions
    $lines | Set-Content -Path $envPath -Encoding UTF8

    Write-Host "Updated OPENAI_API_KEY in: $envPath" -ForegroundColor Green
    Write-Host 'Reminder: Do NOT commit backend/.env to git.' -ForegroundColor Yellow

} catch {
    Write-ErrorAndExit $_.Exception.Message
}
