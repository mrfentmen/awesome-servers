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
