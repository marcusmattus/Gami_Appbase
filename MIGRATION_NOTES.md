# Migration notes — feature/privy-base-dual-target

This branch executes **P0–P5** of the master build prompt (P5's screens are a
first structural pass — see §4 below for what's real vs. placeholder). P6–P7
are not started. Everything below reflects the code as it actually stands —
`pnpm install` was run for real, every package listed as "typecheck: Done"
below was actually typechecked against the real installed dependencies (not
just written and assumed correct), the core test suite actually runs, and
the ESLint gates were proven to fire with a deliberate violation file (see
§3's ESLint entry). Read this before continuing the build.

## 0. Repo reality vs. the prompt's premise

The master prompt assumes an **existing** "Expo SDK 54 Gami Wallet build (60
files, 14 screens, ARCADE design system)" to migrate. The actual repo
(`marcusmattus/Gami_Appbase`) contained only a `README.md` — no app code
existed. This is therefore a **greenfield build of the §3 target
architecture**, not a migration. Nothing was ported from a prior app; nothing
was deleted.

## 1. Design source (§0) — what was actually importable

Connected to the `claude_design` MCP and pulled these files from project
`d0d6079a-913c-4454-be23-6a383b93f651` ("Gami wallet mobile app"):

- **`Gami Wallet Mobile.dc.html`** — the Claude Design **canvas
  wrapper/board**, not a screen. Renders a live-prototype panel + a static
  screen board by importing a component named `GamiScreen`.
- **`android-frame.jsx`** / **`ios-frame.jsx`** — confirmed, as the prompt
  predicted, to be pure device-chrome scaffolding (status bar, dynamic
  island, gesture nav, on-screen keyboard mockups). **Not ported.**
- **`support.js`** — the generated `dc-runtime` bundle that powers the
  Claude Design canvas itself, not app helpers. **Nothing portable in it.**
  The formatters in `packages/core/src/format/` were written fresh from the
  ARCADE spec (§2.2/§5.1).
- **`GamiScreen.dc.html`** — fetched in a follow-up pass once the user asked
  to unblock P5. This is the actual source for all 15 screens (splash +
  §7's 14). Read in full (918 lines) and used directly to build the
  `apps/mobile/app/**` screens in §4 below.
- **`GamiExt.dc.html`** / **`Gami Wallet.dc.html`** — also fetched to check
  for shared chrome per this file's earlier note. Turned out to be a
  **separate product**: a Chrome extension ("the browser becomes the quest
  layer") with its own 18-state popup, side panel, and toolbar-icon surfaces.
  Nothing in it applies to the mobile/web wallet build. Not ported, not
  further investigated — out of scope for this repo.
- **`assets/gami-hexagon.png`** / **`assets/gami-logo-circle.png`** — the
  brand mark, fetched to build the app icon set (§4.6 below).

## 2. §0 vs. §2 token conflicts (from the wrapper files)

None found in the four originally-requested files — no competing
color/radius/font values against §2.2's locked tokens. **Real conflicts
turned up once `GamiScreen.dc.html` was read — see §4.1 below.**

## 3. What's implemented (P0–P4) — and verified, not just written

- **P0** — pnpm workspace monorepo per §3, root `turbo.json`,
  `tsconfig.base.json`, `eslint.config.mjs` + `eslint-rules/`.
  `packages/core` compiles clean with `"lib": ["ES2022"]`, `"types": []` — no
  DOM lib, no Node types, no RN/Next/Expo imports. **All 7 packages/apps with
  a `typecheck` script pass `pnpm -r typecheck`** (core, api, ui, identity,
  chain, mobile, web) against the actually-installed dependency tree.
- **P1** — `GamiWallet` interface (verbatim from §4) +
  `packages/core/src/wallet/conformance.ts`, a framework-agnostic suite both
  adapters must pass identically. Not yet invoked against either adapter
  (that needs a live Privy app / a browser wagmi context to run in — outside
  what a headless typecheck can exercise).
- **P2 — `packages/identity/src/privy-expo-adapter.ts`.** Written first
  against the master prompt's documented shape (`usePrivy().login()`,
  `getUserEmbeddedEthereumWallet`), then **corrected against the real
  installed `@privy-io/expo@0.51.0` type declarations** — and the prompt's
  own caution in §4.2 ("verify the SIWE hook name against the installed SDK
  version") turned out to apply here too, harder than expected:
  - `usePrivy()` has **no `login()` method** in this SDK version. Login is
    inherently multi-step and method-specific
    (`useLoginWithEmail`'s `sendCode`/`loginWithCode`, or
    `useLoginWithOAuth`'s `login({ provider: 'google' | 'apple' })`). Per
    §7's screen map, that's actually fine architecturally: screens 2/3
    (start/otp) own Privy's login UI directly and are *not* behind the
    GamiWallet seam — login isn't a wallet operation. `connect()` in the
    adapter now provisions the embedded wallet for an **already-authenticated**
    user instead, matching screen 3's "creating" step.
  - `getUserEmbeddedEthereumWallet` (named in the prompt) **does not exist**
    in this SDK version. Replaced with `useEmbeddedEthereumWallet()`'s
    `wallets` array + `create()`, plus a local helper that walks
    `user.linked_accounts` for the `type: "wallet"` /
    `chain_type: "ethereum"` / `wallet_client_type: "privy"` /
    `connector_type: "embedded"` entry (verified against
    `@privy-io/public-api`'s real `PrivyEthereumEmbeddedWalletAccount` zod
    schema).
  - **No dedicated passkey-login hook is exported by this SDK version.**
    Passkeys only surface inside MFA enrollment
    (`useMfaEnrollment({method:'passkey'})`), not as a first-class login
    method. §4.1 locks passkey as a required login method — **that
    requirement is currently unsatisfiable with `@privy-io/expo@0.51.0`'s
    public API as installed.** This needs a Privy SDK version check or a
    support ticket, not a workaround. Flagged loudly in the adapter's file
    header too.
  - `packages/identity` **typechecks clean** against the real installed SDK
    (confirmed via `pnpm --filter @gami/identity typecheck`).
- **P3** — `packages/identity/src/base-account-adapter.ts`
  (`useBaseAccountWallet()` over wagmi + `@base-org/account`, 5s timeout on
  every provider acquisition per §4.2/§4.3) + `packages/identity/src/base-account-config.ts`
  (the wagmi `Config` builder) + `packages/identity/src/provider.tsx`
  (`GamiWalletProvider`, wrapping `WagmiProvider`+`QueryClientProvider`) +
  SIWE plumbing: `packages/core/src/auth/siwe.ts` (pure EIP-4361 builder) and
  `apps/web/src/app/api/auth/siwe/{nonce,verify}/route.ts`.
  - **Correction made during build:** the wagmi config was originally written
    directly in `apps/web/src/wagmi.config.ts`. Running the real ESLint
    config against it correctly flagged that as a rule-1 violation — wagmi
    may only be imported inside `packages/identity`, and that includes the
    app shell's *provider wiring*, not just screens. Moved the config
    builder into `packages/identity` and added `GamiWalletProvider` so
    `apps/web`'s eventual root layout only ever imports that one component
    from `@gami/identity`, never wagmi itself.
  - The SIWE verify route checks the signature and nonce for real (via
    `siwe`), then calls a deliberately-throwing `mintPrivySessionFromSiwe()`
    placeholder, per §4.2's explicit instruction to verify the real
    server-auth API before wiring it rather than guessing.
- **P4** — `packages/chain`: `constants.ts` (§2.1 values verbatim),
  `clients.ts`, `balances.ts` (single `multicall3` batch, not a loop),
  `gas.ts` (1.2× headroom, `MAX_TX_GAS_USD = 5.00` ceiling with a
  `requiresSecondConfirm` flag), `simulate.ts` (decodes revert reasons),
  `paymaster.ts` (client never talks to CDP directly — goes through a
  `SponsorshipApiClient` your backend implements; the single
  contract+selector allowlist check is real but is UX-layer defense in
  depth, not the security boundary — §11.2's backend re-check is), and
  `tx-queue.ts` (storage-injected, platform-agnostic; neither MMKV nor
  IndexedDB is wired in yet).
  - **Real bug found and fixed:** annotating `createGamiPublicClient`'s
    return type as the bare `PublicClient` (no chain generic) failed to
    typecheck against what `createPublicClient({chain: base, ...})` actually
    returns — Base's chain definition carries OP-Stack-specific formatters
    (a "deposit" transaction type) that make the inferred client type
    structurally incompatible with the generic one. Fixed by parameterizing
    every `PublicClient`/`WalletClient` usage in `packages/chain` as
    `PublicClient<Transport, GamiChain>` instead of leaving it bare. This is
    a genuine viem gotcha, not an artifact of this monorepo.
  - **Real bug found and fixed:** the initial `pnpm install` produced two
    physically different `viem` instances in `node_modules/.pnpm`
    (`2.23.2` and `2.56.3`, further split by differing `zod` peer
    resolutions) because different packages declared different semver
    ranges. TypeScript treated `PublicClient` from one instance and
    `PublicClient` from another as "two different types... unrelated."
    Fixed with `pnpm.overrides: { "viem": "2.56.3" }` in the root
    `package.json` to force one resolution workspace-wide.
- **§6.1 XP idempotency** — `packages/core/src/xp/idempotency.ts`, using
  viem's pure-JS `sha256` (not `node:crypto`, which doesn't exist in the
  Hermes/RN runtime this code also ships to). **7 property tests, actually
  run** (`pnpm --filter @gami/core test`), all passing — determinism,
  per-field sensitivity, and the case-insensitive-on-address-only rule.
- **§10 flags** — `packages/core/src/flags/index.ts`. `scripts/assert-no-token-strings.mjs`
  (prebuild bundle-scan gate) and `scripts/assert-no-farcaster-deps.mjs`
  (§8 acceptance check) both exist and were **run for real**:
  - The farcaster-deps gate originally shelled out to
    `pnpm list --depth Infinity --json`, which **OOM'd the Node process**
    (`JavaScript heap out of memory`) on apps/web's full Next.js tree — that
    approach doesn't scale. Rewritten to grep `pnpm-lock.yaml` directly
    (cheap, exact, every resolved package — direct or transitive — gets its
    own line). Confirmed passing: `✅ apps/web dependency tree is clean of
    farcaster/minikit.`
- **ESLint (§11.3)** — all six rules confirmed **actually firing**, not just
  present in config. Proved this with a deliberate two-file violation
  (`__lint_smoketest.ts`/`.tsx`, since deleted) covering all six rules at
  once, then re-ran clean after fixing.
  - **Real bug found and fixed:** ESLint's flat config does **not** merge
    `no-restricted-imports` `patterns` across multiple config objects that
    match the same file — the *last* matching block for a rule name wins
    outright and silently drops every earlier block's patterns for that
    file. The original config had rule 1 (privy/wagmi) and rule 2
    (RN/Next/Expo) as separate blocks both matching `packages/core/**`; rule
    2 was silently getting overwritten and never actually enforced there.
    Caught only because the smoke test deliberately violated both at once
    in the same file and rule 2's error didn't show up. Rewritten so every
    file scope computes exactly **one** combined `no-restricted-imports`
    pattern list (see the comment at the top of `eslint.config.mjs`) instead
    of being assembled from separately-authored per-rule blocks — this bug
    class can still happen if someone adds a new per-rule block without
    reading that comment, so it's worth a second pair of eyes before this
    config is trusted for CI.

## 4. P5 — screens (first pass)

All 15 screens from `GamiScreen.dc.html` (splash, welcome, start, otp,
creating, handle, home, quests, quest detail, scan, nova, profile, settings,
send, receive) are ported to `apps/mobile/app/**` via expo-router, typecheck
clean, and lint clean against all six §11.3 gates (verified — see §3's
lint-bug note, which was caught and fixed *during* this pass, not before it).

### 4.1 §0 vs. §2 conflicts found in the actual screens (tokens win, per the
master prompt's own rule)

- **Gradients and blur, pervasively.** Nearly every "hero" surface in the
  design (home's XP card, the wallet-creation icon tile, profile's header,
  the splash glow, scan's success card) uses `linear-gradient` and/or
  `filter: blur(...)`. §2.2 forbids both outright. Every instance was
  flattened to a solid `color.primary` fill with the existing hard-offset
  shadow treatment; decorative blurred glow shapes were dropped entirely
  rather than approximated.
- **Success/XP green mismatch.** Design uses `#00F5A0` consistently for XP
  text, checkmarks, and progress fills. The locked token is
  `color.success = #00E5A0` — visually almost identical but not the same
  value. Every screen uses the locked `#00E5A0`.
- **Small circular status indicators.** The design's online/streak dots use
  `border-radius: 50%`. §2.2 says "zero radius, no exceptions." Rendered as
  squares (`ArcadeStatusDot`, and inline square dots on the nova/scan/home
  screens) instead.
- **Font weight granularity.** The design varies Inter from 300–700 and
  Space Grotesk from 400–700 depending on context (e.g. quest titles at
  Inter 600, body copy at Inter 300). The locked `font` object defines
  exactly three fixed styles (`SpaceGrotesk_700Bold`, `Inter_400Regular`,
  `JetBrainsMono_500Medium`) with no weight variants. `ArcadeText`'s three
  variants are the only text styles used anywhere in the screens — the
  design's finer weight distinctions are not reproducible under the lock as
  written. Flagged here rather than silently adding a fourth/fifth font
  weight.
- **"GAMI L2" language.** The design's receive-screen footnote reads "SEND
  ONLY GAMI L2 AND ETHEREUM ASSETS." §14 explicitly forbids describing Gami
  Chain as an L2/sidechain/rollup. Changed to "SEND ONLY BASE AND ETHEREUM
  ASSETS" in `apps/mobile/app/receive.tsx`.
- **The flagged-off "50 $GAMI" chip on the scan screen.** The design shows
  this dashed/dimmed with a "FLAG OFF" marker, matching §0.1's decision that
  it should be "visible in design, off in build." A runtime
  `if (FLAGS.GAMI_TOKEN_MODULE)` guard is **not sufficient** to satisfy
  that: §10's bundle-scan gate greps the *built* JS for the literal string
  `$GAMI`, and Metro doesn't cross-module constant-fold an imported `false`
  the way a bundler `DefinePlugin` would — the string would survive
  minification inside a dead `if` branch. The only build-safe choice while
  the flag is locked off was to omit the string from source entirely
  (`apps/mobile/app/scan.tsx` has a comment explaining this at the call
  site). Re-add it, flag-gated, only once `GAMI_TOKEN_MODULE` is expected to
  ship true, or once a real bundler-level dead-code-elimination step is
  wired into the build pipeline.
- **Not a conflict, but a scope note:** the ARCADE lock's five colors
  (bg/primary/accent/success/danger) have no card-surface, border-neutral,
  muted-text, or warning slot — insufficient for a real multi-surface app.
  Added `surface`, `text`, `highlight` (#9C6CFF), and `warn` (#F5C518) to
  `packages/ui/src/tokens.ts`, explicitly marked as gap-fills taken from the
  design's own consistent neutrals, not silently invented brand colors. This
  needs a design-system owner's sign-off, not just an implementation
  decision.

### 4.2 What's real vs. placeholder in this pass

**Real, wired to the actual seam/chain layer:**
- `onboarding/start.tsx` / `otp.tsx` call the real
  `useGamiEmailLogin`/`useGamiOAuthLogin` hooks (new in
  `packages/identity/src/privy-login-hooks.ts` — screens can't import
  `@privy-io/expo` directly, same eslint rule 1 as everything else).
- `onboarding/creating.tsx` calls the real `usePrivyWallet().connect()` for
  its first two checklist rows (wallet provisioning + signing key). The
  other two rows ("PROTOCOL HANDSHAKE", "XP LEDGER LINKED") are an **honest
  stub** — a plain `setTimeout`, clearly commented as such — because there
  is no Gami backend in this repo to actually shake hands with yet.
- `send.tsx` runs the real §5.1 safety pipeline: `simulateBeforeSend` before
  any signature request, `estimateGasWithCeiling` with the real
  `requiresSecondConfirm` gate wired to an actual second-tap UI state, and
  `wallet.sendTransaction` for the real signature. The ETH/USD price feeding
  the gas-ceiling check is a hard-coded placeholder (`PLACEHOLDER_ETH_USD`)
  since §11.2 requires a server-trusted price and none exists yet — clearly
  TODO-commented, not silently faked as live.
- `receive.tsx` renders a real QR of `wallet.address` (via
  `react-native-qrcode-styled`, ambient-typed in
  `apps/mobile/src/types/react-native-qrcode-styled.d.ts` since it ships no
  types) and a real copy-to-clipboard.
- `settings.tsx`'s "Sign out" calls the real `wallet.disconnect()`.
- `scan.tsx` computes the real `questIdempotencyKey` for what would be the
  claim request, and enforces the "second press returns the same grant"
  rule locally as defense in depth (the real enforcement is server-side
  dedup on that key, same as always).

**Placeholder, clearly marked, needs a real backend:**
- `mockData.ts` (quest list, XP totals, profile stats) — fixture data taken
  from the design, not a live read. `packages/api`'s `GamiApiClient` has
  nowhere real to point yet.
- Handle/`.gami`-name registration (`onboarding/handle.tsx`) — SKIP and
  CLAIM both just navigate to home; §11's still-open question about whether
  the `.gami` registry is on-chain or off-chain is unresolved, so no
  registration call was invented.
- `settings.tsx`'s "Delete account" is present but disabled — the deletion
  endpoint doesn't exist. App Review requires the button to exist and
  actually work; shipping it disabled is a placeholder, not a final state.
- Send/receive amount and recipient fields are static (matching the design's
  own fixture values), not real inputs — cosmetic wiring, deliberately
  deprioritized in favor of getting the safety pipeline (simulate → gas
  ceiling → sign) actually real first.

### 4.3 Navigation

`apps/mobile/app/_layout.tsx` (root Stack) → `onboarding/*` (plain stack,
5 steps) → `(tabs)` (home/quests/nova/profile via a custom `GamiTabBar` in
`src/components/TabBar.tsx`, replicating the design's elevated SCAN square
between quests and nova exactly) → `quest/[id]`, `scan`, `settings`, `send`,
`receive` as stack pushes. `GamiTabBar` needed `@react-navigation/bottom-tabs`
added as a direct dependency for `BottomTabBarProps` — added to
`apps/mobile/package.json`.

### 4.4 What P5 has NOT touched

- **`apps/web`** has no screens yet — `apps/web/src/app/api/auth/siwe/**`
  (from P3) is still the only real code there besides the new `icon.png`
  (§4.6). The design source only covers the native app; a genuinely
  responsive/adapted web layout for the screens above is separate work.
- **The four/five states per screen** (§7's table: loading, empty, error,
  offline) that the design's screen board shows are **not** built — every
  screen above renders its single "ready" state only. `GamiScreen.dc.html`'s
  `variant` prop (`ready|loading|empty|error|offline`) exists in the design
  and was read, just not ported into the RN components yet.
- **NOVA's chat backend** (§6.3: an LLM constrained to
  `getBalance/getXp/listQuests/simulateTransaction/explainTransaction`, zero
  write tools) doesn't exist — `nova.tsx` has scripted placeholder replies
  only. The *structural* guarantee (no `GamiWallet` import in this file, so
  no write capability is even reachable) holds regardless.

### 4.5 A real bug found and fixed while building the screens

`ArcadeButtonProps` originally `Omit<PressableProps, "style" | "children">`
— deliberately no `style` prop, to stop callers from overriding the locked
ARCADE button chrome per-instance. Two screens (`otp.tsx`, `send.tsx`) needed
to position a ghost "back" button with `alignSelf`/`marginTop`, which the
omitted `style` would have silently type-error'd on had TypeScript not
caught it. Added a narrower `containerStyle` prop instead of reopening
`style` — verified both call sites via a real `tsc` run, not by inspection.

### 4.6 App icons

The user supplied reference images mid-session ("make these the app icons")
showing a flat white hexagon-"G" mark on a solid purple circle/square — no
gradient or bevel shading. The actual project assets
(`assets/gami-hexagon.png`, `assets/gami-logo-circle.png`, fetched from the
same `claude_design` project) turned out to be a **3D-shaded version** of
the same mark on a near-white background — not directly usable, and the
gradient bevel shading is itself a §2.2 violation.

Built the flat versions with Python/Pillow (`sips`/ImageMagick/`rsvg-convert`
were not available in this environment): extracted the mark via a
luminosity-based alpha mask, thresholded to a binary (non-gradient) silhouette,
recolored flat white, then composited onto solid `color.primary` (`#6E3CFB`)
at the sizes each platform needs:
- `apps/mobile/assets/icon.png` (1024×1024, opaque, ~58% mark width) — iOS/
  standard Expo icon.
- `apps/mobile/assets/adaptive-icon.png` (1024×1024, transparent, ~42% mark
  width) — Android adaptive-icon foreground; background color set to
  `color.primary` directly in `app.config.ts` rather than a second PNG.
- `apps/mobile/assets/splash-icon.png` (512×512, transparent, purple circle
  badge + mark) — wired via the `expo-splash-screen` config plugin
  (`backgroundColor: color.bg`), added as a new dependency + plugin entry.
- `apps/web/src/app/icon.png` — Next.js App Router's auto-detected favicon
  convention (a file literally named `icon.png` in `app/`), same mark.

Not reproduced: the pasted splash mockup's decorative blurred color blobs —
same §2.2 gradient/blur prohibition as everywhere else in this pass.

## 5. Explicitly NOT done — needs a human with account access

- **Privy dashboard**: §4.1 says native auth is blocked until you "request
  access" for the Expo SDK in the Privy dashboard. You supplied a Privy App
  ID (`cmrz2f6jc01560djmtczc288n`) and an App Secret mid-session on
  2026-09-03 — **that secret was pasted into chat and was treated as
  compromised.** A replacement secret was pasted into chat again on
  2026-09-04 (now in `apps/web/.env`) — **that one is compromised too, for
  the same reason.** Rotate it in the Privy dashboard once this session is
  done, and going forward edit `apps/web/.env` / `apps/mobile/.env` directly
  rather than pasting secret values into chat — they get written into
  session logs regardless of `.gitignore`. The values are sitting in
  `apps/mobile/.env` / `apps/web/.env` (both git-ignored, confirmed via
  `git check-ignore`, never committed) — update them there once rotated.
  Configure Privy **test accounts** for App Store review per §4.1/§9.1 —
  not done. Separately: confirm with Privy support whether passkey login is
  actually available in `@privy-io/expo@0.51.0` (see P2 notes above) — §4.1
  locks it as a required method and the installed SDK's public API doesn't
  expose it.
- **Apple**: org-enrolled Apple Developer account under the Gami Foundation
  (§9.1, guideline 3.1.5(b)) — not verified/created. `PrivacyInfo.xcprivacy`
  — not written (depends on which native modules actually end up linked).
- **Google Play**: Financial Features declaration, Data Safety form — not
  filed (§9.2).
- **EAS**: project ID `a34177f8-42ca-48d4-8c87-39f82476418e` is wired into
  `app.config.ts`, but no `eas build`/`eas submit` has been run.
- **Base.dev**: project registration (§8.2) — needs your Base.dev account.
  `apps/web`'s dependency tree is verified clean of farcaster/minikit
  (`pnpm run gate:no-farcaster-deps`).
- **Physical device verification in the real Base App WebView** (§8.5) —
  impossible without a device and a registered app.
- **CDP paymaster** — `CDP_PAYMASTER_URL` is a blank server env var; no
  sponsorship policy has actually been configured on Coinbase's side.

## 6. Metro/Babel config for pnpm (found by actually running `expo start`)

`apps/mobile` had no `metro.config.js` or `babel.config.js`. Running
`expo start` surfaced this immediately: Metro's default resolver couldn't
navigate pnpm's symlinked `node_modules` layout, silently gave up on
resolving `apps/mobile/index.js` as the entry, and fell back to Expo's
generic `expo/AppEntry.js` (which imports a top-level `../../App` that
doesn't exist in this project) — surfacing as `Unable to resolve '../../App'
from '.../expo/AppEntry.js'`. Fixed with a standard pnpm-monorepo Metro
config (`watchFolders` including the workspace root,
`disableHierarchicalLookup: true`, `unstable_enableSymlinks: true`) and a
`babel.config.js` wiring the three transform plugins §4.1's Appendix A
already listed as dependencies but that were never actually referenced from
anywhere. Also added `babel-preset-expo` as an explicit devDependency — it
was only present as a transitive install, and pnpm's strict `node_modules`
doesn't expose phantom dependencies, so `disableHierarchicalLookup` would
have made it unresolvable. Verified the symlink resolves
(`apps/mobile/node_modules/babel-preset-expo` → the pnpm store) and that
`tsc --noEmit` still passes; **not yet verified end-to-end in a running
Metro bundler/simulator** — that needs you to run `cd apps/mobile && npx
expo start -c` (the `-c` matters: it clears the cache from the earlier
failed resolution).

## 7. 2026-09-04 pass — sign-up/sign-in verification, SIWE, passkey

Scope: verify mobile auth wiring end-to-end, fix the SIWE placeholder, resolve
the passkey gap. Items 1–3 of §9's gap list (below) are now closed; the rest
of §9 stands as written.

- **Babel bundling crash fixed.** `apps/mobile/babel.config.js`'s explicit
  `@babel/plugin-transform-class-properties`/`transform-private-methods`
  defaulted to `loose: false`, conflicting with `babel-preset-expo`'s own
  internal copy of `transform-private-property-in-object` (`loose: true`) —
  Babel requires all three to agree. This blocked Metro from bundling at all
  (`'loose' mode configuration must be the same for ...`), independent of
  anything auth-related. Fixed by setting `{loose: true}` on both.
- **Passkey login — the §7/P2 "unsatisfiable" note was wrong.**
  `@privy-io/expo@0.51.0` (the version actually installed) does export a
  first-class `useLoginWithPasskey`, just from the `@privy-io/expo/passkey`
  subpath, not the main entry — confirmed against both the installed
  package's `exports` map and docs.privy.io, not assumed. Wired in
  `packages/identity/src/passkey-login-hooks.ts`, added a PASSKEY button to
  `start.tsx`, and added the `webcredentials:` associated-domain entry +
  `expo-build-properties` iOS/Android bumps it needs in `app.config.ts`.
  Actually hosting the apple-app-site-association/assetlinks.json files with
  the real Team ID / signing-cert fingerprint still needs account access.
- **Email OTP bug fixed.** `otp.tsx`'s `email` state was hardcoded to `null`
  (a known, commented P5 gap) — `sendCode` never actually fired. `start.tsx`
  now collects the email inline (new `ArcadeInput` in `packages/ui`) and
  passes it via router params.
- **SIWE: the whole approach was backwards, not just unfinished.** The old
  `apps/web/src/app/api/auth/siwe/{nonce,verify}/route.ts` hand-rolled a
  nonce/verify flow ending in a `mintPrivySessionFromSiwe` placeholder that
  called a Privy server API which doesn't exist. Checked docs.privy.io
  directly: Privy already solves this client-side — `useLoginWithSiwe`'s
  `generateSiweMessage` asks Privy's own backend for the message/nonce, and
  `loginWithSiwe` submits the signature straight to Privy, which verifies it
  and establishes the session itself. No custom server route, no `siwe` npm
  package, no `PRIVY_APP_SECRET`, needed for this flow. Deleted the two
  routes, `packages/core/src/auth/siwe.ts`, and the `siwe` dependency; added
  `packages/identity/src/web-provider.tsx` (`GamiPrivyWebProvider`) and
  `web-login-hooks.ts` (`useGamiSiweLogin`); built `apps/web`'s first real
  screen (`src/app/layout.tsx` + `page.tsx`) since none existed before this
  pass. `@privy-io/react-auth`'s `@farcaster/mini-app-solana` peer is
  `optional: true` and confirmed not installed — doesn't reintroduce §8/§14's
  Farcaster ban.
- **Three separate dependency-drift typecheck breaks, found and fixed.**
  `packages/identity`, `packages/ui`, and `apps/mobile` each had a *floating*
  `@types/react` devDependency (`^18.3.12` / `^18.3.12` / `~19.1.10`) that had
  each independently drifted to a newer patch since this repo's last
  typecheck-clean pass, each newer patch tightening JSX/`ReactNode` typing
  enough to break interop with `wagmi`/`react-native`'s own type
  declarations (`TS2786`, `refs`-missing-on-`NativeMethods`-style errors) —
  none of them were caused by this session's code, all surfaced simply by
  running `pnpm -r typecheck` for real. Pinned all three exactly. Separately,
  `packages/ui`'s `react-native`/`react-native-safe-area-context` devDeps
  were stale relative to what `apps/mobile` (ui's only real consumer)
  actually uses — since `@gami/ui` ships raw `.tsx` source as its
  `main`/`types`, TS resolves each file's imports against *ui's own*
  `node_modules`, so a stale pin there is a real cross-package hazard, not
  just cosmetic. Realigned to mobile's exact versions.
  - The `wagmi`/`@tanstack/react-query` `WagmiProvider` JSX-typing error
    (`TS2786`, "`Property 'children'` is missing... required in type
    `ReactPortal`") came back after an *unrelated* dependency change
    elsewhere in the workspace shifted pnpm's peer resolution, even with
    `@types/react` pinned exactly — i.e. version-chasing this one isn't
    stable. Fixed it structurally instead: `provider.tsx` now widens
    `WagmiProvider`'s call signature with a documented cast (same pattern as
    `mobile-provider.tsx`'s existing `supportedChains` cast for a Privy
    typing gotcha), so it no longer depends on exact patch versions lining
    up.
- **Two false positives found in this repo's own gates, fixed:**
  - `eslint-rules/index.mjs`'s `no-soft-effects` rule matched the substring
    `blur` anywhere in an identifier, flagging React Native's legitimate
    `onBlur` event prop (nothing to do with visual blur) the moment
    `packages/ui/src/Input.tsx` used it. Narrowed the regex to exclude the
    `on`-prefixed spelling specifically.
  - `scripts/assert-no-farcaster-deps.mjs` grepped every line of
    `pnpm-lock.yaml` for `farcaster`/`minikit` regardless of YAML nesting
    depth, so `@privy-io/react-auth`'s optional (never-installed)
    `@farcaster/mini-app-solana` peer-dependency *declaration* — nested
    inside react-auth's own lockfile entry, not a resolved package — tripped
    it. Narrowed to only match top-level (2-space-indented) resolved package
    keys, which is what the gate's own stated intent ("zero farcaster code
    ships") actually requires.

## 8. 2026-09-05 pass — SDK 54→57 jump, first real end-to-end Metro bundle

Something outside this session bumped `apps/mobile`'s entire Expo toolchain
from **SDK 54 to SDK 57** mid-session (`expo` 54→57.0.20, `expo-router`
~6.0.24→~57.0.19, `react-native` 0.81.5→0.86.3, `react` 19.1.0→19.2.3, every
`expo-*` package, `typescript` ^5.6.3→^6.0.3) — not a change made here, and
confirmed with the user before proceeding on SDK 57 rather than reverting.
This section is the real, load-bearing payoff of that call: **the app now
bundles end-to-end for the first time in this repo's history** —
`npx expo export --platform ios` and `--platform android` both produce a real
Hermes bundle (9.4MB/9.7MB, ~4,500 modules) — confirmed by actually running
it, not by typecheck alone. Every fix below was found by reading the actual
Metro error and import stack, not guessed.

- **Bundle identifier standardized** on `com.gamiprotocol.wallet` (was
  `io.gamiprotocol.wallet` in `apps/mobile/app.config.ts`; a stray root-level
  `app.json`/`eas.json`/`ios/`/`android/` — leftover from an earlier
  `expo prebuild`-type command run from the repo root instead of
  `apps/mobile` — had a *third* value, `com.gamiprotocol.gamiwallet`). The
  stray root artifacts were deleted (`eas.json` was actually `git add`ed;
  unstaged first). `apps/mobile/eas.json` already had the right content.
- **`expo-build-properties`'s enforced minimum OS versions moved with the
  SDK**: iOS `deploymentTarget` floor went 15.1 (SDK 54) → 16.4 (SDK 57).
  Bumped in `app.config.ts`.
- **`android.edgeToEdgeEnabled` was removed from `@expo/config-types`
  entirely under SDK 57** — edge-to-edge is now mandatory (not opt-in) for
  apps targeting Android SDK 35+, so there's no config flag for it anymore.
  Removed from `app.config.ts`.
- **`expo-router@57` vendors its own fork of `@react-navigation/bottom-tabs`**
  (`expo-router/build/react-navigation/bottom-tabs/types`) — its `<Tabs
  tabBar={...}>` prop no longer structurally matches the standalone
  `@react-navigation/bottom-tabs` package's `BottomTabBarProps` (diverged
  `descriptors`/`options` shape, `TS2786`). `TabBar.tsx` now imports the type
  from expo-router's own (unexported-but-reachable) path instead; the
  now-redundant direct `@react-navigation/bottom-tabs` dependency was
  removed from `apps/mobile/package.json`.
- **`StyleSheet.absoluteFillObject` was removed from RN 0.86's types** — only
  `StyleSheet.absoluteFill` remains. Fixed the one call site
  (`app/(tabs)/home.tsx`).
- **`disableHierarchicalLookup: true` in `metro.config.js` was itself a real
  bug**, not a config that just needed updating. It was added during the
  original SDK 54 pass (§6) to fix Metro falling back to `expo/AppEntry.js`
  — but it also stops Metro from resolving a package's own nested
  dependencies via its per-package `node_modules` (pnpm's whole isolation
  model), which surfaced as "Unable to resolve module fast-base64-decode
  from .../react-native-get-random-values/index.js" even though the pnpm
  symlink was genuinely present and correct. Removed; `unstable_enableSymlinks`
  plus the already-present explicit `nodeModulesPaths` are what actually fix
  the original `AppEntry.js` problem, and removing the other setting was
  verified not to reintroduce it (`expo export` still resolves the real
  entry point).
- **Metro has no `.js`→`.ts`/`.tsx` resolution fallback**, and this repo's
  entire TS source uses explicit `.js` extensions on relative imports
  (`packages/core/src/index.ts`: `export * from "./wallet/types.js"`, file on
  disk is `.ts` — valid for `tsc`'s NodeNext-style resolution, meaningless to
  Metro). This broke *nearly every cross-package import* the instant a real
  bundle was attempted — MIGRATION_NOTES §3/P0 always caveated that nothing
  had been verified in a running bundler, and this is why. Added a custom
  `resolver.resolveRequest` in `metro.config.js` that tries the TS source
  extensions first for relative `.js` specifiers, falling back to Metro's
  default resolution for everything else (real `.js` files included).
- **A real architecture bug from the 2026-09-04 SIWE pass, found here**:
  `packages/identity/src/index.ts` re-exported every file — mobile-only and
  web-only alike — from one shared barrel. Since `apps/mobile` imports from
  `@gami/identity`, Metro had to resolve the ENTIRE reachable graph of every
  exported binding, including the web-only `web-login-hooks.ts`'s
  `@privy-io/react-auth` → `styled-components` → `css-to-react-native`,
  which isn't resolvable on React Native at all — even though no mobile code
  ever calls anything web-related. Fixed by splitting the package into two
  subpath exports instead of one barrel: `@gami/identity/mobile` and
  `@gami/identity/web` (`package.json`'s `exports` map, `src/mobile.ts` +
  `src/web.ts` replacing `src/index.ts`). Every consumer import updated;
  `apps/mobile/tsconfig.json`'s path alias updated to match.
- **`@privy-io/expo`'s dependency chain needs Node-core polyfills that don't
  exist on Hermes** — `@privy-io/js-sdk-core` → `jose` imports `crypto` and
  `zlib` directly (`jose`'s own `package.json` `exports` has no
  `"react-native"` condition, only `browser`/`node`/`bun`/`deno`, so Metro's
  RN/require conditions fall through to the Node build). This is a
  documented Privy+Expo setup requirement, not specific to this repo
  (docs.privy.io's Expo installation guide names `expo-crypto-polyfills` for
  exactly this). Wired via `metro.config.js`'s `resolver.extraNodeModules`:
  - `expo-crypto-polyfills` (installed) supplies `crypto`, `stream`, `path`,
    etc.
  - Its own `url` mapping is a no-op here — it does `require.resolve("url")`,
    but Node always resolves a bare `"url"` specifier to its own built-in
    core module ahead of any installed npm package of the same name.
    Installed the npm `url` package and mapped it via `require.resolve("url/")`
    (trailing slash — documented on that package as the way to skip Node's
    core-module shortcut).
  - `zlib` isn't in `expo-crypto-polyfills`' map at all. A real polyfill
    (`browserify-zlib`) pulls in `assert`/`buffer`/`util` Node-core shims
    transitively for a jose feature (JWE DEFLATE compression) that Privy's
    SDK never actually calls in its login/wallet flows — stubbed instead
    with `apps/mobile/polyfills/zlib-stub.js` (two functions that
    error-callback if actually invoked, which they should never be).
- Not yet done: an actual device/simulator run (`npx expo run:ios` /
  `run:android`) — `expo export` proves the JS bundle resolves and compiles,
  not that native modules link correctly or that the app boots. That still
  needs `npx expo prebuild -c` (native projects were deleted from the repo
  root, never generated in `apps/mobile`) and a real build.

## 8.1 First real runtime crash, found by actually running the app

The user ran the bundle for real (not just `expo export`) and hit an
uncaught error at startup: `Cannot assign to read-only property 'NONE'`, in
React Native's own `src/private/webapis/dom/events/Event.js`, triggered from
the Metro/dev-server WebSocket's event dispatch.

- **Root cause**: RN's `Event.js` defines the DOM `Event.NONE` /
  `CAPTURING_PHASE` / `AT_TARGET` / `BUBBLING_PHASE` constants via
  `Object.defineProperty` without `configurable: true, writable: true` —
  they default to non-configurable/non-writable. `event-target-shim` (a
  dependency of `abort-controller`, used internally by `fetch()`, and pulled
  in by WalletConnect/wagmi's WebSocket-based provider code, part of this
  app's Base Account chain) tries to redefine those same properties on
  `Event`/`Event.prototype` and gets rejected.
- **This is a confirmed upstream React Native bug, not something in this
  repo's control to fix at the source**: github.com/facebook/react-native/issues/54732,
  filed against 0.81, reproduces identically on the 0.86.3 installed here,
  and was **closed "not planned" by the React Native team** — the fix has to
  live on the consumer side.
- **Fixed via pnpm's native patch feature** (not `patch-package` — no reason
  to add an extra dependency + postinstall script when pnpm already has this
  built in): `patches/react-native@0.86.3.patch`, registered in root
  `package.json`'s `pnpm.patchedDependencies`, adds `configurable: true,
  writable: true` to all 8 `Object.defineProperty` calls in `Event.js`.
  Applies automatically on every `pnpm install` — confirmed by reinstalling
  and grepping the patched file back out of `node_modules/.pnpm`.
- **A second, deeper instance of the whole session's recurring dependency-drift
  class of bug, found while re-verifying after the patch**: `pnpm install`
  (needed to apply the patch) shifted peer resolution again and broke
  `packages/identity/src/mobile-provider.tsx`'s `<PrivyProvider>` the same
  way `provider.tsx`'s `<WagmiProvider>` broke earlier (§7) — except one
  layer deeper. It's not just that `apps/mobile`'s compilation could pull in
  a second `@types/react` instance from *Privy's* dependency chain; it's that
  a bare `import ... from "react"` written inside `mobile-provider.tsx`
  itself resolves against **`packages/identity`'s own** `node_modules/react`
  (pinned to an older version for `provider.tsx`'s unrelated web/wagmi
  needs) — not whichever app is actually compiling the file. Re-pinning
  exact versions was already shown unstable earlier in this file (§7); fixed
  structurally instead, the same direction as `SafeWagmiProvider` but taken
  further: `mobile-provider.tsx` no longer imports anything from `"react"`
  at all. Its `SafePrivyProvider` wrapper hand-rolls the prop shape it needs
  and returns the ambient global `JSX.Element` (the one type guaranteed to
  be singular across the whole compiled program — two incompatible global
  `JSX` namespaces would fail to merge outright), instead of asking
  TypeScript to reconcile two different `@types/react` copies' `ReactNode`.

## 8.2 react-native-web wired into apps/web — first real Next.js build

The user asked to close out remaining gaps, including apps/web's ARCADE
screens. `@gami/ui`'s components (`ArcadeScreen`, `ArcadeButton`, etc.) are
built on raw react-native primitives (`View`/`Text`/`Pressable`/`TextInput`)
— `apps/web/package.json` already listed `@gami/ui` as a dependency, but
nothing wired `react-native-web` into Next.js, so none of it could render on
web. Confirmed with the user before choosing: wire `react-native-web` in
(one shared UI kit) rather than build a second, parallel plain-CSS ARCADE kit
for web. Fixed in `apps/web/next.config.mjs`, verified via a real
`npx next build` (not just typecheck) — three real, sequential build
failures, each fixed and re-verified before moving to the next:

- **Same `.js`→`.ts` resolution gap as Metro, but in webpack.** This repo's
  `.js`-extension-on-relative-imports-resolving-to-`.ts`-files convention
  (§8's Metro fix) hits webpack too — `packages/identity/src/web.ts`'s
  `export * from "./base-account-adapter.js"` failed with "Module not
  found." Fixed with webpack 5's built-in `resolve.extensionAlias: {'.js':
  ['.js', '.ts', '.tsx']}` — the bundler-native equivalent of Metro's custom
  `resolveRequest`, no custom resolver function needed here.
- **`@base-org/account`'s payment/charge feature — which this app never
  uses, `base-account-config.ts` only uses its wagmi wallet connector —
  unconditionally imports `@coinbase/cdp-sdk`, which imports several
  `@x402/*` payment-protocol packages that aren't installed.** Genuinely
  dead code for us at runtime; ignored via `webpack.IgnorePlugin({
  resourceRegExp: /^@x402\// })` rather than installing an x402 payments
  stack this app has no use for.
- **`@privy-io/react-auth`'s bundle contains a real `import` of
  `@farcaster/mini-app-solana`** (its optional Farcaster-mini-app/Solana
  login path) — reachable from `web-provider.tsx`. This directly contradicts
  what §8's own farcaster-gate investigation concluded: that package being
  merely an *optional peerDependency declaration*, never actually installed,
  was assumed to mean nothing tries to import it. Wrong — the lockfile check
  only proves it isn't *installed*, not that nothing *imports* it, and
  webpack resolves static imports eagerly regardless. Since this app never
  uses that login path and §14 explicitly bans Farcaster code in apps/web,
  ignored it the same way as `@x402/*` (`webpack.IgnorePlugin({
  resourceRegExp: /^@farcaster\// })`) — installing the forbidden package to
  satisfy the resolver would have been exactly backwards. Confirmed this
  doesn't regress `pnpm run gate:no-farcaster-deps` (still checks the
  lockfile, which still resolves zero `@farcaster/*` packages).
- **`GamiWalletProvider`'s deliberate "no RPC URL configured" throw (§2.1:
  never fall back to an unauthenticated public RPC) fired during Next's
  build-time static prerendering** of `/` and `/_not-found`, since
  `NEXT_PUBLIC_BASE_RPC_URL` is still blank in `.env`. Not a bug to route
  around — wallet/auth state is inherently per-visitor and can never be
  meaningfully prerendered anyway, so `export const dynamic =
  "force-dynamic"` in `apps/web/src/app/layout.tsx` is the correct
  permanent fix (the check now fires per-request, at runtime, where it
  belongs), not a workaround to get a green build.

`npx next build` now succeeds end-to-end with `/` correctly marked dynamic
(`ƒ`). Real ARCADE screens on top of this (porting `apps/mobile`'s existing
15 screens) are being built next — see the following dated entry once that
lands.

## 8.3 Loading/empty/error/offline states for `home` and `quests` (2026-09-05)

Closes gap item 6 below, for `home` and `quests` specifically (not `scan`,
which also has a design-defined error variant — not attempted here, out of
scope for this pass).

Re-fetched `GamiScreen.dc.html` (the same design source §1/§4 were built
from) via the `DesignSync` tool to find the actual `homeLoading`/`homeReady`/
`homeEmpty`/`questsError`/`questsOk`/`offline` conditional blocks (search the
file for those literal flag names — they're computed from a `variant` prop
in the file's own script section: `'ready'|'loading'|'empty'|'error'|'offline'`).

- **New shared components in `packages/ui`**: `ArcadeSkeleton` (a flat,
  zero-radius placeholder block pulsing via RN's `Animated` API — the
  design's CSS `gami-skel` keyframe has no direct RN equivalent, and a
  shimmer/gradient sweep would violate §2.2's no-soft-effects rule) and
  `OfflineBanner` (the app-wide "OFFLINE — SHOWING LAST KNOWN STATE" banner).
  Both exported from `packages/ui/src/index.ts`.
- **`apps/mobile/app/(tabs)/home.tsx`**: real `loading` state (a `setTimeout`-driven
  delay before showing content — the same "honest stub" pattern already
  established in `onboarding/creating.tsx`, since there's no backend to
  actually await yet) renders the skeleton layout; `empty` is **genuinely
  data-driven**, not a hardcoded dead branch — it renders when
  `mockQuests.filter(q => q.state === "in_progress")` is empty, which just
  never happens today because `mockData.ts` always has one in-progress
  quest. `offline` renders `<OfflineBanner/>` when a local `offline` flag is
  true — that flag is presentational only, starts `false`, and nothing
  flips it yet; real connectivity detection (e.g. via `NetInfo`) is
  explicitly out of scope for this pass (still listed below).
- **`apps/mobile/app/(tabs)/quests.tsx`**: `error` state (design's
  `questsError`, "Couldn't load quests" + RETRY) is real, working, wired
  code — `error` is local state, RETRY calls `setError(false)` — but is not
  currently *reachable* in the running app, since there's no real fetch to
  fail yet. The branch renders correctly (verified by temporarily forcing it
  during development) and is ready for a real `packages/api` call to flip it
  once the backend (gap item 5) exists.
- Verified for real, not just typechecked: `pnpm --filter @gami/ui --filter
  @gami/mobile typecheck` and `npx eslint apps/mobile packages/ui` both
  clean, and `cd apps/mobile && npx expo export --platform ios --clear`
  still produces a working 9.4MB bundle with these changes included.

## 8.4 Second real runtime crash: `process.browser` missing under Hermes

The user ran the actual app again (not just `expo export`) and hit a new
crash: `Cannot read property 'slice' of undefined`, reported at
`packages/identity/src/privy-expo-adapter.ts:29` — but that's just where
Metro's error overlay attributes the top of the require chain; the real
throw, per the full call stack, is in `readable-stream@2.3.8`'s
`lib/_stream_writable.js:57` (a transitive dependency of `crypto-browserify`,
itself `expo-crypto-polyfills`' mapping for Node's `crypto` — see §8's
Node-polyfill section):

```js
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1
```

`process.browser` is the standard browserify convention this whole
dependency chain expects (a flag meaning "skip Node-version-specific paths,
we're not really in Node") — React Native's own minimal `process` shim under
Hermes sets neither `.browser` nor `.version`, so the `!process.browser &&`
short-circuit doesn't fire and `.slice()` throws on `undefined`. Confirmed
the exact mechanism in isolation with a plain Node repro (mimicking Hermes'
bare `{}` process object) before touching anything — reproduces the identical
error message without the fix, resolves cleanly with `process.browser = true`
set first.

Fixed in `apps/mobile/index.js`: `process.browser = true` set as the very
first statement (a plain statement, not an import, so it executes before
anything else — `expo-router/entry`, imported on the next line, is what
transitively pulls in this whole chain).

Verified: `cd apps/mobile && npx expo export --platform ios --clear` still
produces a working bundle (this is a runtime-behavior fix, not a resolution
change, so bundling was never the failure mode — could not verify the actual
crash is gone via a live simulator/device from this environment; the user
needs to confirm on their end).

## 8.5 apps/web's ARCADE screens — ported from apps/mobile, real `next build`

Closes gap item 8 below. Ports `apps/mobile`'s core app screens to real
Next.js App Router routes under `apps/web/src/app/(app)/**` (`home`,
`quests`, `quest/[id]`, `nova`, `profile`, `settings`, `send`, `receive`,
`scan`), reusing `@gami/ui` as-is via §8.2's `react-native-web` wiring — same
components, same ARCADE tokens, not a second parallel UI kit. All verified
against a real `npx next build` (13 routes, all correctly dynamic `ƒ`), not
just typecheck — three more real webpack failures surfaced and fixed this
way, the same dead-code-import pattern as §8.2's `@x402`/`@farcaster`
ignores: `wagmi/connectors`'s barrel re-exports every connector it ships
(including `metaMask`, which this app never uses — only `baseAccount` and
`injected`), and `@metamask/sdk`'s own browser build still references
`@react-native-async-storage/async-storage`, unresolvable in a Next.js web
app. Ignored via the same `webpack.IgnorePlugin` pattern rather than
installing an RN-only storage package for a connector nobody uses.

Two deliberate, honest simplifications — not hidden gaps:

- **`src/app/page.tsx` (sign-in) is NOT a port of mobile's
  welcome/start/otp/creating/handle onboarding stack.** Mobile's auth is
  email-OTP + Google/Apple OAuth + passkey (Privy needs a login identity to
  provision its embedded wallet). Web's auth is fundamentally different, not
  just a different adapter: wallet-connect + Sign-In-With-Ethereum, one
  action, no embedded wallet to provision, so there's no multi-step
  onboarding to port. Collapsed into one ARCADE-styled screen with a single
  CONNECT WALLET / SIGN IN WITH ETHEREUM button.
- **`src/app/(app)/scan/page.tsx` has no camera.** Mobile's scan screen uses
  `expo-camera`; a browser `getUserMedia` QR reader is a real feature in its
  own right and was correctly left out rather than faked. The replacement is
  a manual quest-code text entry that still demonstrates the same
  idempotency guarantee mobile's scan screen does (computes
  `questIdempotencyKey`, a second "verify" on an already-settled code
  returns the same grant instead of a new one — clearly labeled
  `TODO(backend)` where a real `claimQuest()` call belongs once gap item 5
  exists).

Navigation: `src/app/(app)/layout.tsx` + a new `ArcadeWebNav` component
(`src/components/ArcadeWebNav.tsx`) replace mobile's bottom tab bar with a
top nav — there's no native tab-bar or navigation-stack metaphor on a
desktop-capable web layout, so nested screens (quest detail, send, receive,
scan, settings) render under the same shared nav rather than as mobile's
modal-style stack pushes.

## 8.6 Testing in Expo Go, not a dev client — and a third crypto-polyfill crash

The user tried the app again and hit `[TypeError: Cannot read property 'slice' of undefined]` still, then after that a different one, `[TypeError: Cannot read property 'isKeyObject' of undefined]` — both surfacing as every single route "missing the required default export" (a symptom, not the cause: the root `_layout.tsx`'s module evaluation throws while loading `@gami/identity/mobile` → `@privy-io/expo` → jose/crypto-browserify, which aborts before `_layout.tsx`'s own `export default` runs, and expo-router reports every route as broken because none of them ever get a working root layout to mount under).

**Important, easy to miss in the logs**: `The expo-dev-client package is installed, but a development build is not installed on iPhone 17. Launching in Expo Go.` The user has been testing in **Expo Go**, the generic pre-built app from the App Store — not a custom dev client. This was already documented before today (`apps/mobile/package.json`'s own note: "Privy native extensions require [a dev client], Expo Go won't work"). Expo Go ships a fixed set of Expo SDK native modules and cannot run `@privy-io/expo-native-extensions`, `react-native-mmkv`, or `react-native-passkeys` — all real native modules this app now depends on. **No amount of JS-level polyfill fixing will make this app run correctly in Expo Go.** The user needs `npx expo prebuild -c` (gap item 9, still open) followed by `npx expo run:ios` / `run:android` to build and install a real dev client, then test in that.

That said, the specific crash reported is a real, separate bug worth fixing regardless of which client runs it, since the underlying JS crypto-polyfill code executes the same way either way:

- `jose`'s node build (`jose/dist/node/esm/runtime/is_key_object.js`) does `import * as util from 'util'` then reads `util.types.isKeyObject` unconditionally as part of a ternary condition — `expo-crypto-polyfills` provides no `util` polyfill at all, so Metro resolved "util" to some other transitive package whose shape doesn't include a `.types` object, and `undefined.isKeyObject` threw before jose's own graceful fallback (`instanceof KeyObject`) ever got a chance to run.
- Installed the real `util` npm polyfill and wired it into `metro.config.js`'s `extraNodeModules` with the same "trailing slash" trick as `url` (§8.4/§8) — `util` is also a Node core-module name that Node's own `require.resolve` always shadows with the built-in, ahead of any installed npm package of the same name. Confirmed in Node directly: the installed polyfill's `util.types` is a real object (without `isKeyObject`, which is fine — jose's fallback only needs `.types` itself to not be `undefined`).
- Proactively grepped crypto-browserify's whole dependency tree (`readable-stream`, `hash-base`, `ripemd160`, `create-hash`, `create-hmac`, `browserify-sign`, `browserify-cipher`, `diffie-hellman`, `public-encrypt`, `randombytes`, `randomfill`, `pbkdf2`, `elliptic`) for the same `process.version`/`process.browser`/`util.types` patterns, rather than waiting for the user to hit each one individually on a device. Found that `pbkdf2` and `randomfill` both already check `process.browser` first (the same convention `readable-stream@2.3.8` used) — §8.4's `process.browser = true` fix defensively covers them too. Also discovered `readable-stream` resolves to **two different versions** in this tree (2.3.8, used by `create-hash`/`create-hmac`; 3.6.2, used elsewhere) — v3 has none of v2's `process.version` assumptions, so this is a latent duplicate-dependency situation (same class of issue as this whole file's earlier dependency-drift sections) that happens not to be actively harmful right now, not something fixed here.

Verified: `cd apps/mobile && npx expo export --platform ios --clear` still bundles clean. Could not verify the actual crash is gone from this environment (no simulator/device access) — the user still needs to confirm, ideally from a real dev client rather than Expo Go so a genuine "app works" signal isn't confounded with "Expo Go can never work here regardless."

## 9. Known real gaps to close next

1. Rotate the Privy app secret — **twice compromised now** (see §5 above).
   Once rotated, put the new value directly into `apps/web/.env` without
   pasting it into chat.
2. ~~Resolve the passkey-login gap with Privy~~ — **DONE (§7, 2026-09-04)**:
   `@privy-io/expo/passkey` exports a real `useLoginWithPasskey`; the earlier
   "unsatisfiable" note only checked the main package entry. Still needs the
   apple-app-site-association/assetlinks.json files hosted with the real
   Team ID / signing-cert fingerprint before it works on a device — that
   part needs account access.
3. ~~Wire `mintPrivySessionFromSiwe` to `@privy-io/server-auth`~~ —
   **OBSOLETE, not just done (§7, 2026-09-04)**: that API doesn't exist.
   Replaced with Privy's real client-side `useLoginWithSiwe` flow; the
   function and both custom API routes are deleted.
4. ~~Wire `tx-queue.ts`'s `QueueStorage` to MMKV (mobile) / IndexedDB (web)~~
   — **DONE (2026-09-05)**: `apps/mobile/src/storage/mmkvTxQueueStorage.ts`
   (react-native-mmkv, one entry per tx + an id index, bigint-safe
   JSON serialization) and `apps/web/src/storage/indexedDbTxQueueStorage.ts`
   (hand-rolled against the native IndexedDB API, lazily opened so it's safe
   under Next's SSR). Neither is actually instantiated/wired into a screen
   yet (`send.tsx` doesn't reference `TxQueue`) — the adapters satisfy the
   `QueueStorage` contract and typecheck/lint/bundle clean, but nothing
   calls `new TxQueue(storage, client)` anywhere yet.
5. Stand up a real Gami backend — **partially done (2026-09-05)**: a dev-stub
   quest-claim endpoint now exists
   (`apps/web/src/app/api/quests/[questId]/claim/route.ts`, in-memory
   Idempotency-Key dedup, matches `GamiApiClient.claimQuest()`'s contract
   exactly — NOT production: resets on restart, not shared across
   instances/replicas, does not verify the bearer token against Privy's
   JWKS). `mockData.ts`'s quest/XP fixtures, the handle-registration call,
   and the two stubbed "creating" screen steps still have nothing real to
   call — this closes only the quest-claim slice of this gap.
6. ~~Build the loading/empty/error/offline variant of at least `home` and
   `quests`~~ — **DONE for home/quests (§8.3, 2026-09-05)**: home has
   loading/empty/offline, quests has error. Still open: `scan`'s
   design-defined error (camera-permission-denied) variant, and every other
   screen's states beyond home/quests — those still only render "ready".
   Also still open: real connectivity detection to actually drive the
   offline banner (currently a presentational-only flag that starts false).
7. Peer-dependency warnings from `pnpm install` are non-fatal but real —
   updated as of the SDK 57 jump (§8, 2026-09-05): `react-native-reanimated@4.6.0`
   wants `react-native-worklets@0.12.x`, `expo install` picked `0.10.1`;
   `@react-native/community-cli-plugin` wants `@react-native/metro-config@0.86.3`,
   found `0.87.1`; `@privy-io/expo` wants `react-native-passkeys@^0.3.0`/
   `@privy-io/expo-native-extensions@0.0.4`, found `0.4.2`/`0.0.9`. None of
   these broke the real `expo export` bundle (§8), but worth resolving before
   shipping.
8. ~~Build `apps/web`'s ARCADE screens~~ — **DONE (§8.5, 2026-09-05)**: all
   core app screens ported (home, quests, quest detail, nova, profile,
   settings, send, receive, scan), reusing `@gami/ui` via `react-native-web`.
   Sign-in is a deliberate one-action simplification (wallet-connect + SIWE,
   not a port of mobile's 5-screen onboarding stack) and `scan` has no
   camera (manual code entry instead) — both documented in §8.5 as
   intentional, not oversights. Real `next build` verified (13 routes).
9. Run the app on a real device/simulator, not just `expo export` (§8,
   2026-09-05) — needs `npx expo prebuild -c` (native projects were deleted
   from the repo root per §8, never generated in `apps/mobile`) followed by
   `npx expo run:ios` / `run:android`. `expo export` only proves the JS
   bundle resolves and compiles, not that native modules actually link or
   that the app boots.
10. Only after 1–9: P6 (XP/quest/NOVA wiring against a real backend), then
    P7 (the account-gated release checklist in §13).
