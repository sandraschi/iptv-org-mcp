# Per-repo fleet start config for iptv-org-mcp
# Ports were allocated by fleet-gate/claim_ports.py and registered in
# operations/WEBAPP_PORTS.md. Do not hand-edit them -- re-run claim_ports.py.
@{
    Name         = 'iptv-org-mcp'
    BackendPort  = 11242
    FrontendPort = 11241
    HealthPath   = '/api/health'
    WebRoot      = 'web_sota'
    Backend = @{
        Kind          = 'uvicorn'
        UvicornTarget = 'iptv_org_mcp.server:app'
        SyncExtras    = @('dev')
        # Fresh code on every start: uvicorn --reload watches src/ and
        # restarts the backend whenever edited files change.
        Reload        = $true
        Env           = @{ WEB_PORT = '11242' }
    }
    Frontend = @{
        Kind           = 'vite-npm'
        PackageManager = 'npm'
        PortEnvVar     = 'VITE_PORT'
        ApiTargetEnv   = 'VITE_API_TARGET'
    }
}
