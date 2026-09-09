// §4.1 Appendix A: the three transform plugins below are required for
// @privy-io/expo's dependency tree (class fields / private methods / Flow
// types in some transitive packages) — without them Metro fails to
// transpile those packages.
//
// `loose: true` on the first two is required, not cosmetic: babel-preset-expo
// already runs its own copy of @babel/plugin-transform-private-property-in-object
// internally with loose:true (to match Hermes' class-fields semantics). Babel
// asserts that transform-class-properties, transform-private-methods, and
// transform-private-property-in-object all share one `loose` setting when more
// than one of them is active — leaving these two at their default (loose:false)
// while the preset's internal one runs loose:true throws
// "'loose' mode configuration must be the same for ..." at bundle time.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ["@babel/plugin-transform-class-properties", { loose: true }],
      ["@babel/plugin-transform-private-methods", { loose: true }],
      "@babel/plugin-transform-flow-strip-types",
    ],
  };
};
