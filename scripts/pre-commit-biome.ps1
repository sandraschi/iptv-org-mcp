# Fleet pre-commit biome hook - copy of the fleet pattern (see calibre-mcp).
# Detects web_sota/, ensures node_modules, runs npm run biome:ci.

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

$webRoot = $null
foreach ($candidate in @("webapp", "web_sota", "webapp/frontend", "web")) {
    $path = Join-Path $repoRoot $candidate
    if (Test-Path (Join-Path $path "package.json")) {
        $webRoot = $path
        break
    }
}

if (-not $webRoot) {
    exit 0
}

Push-Location $webRoot
try {
    # bun lives off-PATH by design; automation contexts (git hooks) often run
    # with a stale PATH snapshot, so resolve it explicitly with npm fallback.
    $bunExe = Join-Path $env:USERPROFILE ".bun\bin\bun.exe"
    $hasBun = Test-Path -LiteralPath $bunExe
    if (-not (Test-Path "node_modules")) {
        if ($hasBun) {
            & $bunExe install
        } else {
            npm install --silent
        }
    }
    if ($hasBun) {
        & $bunExe run biome:ci
    } else {
        npm run biome:ci
    }
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
