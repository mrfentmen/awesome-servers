# omdb-mcp

Query the OMDb API (free key from omdbapi.com/apikey.aspx, 1,000/day; set OMDB_API_KEY): movie/series search and full details with ratings.

## Tools

- `search_movies` — Title search (needs OMDB_API_KEY).
- `get_movie` — Full details by IMDb ID or exact title.

## Source

[omdb-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/omdb-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `wikidata_facts`
* `cinemeta_details`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
