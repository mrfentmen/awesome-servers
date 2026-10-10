# brainrot mcp

Decodes internet slang, brainrot vocabulary, and niche subculture terms.
**100% offline**, the lexicon ships with the server. Includes the classic
brainrot (skibidi, sigma, rizz, fanum tax, ohio, mogging...) plus the
underground rap scene (Nettspend, Xavier Wulf era, Osamason, KanKan,
LazerDim700, plugg, rage...) and the TikTok era.

## Tools

- `decode_term`, meaning, origin, example, vibe for one term
- `search_terms`, fuzzy search by term, meaning, or vibe
- `decode_text`, scan a caption/tweet and decode every known term in it
- `random_term`, expand your brainrot
- `lexicon_stats`, term count + vibe breakdown

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> Input: "bro that skibidi edit was bussin no cap, he rizzed up the whole room fr fr"
>
> Output: full breakdowns of skibidi, bussin, no cap, rizz, fr fr.

## Add terms

Open `src/lexicon.ts`, entries are plain objects (`term`, `meaning`,
`origin`, `example`, `vibe`). Rebuild and it's live.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `decode_term`: Look up a single slang / brainrot / niche internet term.
- `search_terms`: Fuzzy-search the lexicon by term, meaning, or vibe.
- `decode_text`: Scan a block of text and decode every known slang term in it.
- `random_term`: Return a random term from the lexicon - good for expanding your brainrot.
- `lexicon_stats`: Get stats about the lexicon: term count and vibe breakdown.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `decode_term`.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `related_terms`
* `similar_terms`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-brainrot-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
