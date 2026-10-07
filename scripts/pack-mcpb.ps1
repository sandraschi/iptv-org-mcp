# MCPB pack helper: fresh wipe+recopy src/ -> mcpb/src/, prompt gates, pack.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root "src"
$stage = Join-Path $root "mcpb\src"

if (Test-Path -LiteralPath $stage) { Remove-Item -Path $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null
Copy-Item -Path (Join-Path $src "*") -Destination $stage -Recurse -Force

$sys = (Get-Content (Join-Path $root "assets\prompts\system.md") -Raw).Split(" ").Count
$usr = (Get-Content (Join-Path $root "assets\prompts\user.md") -Raw).Split(" ").Count
$ex = (Get-Content (Join-Path $root "assets\prompts\examples.json") -Raw | ConvertFrom-Json).Count
Write-Host "prompts: system=$sys user=$usr examples=$ex (gate 3000/4000/100 - P1)"
if ($sys -lt 3000 -or $usr -lt 4000 -or $ex -lt 100) {
  Write-Host "GATE NOT MET: prompts below 3-4-100. Pack deferred until P1." -ForegroundColor Yellow
  exit 1
}
mcpb pack
