# Multi-stage Dockerfile to build and serve the React application
# Stage 1: Build the React application
FROM node:22 AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install
RUN pnpm build

# # # # Stage 2: Serve the app with nginx by copying the build files from previous stage
FROM nginx:alpine

COPY --from=build /app/dist /var/www/public
COPY --from=build /app/deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]