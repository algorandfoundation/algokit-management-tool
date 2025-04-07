#!/bin/bash

# Check if yq is installed (we'll use it to parse yaml)
if ! command -v yq &> /dev/null; then
    echo "yq is required but not installed. Install it with: brew install yq"
    exit 1
fi

# Read secrets from file
PROJECT_ID=$(yq '.PROJECT_ID' .env.yaml)
GITHUB_TOKEN=$(yq '.GITHUB_TOKEN' .secrets.yaml)
SLACK_WEBHOOK_URL=$(yq '.SLACK_WEBHOOK_URL' .secrets.yaml)

# Create secrets
# echo "Creating GitHub token secret..."
# echo -n "$GITHUB_TOKEN" | gcloud secrets create github-token --data-file=- --project=$PROJECT_ID

echo "Creating Slack webhook secret..."
echo -n "$SLACK_WEBHOOK_URL" | gcloud secrets create slack-webhook-url --data-file=- --project=$PROJECT_ID

# Grant access to your Cloud Function's service account
echo "Granting IAM permissions..."
# gcloud secrets add-iam-policy-binding github-token \
#   --member="serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com" \
#   --role="roles/secretmanager.secretAccessor" \
#   --project=$PROJECT_ID

gcloud secrets add-iam-policy-binding slack-webhook-url \
  --member="serviceAccount:algokit-management-tool@algokit.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID

echo "Secrets created and permissions granted successfully!"