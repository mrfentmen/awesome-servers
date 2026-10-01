# fortnite-mcp

Keyless Fortnite API: battle royale news, item shop, map, AES keys, cosmetic search, playlists.

## Setup

No API key needed.

## Tools

- `get_br_news` — Current Fortnite battle royale news entries with images and tab titles.
- `get_br_shop` — Current Fortnite item shop entries: cosmetics, prices in V-Bucks, bundles.
- `get_map` — Current Fortnite island map images plus points of interest.
- `get_aes` — Current Fortnite AES encryption keys for datamining pak files.
- `search_cosmetic` — Search Fortnite cosmetics by name: skins, emotes, pickaxes, gliders with rarity and images.
- `get_playlists` — All Fortnite playlists/game modes with images and player counts.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `cosmetics_by_type`
* `cosmetic_detail`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
