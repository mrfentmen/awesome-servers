# Jikan Anime MCP

Search anime and manga from MyAnimeList through the public Jikan API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_anime`  Search anime by title.
* `anime_info`  Details for an anime.
* `season_anime`  Anime in the current season.

* `search_manga`
* `manga_info`
* `top_anime`
* `top_manga`
* `anime_characters`
* `schedule_day`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Jikan limits requests to about 3 per second. The server reports honest errors when the limit is hit.
