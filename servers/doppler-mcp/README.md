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

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
