FROM node:24-bookworm-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /app
RUN corepack enable
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV DATABASE_PATH=/data/calendar.sqlite
ENV PORT=3000

WORKDIR /app
COPY --from=build /app /app

EXPOSE 3000
VOLUME ["/data"]

CMD ["node", "project/4. Implementation/backend/dist/server.js"]
