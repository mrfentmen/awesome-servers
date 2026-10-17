# wpengine-mcp

WP Engine hosting API: installs, sites. Needs API credentials.

## Setup

```bash
export WPENGINE_USERNAME=...
```

Needs WPENGINE_USERNAME plus WPENGINE_PASSWORD (API password). Sent as HTTP Basic.

## Tools

- `list_installs` — All WP Engine installs with status, PHP version and domains.
- `get_install` — One WP Engine install with full details.
- `list_sites` — WP Engine sites with install links.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).


