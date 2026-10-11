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
    if (-not (Test-Path "node_modules")) {
        bun install
        if ($LASTEXITCODE -ne 0) {
            npm install --silent
        }
    }
    bun run biome:ci
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
