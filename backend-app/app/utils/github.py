import os
from google.cloud import secretmanager

from app.config import settings


def get_github_token() -> str:
    """Retrieve GitHub token from Secret Manager or environment."""
    if os.getenv("GITHUB_TOKEN"):
        return os.getenv("GITHUB_TOKEN")

    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{settings.GCP_PROJECT_ID}/secrets/github-token/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")
