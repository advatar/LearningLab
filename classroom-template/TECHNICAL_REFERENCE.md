# Technical Reference

Deeper protocol and terminal reference for this repo. Students do not need this to start Lab 00.

## Demo flows (terminal)

- OIDC4VCI (SD-JWT VC)
  1. Offer (pre-authorized code): `curl -s -X POST http://localhost:3001/credential-offers -H 'content-type: application/json' -d '{"credentials":["AgeCredential"]}' | jq`
  2. Token (c_nonce returned): `curl -s -X POST http://localhost:3001/token -H 'content-type: application/json' -d '{"grant_type":"urn:ietf:params:oauth:grant-type:pre-authorized_code","pre-authorized_code":"<code_from_offer>"}' | jq`
  3. Credential: `curl -s -X POST http://localhost:3001/credential -H "authorization: Bearer <access_token>" -H 'content-type: application/json' -d '{"format":"vc+sd-jwt","claims":{"age_over":21,"residency":"SE"}}' | jq`
     - With DPoP on, include a valid `DPoP:` header and `proof.jwt` binding the `c_nonce` to the holder key (see `issuer/example.env`).
  4. Verify SD-JWT: `curl -s -X POST http://localhost:3002/verify -H 'content-type: application/json' -d '{"format":"vc+sd-jwt","credential":"<sd_jwt~disclosures from issuer>"}' | jq`
- OIDC4VCI (DI+BBS+)
  1. Offer/token as above but use `"credentials":["AgeCredentialBBS"]`
  2. Credential: `curl -s -X POST http://localhost:3001/credential -H "authorization: Bearer <access_token>" -H 'content-type: application/json' -d '{"format":"di-bbs","claims":{"age_over":25,"residency":"SE"}}' | jq`
  3. Derive proof (demo helper): `curl -s -X POST http://localhost:3001/bbs/proof -H 'content-type: application/json' -d '{"signature":"<signature>","messages":[<messages array>],"reveal":[1],"nonce":"bbs-demo-nonce"}' | jq`
  4. Verify proof: `curl -s -X POST http://localhost:3002/verify -H 'content-type: application/json' -d '{"format":"di-bbs","proof":{"proof":"<proof>","revealedMessages":["age_over:25"],"nonce":"bbs-demo-nonce"},"credentialStatus":{"statusListIndex":"<from issuer>","statusListCredential":"http://localhost:3001/statuslist/1.json"}}' | jq`
- OIDC4VP (Digital Credentials API): `curl -s http://localhost:3002/vp/request | jq` to get a request + nonce, then POST the wallet response to `/verify` (or use the browser button on `/`).
- Revoke (requires `ADMIN_TOKEN` in `issuer/.env`): `curl -X POST http://localhost:3001/revoke/<credentialId> -H 'x-admin-token: <ADMIN_TOKEN>'` then re-run `/verify` to see the revoked status bit applied.
- Debug: `curl -s http://localhost:3001/debug/issued | jq` and `curl -s http://localhost:3002/debug/credential | jq`

## OHTTP Relay (Cloudflare Privacy Gateway)

- This repo includes an `ohttp/` Cloudflare Worker stub. For production, use Cloudflare Privacy Gateway (preferred).
- Local dev for the stub:

```bash
pnpm -F ohttp dev
```

- Configure issuer to use a relay by setting this in `issuer/.env`:

```text
USE_OHTTP=false
OHTTP_RELAY_URL=https://<your-cloudflare-relay-domain>.workers.dev
```

## Telemetry

- The `telemetry/` package counts only aggregates.
- The verifier exposes `GET /debug/telemetry` during dev.

Example:

```bash
curl -s -X POST http://localhost:3002/verify -H 'content-type: application/json' -d '{"demo":true}'
curl -s http://localhost:3002/debug/telemetry | jq
```

## Status List

- Generate the initial list:

```bash
pnpm --filter status-list run generate
```

- Inspect the served list:

```bash
curl http://localhost:3001/statuslist/1.json | jq
```
