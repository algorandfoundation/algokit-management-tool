import json
from typing import Any

from google.cloud import storage
from google.oauth2 import service_account

from app.core.config import settings


def save_to_storage(data: Any, filename: str, make_public: bool = False) -> str:
    """Save data to Google Cloud Storage.
    
    Args:
        data: The data to save
        filename: The name of the file to save
        make_public: If True, makes the file publicly accessible
    """
    # Create credentials from service account info
    credentials = service_account.Credentials.from_service_account_info(
        json.loads(settings.GCP_SERVICE_ACCOUNT_INFO)
    )

    # Create client with explicit credentials
    client = storage.Client(credentials=credentials)
    bucket = client.bucket(settings.GCP_BUCKET_NAME)
    blob = bucket.blob(filename)

    blob.upload_from_string(json.dumps(data, indent=2), content_type="application/json")
    
    if make_public:
        blob.make_public()

    return f"gs://{settings.GCP_BUCKET_NAME}/{filename}"
