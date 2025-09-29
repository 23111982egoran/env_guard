# env-guard
Simple `.env` linter: detects duplicates, empty values, invalid key names, and diffs against `.env.example`.

## Install & Use
```bash
npm i -g .
env-guard --file .env --example .env.example
```
Exits with code 1 on problems; prints “env-guard: OK” otherwise.
