FROM node:24-alpine AS base
WORKDIR /app
RUN npm install --global pnpm@12.16.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS development
COPY . .
EXPOSE 4321
CMD ["pnpm", "dev"]

FROM base AS build
COPY . .
RUN pnpm verify

FROM nginx:stable-alpine AS production
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
