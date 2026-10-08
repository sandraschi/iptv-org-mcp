set windows-shell := ["powershell.exe", "-NoProfile", "-Command"]

default:
    @just --list

serve:
    uv run python -m iptv_org_mcp --serve --port 11242

stdio:
    uv run python -m iptv_org_mcp --mode stdio

test:
    uv run pytest -q

lint:
    uv run ruff check src tests
    uv run ruff format --check src tests

fmt:
    uv run ruff check --fix src tests
    uv run ruff format src tests

ci:
    just lint
    just test

mcpb-pack:
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/mcpb-pack.ps1
