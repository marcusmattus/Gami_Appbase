// §2.4 locked build identity + §9.3 (dev-client required, Privy native
// extensions won't run under Expo Go).
import type { ExpoConfig } from "expo/config";

const CHAIN_ENV = process.env.EXPO_PUBLIC_CHAIN_ENV ?? "sepolia";

const config: ExpoConfig = {
  name: "Gami Wallet",
  slug: "gami-wallet",
  scheme: "gamiwallet",
  owner: "gami-protocols-organization",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  backgroundColor: "#0E0E12", // color.bg (§2.2)
  // Icon source: assets/icon.png — flat white hexagon-"G" mark on solid
  // color.primary (#6E3CFB), no gradient/bevel shading, composited from the
  // Claude Design project's brand mark per §2.2 (ARCADE forbids gradients on
  // the original 3D-shaded asset, so it was flattened — see MIGRATION_NOTES.md).
  icon: "./assets/icon.png",
  ios: {
    bundleIdentifier: "com.gamiprotocol.wallet",
    supportsTablet: false,
    infoPlist: {
      NSFaceIDUsageDescription:
        "Gami Wallet uses Face ID to protect access to your embedded wallet.",
      ITSAppUsesNonExemptEncryption: false,
    },
    associatedDomains: [
      "applinks:wallet.gamiprotocol.io",
      // Required for passkey login (useLoginWithPasskey's `relyingParty`,
      // see packages/identity/src/passkey-login-hooks.ts) — separate from
      // the applinks entry above. Only takes effect once a real
      // apple-app-site-association file with this app's actual Team ID is
      // hosted at https://wallet.gamiprotocol.io/.well-known/apple-app-site-association
      // (needs Apple Developer account access — see MIGRATION_NOTES.md).
      "webcredentials:wallet.gamiprotocol.io",
    ],
  },
  android: {
    package: "com.gamiprotocol.wallet",
    // edgeToEdgeEnabled removed from @expo/config-types under SDK 57 — edge-to-edge
    // is mandatory (not opt-in) for apps targeting Android SDK 35+, so there's no
    // longer a config flag for it.
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#6E3CFB", // color.primary
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: "wallet.gamiprotocol.io" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    // expo-screen-capture ships no config plugin (no app.plugin.js) — listing
    // it here makes Expo's CLI try to resolve one anyway, which crashes on
    // newer Node (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING pulling in
    // expo-modules-core's raw .ts source). The package still autolinks its
    // native module without a plugin entry.
    [
      "expo-apple-authentication",
    ],
    [
      "expo-build-properties",
      {
        ios: {
          // Required by @privy-io/expo/passkey / react-native-passkeys.
          // Expo SDK 57's expo-build-properties@57.0.17 enforces a 16.4 floor
          // (was 15.1 under SDK 54's expo-build-properties@1.0.10).
          deploymentTarget: "16.4",
        },
        android: {
          targetSdkVersion: 35,
          // compileSdkVersion must be >= targetSdkVersion; Privy's passkey
          // setup docs ask for 34, but this project already targets 35.
          compileSdkVersion: 35,
        },
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 160,
        resizeMode: "contain",
        backgroundColor: "#0E0E12", // color.bg
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "a34177f8-42ca-48d4-8c87-39f82476418e",
    },
    chainEnv: CHAIN_ENV,
  },
};

export default config;
