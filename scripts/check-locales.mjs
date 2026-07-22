#!/usr/bin/env node
/**
 * Verifies that ur/ar/hi locale JSON files contain every key present in en.json.
 * Exits with code 1 (and prints missing keys) if anything is missing.
 *
 * Run manually: `node scripts/check-locales.mjs`
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = resolve(__dirname, "../src/locales");
const targets = ["ur", "ar", "hi", "fa", "ru", "fr", "zh", "ja", "ko", "it", "bn"];

function load(name) {
  return JSON.parse(readFileSync(resolve(localesDir, `${name}.json`), "utf8"));
}

function flatten(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...flatten(v, key));
    else out.push(key);
  }
  return out;
}

const en = load("en");
const enKeys = new Set(flatten(en));

let failed = false;
for (const lng of targets) {
  const data = load(lng);
  const keys = new Set(flatten(data));
  const missing = [...enKeys].filter((k) => !keys.has(k));
  if (missing.length) {
    failed = true;
    console.error(`\n[locales] ${lng}.json is missing ${missing.length} key(s):`);
    for (const k of missing) console.error(`  - ${k}`);
  } else {
    console.log(`[locales] ${lng}.json OK (${keys.size} keys)`);
  }
}

if (failed) {
  console.error("\nLocale check failed. Add the missing keys and re-run.");
  process.exit(1);
}
console.log("\nAll locales in sync with en.json ✓");
