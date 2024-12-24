FROM node:20.11.1-alpine AS base

# ---------------
# Setup for deps and build
# ---------------
FROM base AS setup

ENV PNPM_HOME=/usr/local/bin

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN apk add --no-cache libc6-compat

COPY . /app
WORKDIR /app


# ---------------
# Install dependencies
# ---------------
FROM setup AS deps

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# ---------------
# Build app
# ---------------
FROM deps AS build

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

# ---------------
# Final App
# ---------------
FROM base

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN mkdir .next

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# ---------------
# Install AWSCLI
# ---------------
RUN apk add --no-cache python3 py3-pip
RUN pip3 install --upgrade pip --break-system-packages
RUN pip3 install --no-cache-dir awscli --break-system-packages
RUN rm -rf /var/cache/apk/*

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY ./scripts/startup.sh /startup.sh
ENTRYPOINT ["sh", "/startup.sh" ]
