# Sports Scores MCP

Live scores for NBA, NFL, and MLB games from the public ESPN scoreboard. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `nba_scores`  NBA scores and game states.
* `nfl_scores`  NFL scores and game states.
* `mlb_scores`  MLB scores and game states.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public ESPN scoreboard API and is only as fresh as that feed.


