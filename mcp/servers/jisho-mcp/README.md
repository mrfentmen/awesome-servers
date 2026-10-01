# jisho mcp

The [Jisho.org](https://jisho.org) Japanese English dictionary. Words,
readings, senses, JLPT levels. No key.

## Tools

- `search_words`, Japanese text, romaji, or English keywords
- `search_by_tag`, feature searches: `#common`, `jlpt-n1`…`jlpt-n5`,
`wanikani10`, English meanings

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "What does 大丈夫 mean?"
> `search_words("daijoubu")` → 大丈夫 (だいじょうぶ), safe; sound; problem free [Na adj] ⭐common, JLPT N5

> "Give me common JLPT N5 words"
> `search_by_tag("jlpt-n5")`

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_words`: Search the Jisho Japanese-English dictionary. Accepts Japanese text,
- `search_by_tag`: Search Jisho by feature or tag:

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_words`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `all_senses`
* `words_by_reading`
* `word_network`
* `kanji_profile`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
