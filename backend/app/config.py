from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:////data/kanban.db"
    secret_key: str = "change_me_in_production"
    allow_registration: bool = True
    admin_username: str = "admin"
    admin_password: str = "admin"
    session_max_age: int = 60 * 60 * 24 * 30  # 30 days

    class Config:
        env_file = ".env"


settings = Settings()
