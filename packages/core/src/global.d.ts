// Minimal ambient runtime globals available on every target this package
// ships to (Node, browsers, Hermes/React Native) but not provided by
// `"lib": ["ES2022"]` alone, since packages/core deliberately excludes "dom"
// and Node's @types/node (§3 hard rule: no platform-specific types).
declare function setTimeout(handler: () => void, timeout?: number): number;
declare function clearTimeout(id: number): void;
