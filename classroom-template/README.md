# Privacy-First ID

Starter repo for the Beyond Compliance learning lab.

## Start Here

1. Accept the GitHub Classroom invite shared by the instructors.
2. Open your new repo in GitHub Codespaces.
3. Follow [ATTENDEE_QUICKSTART.md](ATTENDEE_QUICKSTART.md).
4. Start with [labs/README-lab-00-start.md](labs/README-lab-00-start.md).

## Quickstart

Recommended path:

- Use GitHub Codespaces and follow [ATTENDEE_QUICKSTART.md](ATTENDEE_QUICKSTART.md).

Local terminal fallback:

- macOS: `./scripts/bootstrap-mac.sh`
- Windows PowerShell: `powershell -ExecutionPolicy Bypass -File .\\scripts\\bootstrap-windows.ps1`
- Create local env files: `pnpm env:setup`
- Install dependencies: `pnpm install -r --frozen-lockfile`
- Start the lab services: `pnpm dev`
- Open:
  - `http://localhost:3001`
  - `http://localhost:3002`

## Labs

- Lab 00: [labs/README-lab-00-start.md](labs/README-lab-00-start.md)
- Lab 01: [labs/README-lab-01-issuance.md](labs/README-lab-01-issuance.md)
- Lab 02: [labs/README-lab-02-bbs.md](labs/README-lab-02-bbs.md)
- Lab 03: [labs/README-lab-03-ohttp.md](labs/README-lab-03-ohttp.md)
- Lab 04: [labs/README-lab-04-iproov.md](labs/README-lab-04-iproov.md)
- Lab 05: [labs/README-lab-05-revocation.md](labs/README-lab-05-revocation.md)

## More docs

- Quick start: [ATTENDEE_QUICKSTART.md](ATTENDEE_QUICKSTART.md)
- Lab overview: [LEARNING_LAB.md](LEARNING_LAB.md)
- Architecture and demo context: [DEMO.md](DEMO.md)
- Deeper technical reference: [TECHNICAL_REFERENCE.md](TECHNICAL_REFERENCE.md)
- Mobile wallet notes:
  - [wallet-ios/README.md](wallet-ios/README.md)
  - [wallet-android/README.md](wallet-android/README.md)
