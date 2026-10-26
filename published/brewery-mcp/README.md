# brewery-mcp

Query Open Brewery DB (keyless): search US breweries by name/city/state/type, details, and random brewery.

## Tools

- `search_breweries` — Search breweries on one specific field. Returns names, types, addresses, websites and ids.
- `search_all_breweries` — Free-text search across every brewery field — name, city, state, country, postal code and website — for when you do not know which field the text is in.
- `find_breweries` — List breweries matching structured filters — city, state, country, type and postal code — optionally sorted by name, city, state or type. Use it for questions like 'micro breweries in Vermont'.
- `get_brewery` — Full details for one brewery by its id, including address, coordinates and contact info.
- `random_brewery` — A random brewery from the directory, useful for discovery and examples.
- `brewery_stats` — Directory totals from Open Brewery DB broken down by country, brewery type and state/region. Good for market sizing and picking valid filter values.
- `autocomplete_breweries` — Type-ahead suggestions for a partial brewery name, with the id needed by get_brewery and the address fields.
- `random_breweries` — A batch of random breweries in one call, useful for sampling the directory or building a shortlist.
- `breweries_by_ids` — Fetch up to 10 breweries by id in one call — the batch lookup for a list of ids collected from earlier results.

## Source

[brewery-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/brewery-mcp)


