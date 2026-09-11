// `process.browser` MUST be set before anything else runs, as a plain
// statement (not an import) so it executes first — expo-router/entry
// transitively pulls in @privy-io/expo -> jose -> crypto-browserify, and
// crypto-browserify's own dependency chain (readable-stream@2.3.8, a
// browserify-era Node polyfill) does `process.version.slice(0, 5)` at
// module-load time, gated behind `!process.browser && ...`. React Native's
// minimal `process` shim (Hermes) sets neither `.browser` nor `.version`, so
// without this that `&&` doesn't short-circuit and .slice() throws on
// undefined — "Uncaught Error: Cannot read property 'slice' of undefined"
// at what looks like packages/identity/src/privy-expo-adapter.ts but is
// really this polyfill's own module-eval, several requires deep. Setting
// `process.browser = true` here is the standard browserify convention this
// package's whole codebase expects, and makes it skip the Node-version
// check entirely instead of evaluating it against a shim that doesn't have
// the fields it wants.
if (typeof process !== 'undefined') {
  process.browser = true;
}

// Polyfills MUST be the first three lines after the above, before any other
// import (§4.1). Order matters: text-encoding and crypto RNG shims must
// exist before ethers/viem code (pulled in transitively by @privy-io/expo)
// runs.
import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import 'expo-router/entry';
