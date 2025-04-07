# First, compile TypeScript to JavaScript
npm run build


gcloud run deploy github-bug-aggregator \
    --source . \
    --function githubBugAggregator \
    --base-image nodejs22 \
    --region us-central1 \
    --env-vars-file=.env.yaml