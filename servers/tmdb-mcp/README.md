# TMDB MCP

Search movies, TV shows, and trending titles through The Movie Database. Requires a free TMDB key set as TMDB_API_KEY.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_movie`  Search movies by title.
* `search_tv`  Search TV shows by title.
* `trending`  Trending movies and TV shows this week.

* `search_person`
* `movie_details`
* `tv_details`
* `person_details`
* `movie_credits`
* `discover_movies`
* `discover_tv`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Set the TMDB_API_KEY environment variable to your free key from the TMDB website. Without a key the server returns a clear error.
