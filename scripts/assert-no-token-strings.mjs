#!/usr/bin/env node
// §10 build-time gate: when FLAGS.GAMI_TOKEN_MODULE === false, no string
// matching /\$GAMI|GAMI token|token price|tokenomics/i may survive in a
// production bundle. Run this against the built output (apps/*/dist or
// apps/web/.next) before shipping. Failure MUST abort the build.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN = /\$GAMI|GAMI token|token price|tokenomics/i;
const SCAN_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".html", ".json"]);

const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/assert-no-token-strings.mjs <build-output-dir>");
  process.exit(2);
}

function walk(dir) {
  const hits = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git") continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      hits.push(...walk(full));
      continue;
    }
    const ext = entry.slice(entry.lastIndexOf("."));
    if (!SCAN_EXTENSIONS.has(ext)) continue;
    const content = readFileSync(full, "utf8");
    const match = content.match(FORBIDDEN);
    if (match) hits.push({ file: full, match: match[0] });
  }
  return hits;
}

import { FLAGS } from "../packages/core/src/flags/index.ts";

if (FLAGS.GAMI_TOKEN_MODULE) {
  console.log("GAMI_TOKEN_MODULE is true — skipping bundle scan (legal clearance flag is on).");
  process.exit(0);
}

const hits = walk(target);
if (hits.length > 0) {
  console.error(`❌ Found ${hits.length} forbidden $GAMI/tokenomics string(s) with GAMI_TOKEN_MODULE=false:`);
  for (const hit of hits) console.error(`  ${hit.file}: "${hit.match}"`);
  process.exit(1);
}

console.log(`✅ No $GAMI/tokenomics strings found in ${target} (GAMI_TOKEN_MODULE=false).`);
