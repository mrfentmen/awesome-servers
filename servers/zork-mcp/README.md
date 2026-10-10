# zork mcp

A text adventure interpreter as an MCP server. **The AI is the player**,
it explores, solves puzzles, fights trolls, and collects treasure, turn by
turn, through tool calls.

## Games

- **colossal dungeon**, a Zork style dungeon: a grue in the dark, a
toll collecting troll, a locked grate, five treasures.
- **brainrot manor**, a meme palace. Collect the aura artifacts. Become
the main character.

## Tools

- `list_games`, available games
- `start_game(gameId)`, start/restart, returns your first room
- `act(command)`, `look`, `go north`, `take the lantern`, `use lantern`,
`attack troll with sword`, `inventory`...
- `hint`, a nudge for the current room
- `score`, treasures, moves, win status

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example session

1. `start_game("colossal-dungeon")`
2. `act("take the lantern")` → `act("use lantern")`
3. `act("go north")`, a troll blocks you...
4. `act("attack troll with sword")`
5. ...find all 4 treasures to win

## Add a game

Games are pure data, see `src/games.ts`. Rooms, items with `use`-effects,
hints, and treasures are all declarative; no engine changes needed.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_games`: List the text-adventure games available to play.
- `start_game`: Start (or restart) a text-adventure game. The AI is the player -
- `act`: Send a command to the current game: move, look, take, use, examine...
- `hint`: Get a hint for the current room.
- `score`: Show your current score, treasures collected, and move count.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `list_games`.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `game_routes`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-zork-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
