# faceit-mcp

FACEIT API: player search and profiles, per-game stats, match history, teams, championships.

## Setup

```bash
export FACEIT_API_KEY=YOUR_KEY
```

## Tools

- `search_players` — Search FACEIT players by nickname.
- `get_player` — FACEIT player profile: id, country, games, skill levels, bans, memberships.
- `get_player_stats` — Lifetime FACEIT stats for a player in one game: matches, wins, K/D, headshots.
- `get_player_history` — Recent FACEIT matches for a player with scores and maps.
- `search_teams` — Search FACEIT teams by name.
- `get_championships` — FACEIT championships for a game: prize pools, slots, regions, status.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
