To deploy
- build: docker buildx build --platform linux/amd64 -t us-central1-docker.pkg.dev/algokit/algokit-management-tool/api .
- docker push us-central1-docker.pkg.dev/algokit/algokit-management-tool/api 