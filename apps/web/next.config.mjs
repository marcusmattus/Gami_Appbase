/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@gami/core", "@gami/chain", "@gami/identity", "@gami/ui", "@gami/api"],
  // @gami/ui's components are written against raw react-native primitives
  // (View, Text, Pressable, ...) — react-native-web is what lets those
  // render on web. `.web.js`/`.web.ts`/`.web.tsx` before the bare extensions
  // isn't currently used (no platform-split files in @gami/ui yet) but is
  // the standard react-native-web setup and costs nothing to have ready.
  webpack: (config, { webpack }) => {
    // @base-org/account's payment/charge feature (which this app never
    // uses — packages/identity/src/base-account-config.ts only uses the
    // wagmi `baseAccount()` connector for wallet connection) unconditionally
    // pulls in @coinbase/cdp-sdk, which imports optional @x402/* payment
    // protocol packages that aren't installed. That whole branch is dead
    // code for us at runtime, so ignore it outright rather than installing
    // an x402 payments stack we don't need.
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^@x402\// }));
    // @privy-io/react-auth's bundle contains a real `import` of
    // @farcaster/mini-app-solana (its optional Farcaster-mini-app/Solana
    // login path) — this is an actual static import reachable from
    // web-provider.tsx, not just inert peerDependency metadata (that
    // assumption, made when checking pnpm-lock.yaml against the
    // gate:no-farcaster-deps script, turned out to be wrong: the lockfile
    // check only proves the package isn't INSTALLED, not that nothing tries
    // to import it). This app never uses that login path (§14 explicitly
    // bans Farcaster in apps/web) — ignoring the import is the right fix,
    // not installing the forbidden package. Confirmed this doesn't regress
    // `pnpm run gate:no-farcaster-deps` (still checks the lockfile, which
    // still has no @farcaster/* package resolved).
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^@farcaster\// }));
    // wagmi/connectors' barrel (`wagmi/connectors`, used by
    // base-account-config.ts for the `baseAccount`/`injected` connectors we
    // actually use) re-exports EVERY connector it ships, including
    // `metaMask` — which this app never uses. @metamask/sdk's own "browser"
    // build still references @react-native-async-storage/async-storage
    // (a packaging quirk on their end), which isn't installed. Same dead-code
    // situation as @x402/@farcaster above: ignore rather than install an
    // RN-only storage package into a Next.js web app for a connector we
    // don't use.
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /^@react-native-async-storage\/async-storage$/ }),
    );
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-native$": "react-native-web",
    };
    config.resolve.extensions = [
      ".web.js",
      ".web.jsx",
      ".web.ts",
      ".web.tsx",
      ...config.resolve.extensions,
    ];
    // Same issue as apps/mobile/metro.config.js: this repo's TS source uses
    // explicit ".js" extensions on relative imports resolving to ".ts" files
    // on disk (NodeNext-style, valid for tsc, meaningless to a bundler by
    // default) — e.g. packages/identity/src/web.ts's
    // `export * from "./base-account-adapter.js"`. webpack 5's
    // extensionAlias is the equivalent fix to Metro's custom resolveRequest.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".js", ".ts", ".tsx"],
    };
    return config;
  },
};

export default nextConfig;
