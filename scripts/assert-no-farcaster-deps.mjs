#!/usr/bin/env node
// §8 acceptance criterion: grep apps/web's dependency tree for `farcaster` /
// `minikit`. Zero matches in `dependencies` (or `devDependencies`).
import { readFileSync } from "node:fs";

const pkgPath = "apps/web/package.json";
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

const offenders = Object.keys(deps).filter((name) => /farcaster|minikit/i.test(name));
if (offenders.length > 0) {
  console.error(`❌ apps/web/package.json declares forbidden dependencies: ${offenders.join(", ")} (§8, §14).`);
  process.exit(1);
}

// Also check the resolved lockfile, not just direct deps, since a transitive
// @farcaster/* or minikit package is just as much a violation. `pnpm list
// --depth Infinity --json` was tried here first and OOM'd the process on
// apps/web's full Next.js tree — grepping the lockfile is cheap and exact,
// since every resolved package (direct or transitive) gets its own entry.
try {
  const lockfile = readFileSync("pnpm-lock.yaml", "utf8");
  // Top-level resolved package entries sit at exactly 2-space indent
  // ('@scope/name@1.2.3':). A farcaster/minikit match at deeper indentation
  // is a peerDependencies/peerDependenciesMeta declaration nested inside some
  // OTHER package's entry (e.g. @privy-io/react-auth optionally supporting
  // @farcaster/mini-app-solana) — inert metadata for an optional peer pnpm
  // never installs unless something actually needs it, not a resolved,
  // shippable package. Only the 2-space form is a real violation.
  const offendingLines = lockfile
    .split("\n")
    .filter((line) => /^ {2}\S/.test(line) && /(farcaster|minikit)/i.test(line));
  if (offendingLines.length > 0) {
    console.error("❌ pnpm-lock.yaml contains a farcaster/minikit package (§8, §14):");
    for (const line of offendingLines.slice(0, 10)) console.error(`  ${line.trim()}`);
    process.exit(1);
  }
} catch (error) {
  console.warn(`⚠️  Could not read pnpm-lock.yaml (${error.message}) — only direct deps were checked.`);
}

console.log("✅ apps/web dependency tree is clean of farcaster/minikit.");
