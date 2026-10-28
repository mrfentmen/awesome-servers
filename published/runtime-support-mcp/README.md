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
