FROM node:20-bookworm-slim

WORKDIR /work

# Pin pnpm to the same version used in CI (see package.json packageManager).
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

# Copy everything (simple and predictable for workshop usage).
COPY . .

# Deterministic install for "download and run" usage.
RUN pnpm install -r --frozen-lockfile

# Build the runtime services used by the demo conductor.
RUN pnpm -r --filter demo-conductor --filter issuer --filter verifier --filter bbs-lib --filter telemetry build

EXPOSE 3001 3002 3210

# Run the built services (not watch mode). Wallet tracks are out-of-container.
CMD ["pnpm", "-r", "--parallel", "--filter", "issuer", "--filter", "verifier", "start"]
