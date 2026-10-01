# riotgames-mcp

Riot Games API: LoL summoners, match history, champion mastery plus keyless Data Dragon versions.

## Setup

```bash
export RIOT_API_KEY=YOUR_KEY
```

Data Dragon endpoints need no key.

## Tools

- `get_account_by_riot_id` — Resolve a Riot ID (gameName + tagLine) to PUUID and region info. Works for LoL, Valorant, TFT.
- `get_lol_summoner` — Get a League of Legends summoner profile by PUUID: level, profile icon, revision date.
- `get_lol_match_ids` — List recent League of Legends match ids for a PUUID, newest first.
- `get_lol_match` — Full detail for one LoL match: teams, participants, builds, damage, objectives.
- `get_lol_champion_mastery` — Top champion-mastery entries for a summoner: champion ids, points, chest granted.
- `get_ddragon_versions` — Keyless: list all League of Legends Data Dragon patch versions, newest first.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
