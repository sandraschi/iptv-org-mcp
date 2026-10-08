# Thin shim: the canonical pack pipeline lives in mcp-central-docs so fixes
# reach the whole fleet at once. Never vendor a copy here.
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Engine = Join-Path $RepoRoot '..\mcp-central-docs\scripts\fleet-mcpb-pack.ps1'
& $Engine -RepoRoot $RepoRoot
