#!/usr/bin/env node
import fs from "fs";

function parseEnv(text) {
  const map = new Map();
  const lines = text.split(/\r?\n/);
  const invalid = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || raw.trim().startsWith("#")) continue;
    const m = raw.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) { invalid.push({ line: i + 1, raw }); continue; }
    const k = m[1];
    const v = m[2];
    const prev = map.get(k);
    map.set(k, { value: v, line: i + 1, dupe: !!prev });
  }
  return { map, invalid };
}

function load(file) {
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(2);
  }
  return fs.readFileSync(file, "utf8");
}

function main() {
  const args = process.argv.slice(2);
  const file = args.includes("--file") ? args[args.indexOf("--file") + 1] : ".env";
  const example = args.includes("--example") ? args[args.indexOf("--example") + 1] : ".env.example";

  const env = parseEnv(load(file));
  const ex = fs.existsSync(example) ? parseEnv(load(example)) : { map: new Map(), invalid: [] };

  let errors = 0;

  for (const it of env.invalid) {
    console.error(`Invalid line ${it.line}: ${it.raw}`);
    errors++;
  }
  for (const [k, meta] of env.map) {
    if (meta.dupe) { console.error(`Duplicate key: ${k} (line ${meta.line})`); errors++; }
    if (meta.value === "" || meta.value === '""') {
      console.error(`Empty value: ${k} (line ${meta.line})`); errors++;
    }
    if (!/^[A-Z0-9_]+$/.test(k)) {
      console.error(`Invalid key name: ${k}`); errors++;
    }
  }
  const missing = [];
  const extra = [];
  for (const k of ex.map.keys()) {
    if (!env.map.has(k)) missing.push(k);
  }
  if (fs.existsSync(example)) {
    for (const k of env.map.keys()) {
      if (!ex.map.has(k)) extra.push(k);
    }
  }
  if (missing.length) { console.error(`Missing keys (vs ${example}): ${missing.join(", ")}`); errors++; }
  if (extra.length)   { console.error(`Extra keys (not in ${example}): ${extra.join(", ")}`); }

  if (errors) process.exit(1);
  console.log("env-guard: OK");
}

main();
