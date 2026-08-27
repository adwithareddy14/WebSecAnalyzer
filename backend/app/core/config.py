from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "WebVulnX"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"

    DATABASE_URL: str = "sqlite:///./webvulnx.db"

    DEFAULT_TIMEOUT: int = 10
    MAX_REDIRECTS: int = 10
    USER_AGENT: str = "WebVulnX/2.0 (Ethical Web Application Security Assessment Platform)"

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=None,
        extra="ignore"
    )


settings = Settings()