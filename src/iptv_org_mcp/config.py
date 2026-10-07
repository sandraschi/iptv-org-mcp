"""Pydantic-settings configuration for iptv-org-mcp."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class IptvOrgMCPSettings(BaseSettings):
    """Runtime configuration (env prefix IPTV_ORG_MCP_)."""

    model_config = SettingsConfigDict(env_prefix="IPTV_ORG_MCP_", env_file=".env")

    host: str = "127.0.0.1"
    port: int = 11242
    transport: str = "stdio"
    log_level: str = "INFO"

    api_base: str = "https://iptv-org.github.io/api"
    playlist_base: str = "https://iptv-org.github.io/iptv"
    cache_ttl_hours: int = 24
    cache_dir: str = "./data"
    probe_timeout: int = 8
    probe_max: int = 20
    vlc_path: str = ""


_settings: IptvOrgMCPSettings | None = None


def get_settings() -> IptvOrgMCPSettings:
    """Return the cached settings singleton."""
    global _settings
    if _settings is None:
        _settings = IptvOrgMCPSettings()
    return _settings
