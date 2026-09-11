// pnpm workspace support. Without this, Metro's default hierarchical
// node_modules lookup gets confused by pnpm's symlinked store layout and can
// fail to resolve the real entry point — including falling back to Expo's
// generic `expo/AppEntry.js` (which imports a top-level `../../App` that
// doesn't exist in this project) instead of this app's own `index.js`. If
// you hit "Unable to resolve '../../App' from '.../expo/AppEntry.js'", this
// file is what fixes it — run `npx expo start -c` afterward to clear the
// stale Metro cache.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// pnpm stores packages under node_modules/.pnpm and symlinks them in — tell
// Metro to follow those symlinks so a dependency resolved into
// apps/mobile/node_modules (or the workspace root's) still finds ITS OWN
// nested dependencies inside its real .pnpm store location.
//
// disableHierarchicalLookup was also set here originally, but that turned
// out to be the wrong fix for the AppEntry.js fallback problem this file's
// header describes — it stops Metro from resolving a package's own nested
// deps via its per-package node_modules (pnpm's whole isolation model),
// which surfaced as "Unable to resolve module fast-base64-decode from
// .../react-native-get-random-values/index.js" even though the symlink was
// genuinely present and correct. unstable_enableSymlinks + the explicit
// nodeModulesPaths below are what actually fix the AppEntry.js fallback;
// disableHierarchicalLookup was unnecessary and actively broke this case.
config.resolver.unstable_enableSymlinks = true;

// @privy-io/expo's dependency chain (@privy-io/js-sdk-core -> jose) imports
// Node's built-in `crypto` module, which doesn't exist in Hermes/React
// Native — this is a documented Privy+Expo setup requirement, not something
// specific to this repo (docs.privy.io's Expo installation guide + jose's
// own package.json exports having no "react-native" condition, only
// browser/node/bun/deno). expo-crypto-polyfills is the standard fix.
config.resolver.extraNodeModules = {
  ...require("expo-crypto-polyfills"),
  // Not included in expo-crypto-polyfills' map — jose's JWE compression
  // support imports Node's zlib directly (see jose/dist/node/esm/runtime/zlib.js).
  // A real polyfill (browserify-zlib) pulls in assert/buffer/util Node-core
  // shims transitively for a code path Privy's SDK never actually exercises
  // (JWE decompression) — stubbed instead, see polyfills/zlib-stub.js.
  zlib: path.resolve(projectRoot, "polyfills/zlib-stub.js"),
  // expo-crypto-polyfills' own `url` entry is a no-op here: it does
  // `require.resolve("url")`, but Node always resolves a bare "url" specifier
  // to its OWN built-in core module (not a real file), core-module names take
  // priority over any installed npm package of the same name. The npm `url`
  // package's own docs document the fix: request "url/" (trailing slash) to
  // skip Node's core-module shortcut and resolve the actual installed
  // polyfill package instead.
  url: require.resolve("url/"),
  // Not included in expo-crypto-polyfills' map either. jose's node build
  // does `import * as util from 'util'` and then reads `util.types.isKeyObject`
  // (jose/dist/node/esm/runtime/is_key_object.js) — with no polyfill wired,
  // Metro resolved "util" to some other transitive package lacking a
  // `.types` object at all, so the property read itself threw ("Cannot read
  // property 'isKeyObject' of undefined" — actually `.types` being
  // undefined, one level up from what the message implies). The real `util`
  // npm polyfill (installed) provides a `.types` object (without
  // `isKeyObject`, which is fine — jose's own code already falls back to an
  // `instanceof KeyObject` check when `.isKeyObject` is falsy; it only needs
  // `.types` itself to not be undefined). Same core-module-name shadowing as
  // `url` above, same "trailing slash" fix.
  util: require.resolve("util/"),
};

// This repo's TS source uses explicit `.js` extensions on relative imports
// (e.g. packages/core/src/index.ts: `export * from "./wallet/types.js"`,
// where the file on disk is wallet/types.ts) — valid under `tsc`'s
// NodeNext-style resolution, but Metro's bundler resolver has no built-in
// ".js" -> ".ts"/".tsx" fallback and fails with "Unable to resolve module
// ./wallet/types.js" for every such import. Since this convention is used
// throughout packages/core, packages/identity, packages/ui, etc., this broke
// nearly every cross-package import the moment a real bundle was attempted
// (this was never exercised before — see MIGRATION_NOTES.md). Intercept only
// relative ".js" specifiers and try the TS source extensions first, falling
// back to Metro's default resolution (which still needs to handle real .js
// files, e.g. actual JS files in node_modules).
const { resolveRequest: defaultResolveRequest } = config.resolver;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (/^\.\.?\//.test(moduleName) && moduleName.endsWith(".js")) {
    const withoutExt = moduleName.slice(0, -".js".length);
    for (const ext of [".ts", ".tsx"]) {
      try {
        return context.resolveRequest(context, withoutExt + ext, platform);
      } catch {
        // try the next extension / fall through to default resolution
      }
    }
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
