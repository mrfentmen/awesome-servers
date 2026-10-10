# omdb-mcp

Query the OMDb API (free key from omdbapi.com/apikey.aspx, 1,000/day; set OMDB_API_KEY): movie/series search and full details with ratings.

## Tools

- `search_movies` — Title search (needs OMDB_API_KEY).
- `get_movie` — Full details by IMDb ID or exact title.

## Source

[omdb-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/omdb-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `wikidata_facts`
* `cinemeta_details`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-omdb-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
