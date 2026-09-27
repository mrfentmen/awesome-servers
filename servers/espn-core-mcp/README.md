# ESPN Core MCP

Sports data from the public ESPN core API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `teams`  List teams for a league.
* `athletes`  List athletes.

* `scoreboard`
* `team_roster`
* `league_news`
* `standings`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public ESPN core API.
