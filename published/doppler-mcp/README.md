# doppler-mcp

Doppler API: projects, configs, secrets listing and download. Needs service or personal token.

## Setup

```bash
export DOPPLER_API_KEY=...
```

## Tools

- `list_projects` — Doppler projects with names and descriptions.
- `list_configs` — Doppler configs (environments) in a project.
- `list_secrets` — Secrets in a Doppler config with raw and computed values plus visibility.
- `download_secrets` — Doppler config secrets as JSON, env file, or dotenv for local use.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
