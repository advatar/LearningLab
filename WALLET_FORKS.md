# Wallet Fork Workflow

The mobile wallet work lives in separate git repositories. Do not add the wallets to `LearningLab` as submodules and do not clone them inside this repo.

Why:

- students should clone only the platform they need
- mobile build tooling should stay isolated from the Node lab repo
- the existing demo-conductor flow must remain untouched

## What stays unchanged

The browser-based demo path in `demo-conductor/` is still the supported booth/demo flow. Wallet work is additive. If a wallet integration fails, the demo-conductor flow must still work exactly as it does today.

## Repo layout

Recommended workspace layout:

```text
RSA/
  LearningLab/
  eudi-app-ios-wallet-ui/
  eudi-app-android-wallet-ui/
```

## Clone the wallet forks

From `LearningLab/`:

```bash
node scripts/setup-wallet-forks.js
```

Platform-specific clone:

```bash
node scripts/setup-wallet-forks.js --platform ios
node scripts/setup-wallet-forks.js --platform android
```

Preview only:

```bash
node scripts/setup-wallet-forks.js --dry-run
```

SSH clone:

```bash
node scripts/setup-wallet-forks.js --protocol ssh
```

## Student workflow

Students should:

1. Clone `LearningLab` and run the normal Node setup.
2. Clone only one wallet fork beside `LearningLab`.
3. Open the wallet repo in Xcode or Android Studio.
4. Point the wallet at the local `issuer` and `verifier` services.
5. Treat wallet iProov support as an advanced/mobile track. The web demo path is separate and must not be used as the mobile integration point.

## iProov integration points

Use these hook points in the wallet forks so iProov runs immediately before a presentation leaves the wallet:

- iOS: `Modules/feature-presentation/Sources/UI/Presentation/Loading/PresentationLoadingViewModel.swift`
  - gate `interactor.onSendResponse()`
- Android: `presentation-feature/src/main/java/eu/europa/ec/presentationfeature/ui/loading/PresentationLoadingViewModel.kt`
  - gate `sendRequestedDocuments()`

Expected sequence:

1. Wallet requests a claim token from `POST /iproov/claim`.
2. Wallet launches the native iProov SDK.
3. Wallet blocks presentation until the iProov result is accepted.
4. Wallet continues with the normal presentation flow.

## Student deliverable boundary

The repo should give students a working wallet fork baseline. Students can still inspect and understand the iProov integration, but they should not need to build that plumbing from scratch just to complete the lab.
