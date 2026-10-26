# cartesia-mcp

Query the Cartesia API (free tier key; set CARTESIA_API_KEY, Bearer): voice list, localized voices, and speech synthesis (paid usage — synthesizing spends credits).

## Tools

- `list_voices` — Voices available on the account, with language.
- `get_voice` — One voice by id, with its embedding and settings.
- `synthesize_speech` — Render text to MP3 with a voice — this spends credits.

## Source

[cartesia-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/cartesia-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
