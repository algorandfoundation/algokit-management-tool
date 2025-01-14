from google.cloud import storage
from google.oauth2 import service_account
from typing import Any
import json

from app.config import settings


def save_to_storage(data: Any, filename: str) -> str:
    """Save data to Google Cloud Storage."""
    # Create credentials from service account info
    credentials = service_account.Credentials.from_service_account_info(
        json.loads(settings.GCP_SERVICE_ACCOUNT_INFO)
    )

    # Create client with explicit credentials
    client = storage.Client(credentials=credentials)
    bucket = client.bucket(settings.GCP_BUCKET_NAME)
    blob = bucket.blob(filename)

    blob.upload_from_string(json.dumps(data, indent=2), content_type="application/json")

    return f"gs://{settings.GCP_BUCKET_NAME}/{filename}"
