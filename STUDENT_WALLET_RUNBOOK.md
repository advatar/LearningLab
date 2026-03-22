# Student Wallet Runbook

This file is the mobile-track guide for students. It is written to remove ambiguity during class.

Read this before opening Xcode or Android Studio:

- the wallet repos live outside `LearningLab`
- the browser-based `demo-conductor` flow is not the mobile integration point
- students should receive wallet forks where the iProov plumbing already exists
- the classroom expectation is that students run and understand the wallet flow, not that they invent the integration from zero

## What Students Are Expected To Do

Students are expected to:

1. run the local `LearningLab` issuer and verifier
2. clone exactly one wallet fork beside `LearningLab`
3. point that wallet at the local issuer
4. run a presentation flow and observe where iProov gates the release
5. understand the difference between demo mode and real iProov mode

Students are not expected to:

- add the official iProov iOS SDK from scratch
- design the Android gate from scratch
- modify `demo-conductor/`
- move the wallet source code into `LearningLab`
- make the wallet repos submodules

## Workspace Layout

Use this layout:

```text
RSA/
  LearningLab/
  eudi-app-ios-wallet-ui/
  eudi-app-android-wallet-ui/
```

From `LearningLab/`, students can clone the wallets with:

```bash
node scripts/setup-wallet-forks.js --platform ios
node scripts/setup-wallet-forks.js --platform android
```

## Start the Backend First

Before opening either wallet:

```bash
cd /Users/johansellstrom/dev/iproov/RSA/LearningLab
pnpm env:setup
pnpm install -r --frozen-lockfile
pnpm dev
```

Sanity checks:

```bash
curl -s http://localhost:3001/.well-known/openid-credential-issuer | jq
curl -s http://localhost:3001/iproov/config | jq
```

Interpret the iProov config like this:

- `realCeremonyEnabled=false`
  - the issuer is in demo mode
  - the wallet should use the web callback fallback

- `realCeremonyEnabled=true`
  - the issuer has real iProov credentials
  - iOS can use the native iProov SDK on a physical iPhone

## iOS Student Instructions

Repo:
- `/Users/johansellstrom/dev/iproov/RSA/eudi-app-ios-wallet-ui`

Key files:
- config keys live in [Wallet.plist](/Users/johansellstrom/dev/iproov/RSA/eudi-app-ios-wallet-ui/Wallet/Wallet.plist)
- the iProov gate logic lives in [IProovPresentationGate.swift](/Users/johansellstrom/dev/iproov/RSA/eudi-app-ios-wallet-ui/Modules/feature-presentation/Sources/IProov/IProovPresentationGate.swift)
- the callback deep link handling lives in [DeepLinkController.swift](/Users/johansellstrom/dev/iproov/RSA/eudi-app-ios-wallet-ui/Modules/logic-ui/Sources/Controller/DeepLinkController.swift)

Important plist keys:
- `IProov Enabled`
- `IProov Issuer Base URL`

Expected callback URL:
- `eudi-wallet://iproov`

### iOS prerequisites

- Xcode installed
- an iOS simulator for demo-mode testing
- a physical iPhone if you want the native iProov SDK path

The upstream wallet docs say the project has two schemes:
- `EUDI Wallet Dev`
- `EUDI Wallet Demo`

### iOS exact setup

1. Open `/Users/johansellstrom/dev/iproov/RSA/eudi-app-ios-wallet-ui/EudiReferenceWallet.xcodeproj` in Xcode.
2. Choose the normal development scheme you use for local runs.
3. Open [Wallet.plist](/Users/johansellstrom/dev/iproov/RSA/eudi-app-ios-wallet-ui/Wallet/Wallet.plist).
4. Make sure:
   - `IProov Enabled` is `true`
   - `IProov Issuer Base URL` points at your issuer

Use these base URLs:

- iOS simulator on the same Mac:
  - `http://localhost:3001`

- physical iPhone on the same Wi-Fi as your Mac:
  - `http://<your-mac-lan-ip>:3001`
  - example: `http://192.168.1.20:3001`

Do not use `localhost` on a physical iPhone. On a real device, `localhost` means the phone itself, not your Mac.

### iOS expected flow

When the wallet reaches the presentation loading step, the gate does this automatically:

1. `GET /iproov/config`
2. If the issuer says real iProov is enabled and the app is on a physical iPhone:
   - `GET /iproov/claim`
   - launch the official iProov iOS SDK
   - `POST /iproov/validate`
3. Otherwise:
   - `POST /iproov/mobile/claim`
   - open the returned `launchUrl`
   - wait for the callback to `eudi-wallet://iproov`
   - `GET /iproov/session/:session`
4. Only then continue the normal presentation send

### iOS what students should test

Demo-mode test:

1. Leave the issuer in demo mode.
2. Run the wallet in the simulator.
3. Trigger a presentation so the wallet reaches the loading screen.
4. Confirm the app opens the issuer-hosted web fallback.
5. Complete the demo ceremony.
6. Confirm the app returns through `eudi-wallet://iproov`.
7. Confirm the presentation resumes only after the session reports `passed=true`.

Real-iProov test:

1. Configure real iProov credentials on the issuer.
2. Run the wallet on a physical iPhone.
3. Trigger the same presentation flow.
4. Confirm the native iProov SDK opens.
5. Confirm the app calls `/iproov/validate` after the SDK reports success.
6. Confirm the presentation resumes only after validation passes.

### iOS troubleshooting

- "iProov is enabled, but the wallet callback or issuer URL is not configured."
  - fix [Wallet.plist](/Users/johansellstrom/dev/iproov/RSA/eudi-app-ios-wallet-ui/Wallet/Wallet.plist)

