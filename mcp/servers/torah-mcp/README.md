# torah-mcp

Keyless MCP server for Torah study via Sefaria: weekly portion, Tanakh text in English and Hebrew, Rashi and other commentaries, verse connections, full-text search.

## Setup

No API key needed.

## Tools

- `get_weekly_portion` — This week's Torah portion (Parashat HaShavua), holidays, and candle-lighting times.
- `get_tanakh_text` — Tanakh passage in English and Hebrew by reference, e.g. `Genesis.1`, `Exodus 20`, `Psalms.23`.
- `get_commentaries` — Classical commentaries on a passage: Rashi, Ramban, Ibn Ezra and more.
- `get_connections` — Linked sources for a verse: commentaries, midrash, halakhah, and cross-references.
- `search_texts` — Full-text search across Sefaria's library of Jewish texts.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `book_index`
* `word_lookup`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-torah-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
