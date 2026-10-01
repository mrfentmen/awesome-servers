# walkthrough mcp

Retro game walkthroughs, FAQs, and cheats from
[StrategyWiki](https://strategywiki.org)'s open MediaWiki API.

> Originally built against GameFAQs, GameFAQs (Fandom) blocks all
> non browser clients with a Cloudflare bot wall and has no Wayback
> snapshots, so the server sources the same kind of content from
> StrategyWiki, which has a real, open API.

## Tools

- `search_games`, find games/guides by title
- `get_game_pages`, list a game's subpages (Walkthrough, Cheats, dungeon guides...)
- `get_guide`, full page text (walkthroughs are big; truncate via `maxChars`)

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "How do I beat the Water Temple?"
> `search_games("Ocarina of Time")` → `get_guide("The Legend of Zelda: Ocarina of Time/Water Temple")`

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_games`: Search StrategyWiki for games and guides by title. Returns page
- `get_game_pages`: List the subpages of a game page - typically a Walkthrough, plus
- `get_guide`: Fetch the full text of a walkthrough, FAQ, or cheat guide page.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_games`.
