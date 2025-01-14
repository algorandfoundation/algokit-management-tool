from typing import List, Dict, Any
from pydantic_settings import BaseSettings
from google.cloud import secretmanager


ORGANIZATION = "algorand_foundation"
REPOSITORIES = [
    # {
    #     "name": "puya",
    #     "owner": ORGANIZATION,
    #     "build_name": "algorand-python",
    #     "language": "python",
    # },
    # {
    #     "name": "algorand-python-testing",
    #     "owner": ORGANIZATION,
    #     "build_name": "algorand-python-testing",
    #     "language": "python",
    # },
    # {
    #     "name": "algokit-cli",
    #     "owner": ORGANIZATION,
    #     "build_name": "algokit",
    #     "language": "python",
    # },
    # {
    #     "name": "algokit-utils-py",
    #     "owner": ORGANIZATION,
    #     "build_name": "algokit-utils",
    #     "language": "python",
    # },
    # {
    #     "name": "algokit-client-generator-py",
    #     "owner": ORGANIZATION,
    #     "build_name": "algokit-client-generator",
    #     "language": "python",
    # },
    # {
    #     "name": "algokit-subscriber-py",
    #     "owner": ORGANIZATION,
    #     "build_name": "algokit-subscriber",
    #     "language": "python",
    # },
    # {
    #     "name": "algokit-lora",
    #     "owner": ORGANIZATION,
    #     "build_name": None,
    #     "language": "javascript",
    # },
    # # Explore is a private repo
    # # {"name": "algokit-explore", "build_name": None},
    # {
    #     "name": "puya-ts",
    #     "owner": ORGANIZATION,
    #     "build_name": "@algorandfoundation/algorand-typescript",
    #     "language": "javascript",
    #     "branch": "alpha",
    # },
    # {
    #     "name": "algokit-utils-ts",
    #     "owner": ORGANIZATION,
    #     "build_name": "@algorandfoundation/algokit-utils",
    #     "language": "javascript",
    # },
    # {
    #     "name": "algokit-subscriber-ts",
    #     "owner": ORGANIZATION,
    #     "build_name": "@algorandfoundation/algokit-subscriber",
    #     "language": "javascript",
    # },
    # {
    #     "name": "algokit-client-generator-ts",
    #     "owner": ORGANIZATION,
    #     "build_name": "@algorandfoundation/algokit-client-generator",
    #     "language": "javascript",
    # },
    # Not sure this gets published
    # {
    #     "name": "algokit-dispenser-api",
    #     "owner": organization,
    #     "build_name": "algokit-testnet-dispenser",
    #     "language": "javascript",
    # },
    # {
    #     "name": "algokit-avm-vscode-debugger",
    #     "owner": ORGANIZATION,
    #     "build_name": "algokit-avm-vscode-debugger",
    #     "language": "javascript",
    # },
    {
        "name": "algokit-utils-ts-debug",
        "owner": ORGANIZATION,
        "build_name": "@algorandfoundation/algokit-utils-debug",
        "language": "javascript",
    },
]
SERVICE_ACCOUNT_NAME = "algokit-management-tool-service-account"


class Settings(BaseSettings):
    PROJECT_NAME: str = "AlgoKit Dependencies API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"

    # GitHub Configuration
    GITHUB_ORG: str = ORGANIZATION
    REPOSITORIES: List[Dict[str, Any]] = REPOSITORIES

    # GCP Configuration
    GCP_PROJECT_ID: str = "algokit"
    GCP_BUCKET_NAME: str = "algokit-management-tool"
    GCP_BUCKET_SITE_FOLDER_NAME: str = "site"

    # Service Account Configuration for local development
    GOOGLE_APPLICATION_CREDENTIALS: str

    @property
    def GCP_SERVICE_ACCOUNT_INFO(self) -> str:
        try:
            client = secretmanager.SecretManagerServiceClient()
            name = f"projects/{self.GCP_PROJECT_ID}/secrets/{SERVICE_ACCOUNT_NAME}/versions/latest"
            response = client.access_secret_version(request={"name": name})
            return response.payload.data.decode("UTF-8")
        except Exception as e:
            raise Exception(
                "Failed to access Secret Manager. Ensure you have either:\n"
                "1. Run 'gcloud auth application-default login' or\n"
                "2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable\n"
                f"Error: {str(e)}"
            ) from e

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
