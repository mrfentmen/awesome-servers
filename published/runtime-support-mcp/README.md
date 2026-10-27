# runtime-support-mcp

Runtime Support summarizes how many runtime families appear across local manifests, Docker files, and CI configuration. It helps identify mixed toolchains before a release.

## Quick start

```bash
npm install
npm test
npm start
```

Use `inspect_runtime_support` with a project inside `RUNTIME_SUPPORT_ROOT`.

## Limits

The output contains counts and runtime family signals only. Versions, dependency names, paths, source text, and environment values are suppressed.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
