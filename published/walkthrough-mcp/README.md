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
