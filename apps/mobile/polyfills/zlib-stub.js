// Stub for Node's `zlib`, aliased in via metro.config.js's extraNodeModules.
//
// jose (a transitive dependency of @privy-io/js-sdk-core, itself a
// dependency of @privy-io/expo) imports zlib's inflateRaw/deflateRaw solely
// to support JWE's optional DEF compression header — a feature Privy's own
// SDK never actually uses in its auth/embedded-wallet flows. A real zlib
// polyfill (browserify-zlib) pulls in assert/buffer/util Node-core
// polyfills transitively for a code path that's never exercised at runtime;
// stubbing it out avoids that whole chain. If this ever actually gets
// called, that means some JWE payload really does need decompression and
// this stub needs to become a real implementation instead.
function unsupported(name) {
  return (...args) => {
    const callback = args[args.length - 1];
    const error = new Error(
      `zlib.${name} is not implemented in this React Native build — JWE compression is not used by @privy-io/expo's login flows.`,
    );
    if (typeof callback === "function") return callback(error);
    throw error;
  };
}

exports.inflateRaw = unsupported("inflateRaw");
exports.deflateRaw = unsupported("deflateRaw");
