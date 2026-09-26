# cartesia-mcp

Query the Cartesia API (free tier key; set CARTESIA_API_KEY, Bearer): voice list, localized voices, and speech synthesis (paid usage — synthesizing spends credits).

## Tools

- `list_voices` — Voices available on the account, with language.
- `get_voice` — One voice by id, with its embedding and settings.
- `synthesize_speech` — Render text to MP3 with a voice — this spends credits.

## Source

[cartesia-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/cartesia-mcp)
