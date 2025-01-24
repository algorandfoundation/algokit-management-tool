from google.cloud import secretmanager

from app.core.config import settings


def get_github_token() -> str:
    """Retrieve GitHub token from Secret Manager or environment."""
    if settings.GITHUB_TOKEN_LOCAL:
        return settings.GITHUB_TOKEN_LOCAL

    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{settings.GCP_PROJECT_ID}/secrets/github-token/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")
