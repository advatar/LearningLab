# Lab 03 — OHTTP Relay

Lab ID: `03` · Timebox: 20 minutes

Goal: route issuer and verifier calls through an OHTTP relay so servers never see client IPs.

## What This Lab Is Doing

This lab does not introduce a new credential type. It changes the network privacy model around the existing system. Instead of letting issuer and verifier make direct outbound requests, students route those requests through an Oblivious HTTP relay.

The key teaching point is that credential privacy is not only about cryptography. It is also about metadata. Even if payloads are privacy-preserving, direct outbound calls can still leak who is talking to whom by IP address.

## Flow Overview

```mermaid
flowchart LR
    Issuer[Issuer] -->|outbound fetch via relay| Relay[OHTTP Relay]
    Verifier[Verifier] -->|outbound fetch via relay| Relay
    Relay --> JWKS[JWKS / remote issuer metadata]
    Relay --> Status[Status list / remote resource]
    Relay --> Other[Other remote endpoints]
```

## What Students Should Understand

- OHTTP changes transport privacy, not VC semantics
- the relay sits between our services and the remote resources they fetch
- issuer and verifier logic should still work when the relay is turned off
- this lab is mostly about correctly respecting environment-driven fetch behavior

Environment tracks
- Codespaces
  - Stay on `main` in your Codespace.
  - Your `.env` files and dependencies should already be ready from setup.
- Local terminal
  - Stay on `main` in your local clone.
  - If you are starting fresh, run `pnpm env:setup` and `pnpm install -r --frozen-lockfile`.

Additional setup
- Cloudflare account (recommended), or use the local worker stub in `ohttp/`.

Steps (edit + test)
1) Configure the relay
   - If using Cloudflare Privacy Gateway: deploy the worker template in `ohttp/src/index.ts` via `wrangler publish` and note the worker URL (e.g., `https://<name>.workers.dev`).
   - If testing locally: run `pnpm -F ohttp dev` (returns 501 with docs link; sufficient to show routing behavior).
2) Wire issuer to the relay
   - In `issuer/.env`, set `USE_OHTTP=true` and `OHTTP_RELAY_URL=<worker-url>`.
   - Ensure the issuer HTTP client (fetch) respects these toggles (see `issuer/src/index.ts` for the OHTTP section); for the lab, stubbing with a pass-through client is acceptable if the relay is not available.
3) Wire verifier to the relay
   - In `verifier/.env`, set `USE_OHTTP=true` and `OHTTP_RELAY_URL=<worker-url>`.
   - In `verifier/src/index.ts`, ensure outbound fetches (JWKS, status list) go through the relay when the flag is on.
4) Run and observe
   - Start services: `pnpm dev`.
   - Issue and verify a credential (reuse Lab 01/02 curl commands).
   - Check access logs (Cloudflare dashboard or worker logs) to confirm the origin sees relay IPs, not client IPs.
   - If using the stub, confirm requests reach the stub endpoint and are forwarded or rejected as coded.

Pass criteria
- With `USE_OHTTP=true`, issuer/verifier outbound calls are sent via the relay URL.
- Logs show relay IPs (or stub handler confirms receipt), not direct client IPs.

Troubleshooting
- Relay 5xx: verify `OHTTP_RELAY_URL` is correct and the worker is published.
- Requests still going direct: confirm env vars are loaded (restart dev servers after editing `.env`).
- Browser cache: if testing via a browser, hard reload to ensure the new envs are used. 
