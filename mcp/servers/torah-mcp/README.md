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

These tools need a licence key:

* `book_index`
* `word_lookup`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
