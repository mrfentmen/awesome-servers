# anime filler mcp

The question every weeb asks: **is this episode filler?**

Powered by [animefillerlist.com](https://www.animefillerlist.com) (scraped
politely, no official API exists).

## Tools

- `search_anime`, find an anime, get its slug
- `get_episode_lists`, full canon/filler breakdown with episode ranges
- `is_episode_filler`, verdict for one episode, with title + air date

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "Is Naruto Shippuden episode 57 filler?"
>
> `is_episode_filler("naruto-shippuden", 57)` →
> "Episode 57 of Naruto Shippuden is FILLER, skippable, safe to skip.
> Title: 'Robbed of Sleep' (aired 2008-05-08)"

> "Which One Piece episodes can I skip?"
> `get_episode_lists("one-piece")` → 1010 canon, 94 filler, with ranges.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_anime`: Search for an anime on animefillerlist.com and return its slug
- `get_episode_lists`: Get the full canon/filler episode breakdown for an anime by slug.
- `is_episode_filler`: Ask whether a specific episode is filler or canon. The question every weeb asks.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_anime`.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `filler_run_analysis`
* `filler_episode_list`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-anime-filler-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