- "Real iProov on iOS requires a physical device."
  - switch the issuer back to demo mode or run on a real iPhone

- the wallet never returns from the web fallback
  - confirm the callback URL is still `eudi-wallet://iproov`
  - confirm [DeepLinkController.swift](/Users/johansellstrom/dev/iproov/RSA/eudi-app-ios-wallet-ui/Modules/logic-ui/Sources/Controller/DeepLinkController.swift) still handles the `iproov` host

- the real device cannot reach the issuer
  - use your Mac's LAN IP, not `localhost`
  - make sure the phone and Mac are on the same network

## Android Student Instructions

Repo:
- `/Users/johansellstrom/dev/iproov/RSA/eudi-app-android-wallet-ui`

Key files:
- build-time config lives in [presentation-feature/build.gradle.kts](/Users/johansellstrom/dev/iproov/RSA/eudi-app-android-wallet-ui/presentation-feature/build.gradle.kts)
- the Android iProov gate lives in [IProovPresentationGate.kt](/Users/johansellstrom/dev/iproov/RSA/eudi-app-android-wallet-ui/presentation-feature/src/main/java/eu/europa/ec/presentationfeature/iproov/IProovPresentationGate.kt)
- the presentation loading hook lives in [PresentationLoadingViewModel.kt](/Users/johansellstrom/dev/iproov/RSA/eudi-app-android-wallet-ui/presentation-feature/src/main/java/eu/europa/ec/presentationfeature/ui/loading/PresentationLoadingViewModel.kt)

Important BuildConfig fields:
- `IPROOV_GATE_ENABLED`
- `IPROOV_ISSUER_BASE_URL`

Expected callback URL:
- `eudi-wallet://iproov`

### Android prerequisites

- Android Studio installed
- either an Android emulator or a physical Android device

The upstream wallet docs describe these common build variants:
- `devDebug`
- `devRelease`
- `demoDebug`
- `demoRelease`

### Android exact setup

1. Open `/Users/johansellstrom/dev/iproov/RSA/eudi-app-android-wallet-ui` in Android Studio.
2. Open [presentation-feature/build.gradle.kts](/Users/johansellstrom/dev/iproov/RSA/eudi-app-android-wallet-ui/presentation-feature/build.gradle.kts).
3. Make sure:
   - `IPROOV_GATE_ENABLED` is `true`
   - `IPROOV_ISSUER_BASE_URL` points at your issuer

Use these base URLs:

- Android emulator:
  - `http://10.0.2.2:3001`

- physical Android device:
  - `http://<your-mac-lan-ip>:3001`

The default checked-in Android setting already uses `http://10.0.2.2:3001` for emulator work.

### Android expected flow

The current Android fork uses the web-based mobile fallback path, not the native iProov Android SDK.

When the wallet reaches the presentation loading step, the gate does this automatically:

1. `POST /iproov/mobile/claim`
2. receive a `launchUrl`
3. open that URL in the browser
4. wait for the callback to `eudi-wallet://iproov`
5. `GET /iproov/session/:session`
6. only then continue `sendRequestedDocuments()`

### Android what students should test

1. Run the issuer and verifier locally.
2. Run the Android wallet in the emulator.
3. Trigger a presentation until the loading screen appears.
4. Confirm the wallet opens the issuer-hosted iProov web page.
5. Complete the demo ceremony.
6. Confirm the app returns through `eudi-wallet://iproov`.
7. Confirm the presentation resumes only after the session status endpoint reports success.

### Android troubleshooting

- "IProov is enabled, but IPROOV_ISSUER_BASE_URL is empty."
  - fix [presentation-feature/build.gradle.kts](/Users/johansellstrom/dev/iproov/RSA/eudi-app-android-wallet-ui/presentation-feature/build.gradle.kts)

- the emulator cannot reach the issuer
  - use `10.0.2.2`, not `localhost`

- the app never resumes after browser fallback
  - confirm the deep link scheme is still `eudi-wallet`
  - confirm the callback host is still `iproov`

- the gate opens but the session never passes
  - check the issuer logs
  - check `GET /iproov/session/:session`
  - make sure the demo page actually posted success back to the issuer

## What The Wallet Files Mean

Students will often ask which files are "configuration" and which files are "behavior". Use this split:

- configuration
  - iOS: [Wallet.plist](/Users/johansellstrom/dev/iproov/RSA/eudi-app-ios-wallet-ui/Wallet/Wallet.plist)
  - Android: [presentation-feature/build.gradle.kts](/Users/johansellstrom/dev/iproov/RSA/eudi-app-android-wallet-ui/presentation-feature/build.gradle.kts)

- gate behavior
  - iOS: [IProovPresentationGate.swift](/Users/johansellstrom/dev/iproov/RSA/eudi-app-ios-wallet-ui/Modules/feature-presentation/Sources/IProov/IProovPresentationGate.swift)
  - Android: [IProovPresentationGate.kt](/Users/johansellstrom/dev/iproov/RSA/eudi-app-android-wallet-ui/presentation-feature/src/main/java/eu/europa/ec/presentationfeature/iproov/IProovPresentationGate.kt)

- the point where the normal presentation flow is paused
  - iOS: the iProov gate runs before the wallet sends the presentation response
  - Android: the iProov gate runs before `sendRequestedDocuments()`

## Instructor Short Answers

- "Do students need the wallet to pass Labs 00 to 05?"
  - No. The wallet is the advanced/mobile track.

- "Should students build iProov integration from scratch?"
  - No. They should receive a fork with the gate already wired.

- "Which platform is better for live class use?"
  - iOS is the best path for native iProov on a real device.
  - Android is currently the additive web-fallback path.

- "Should students change `demo-conductor` to make the wallet work?"
  - No. The booth demo path must stay separate and unchanged.
