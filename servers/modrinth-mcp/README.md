# modrinth mcp

Search [Modrinth](https://modrinth.com), the modern Minecraft mod host,
with full loader / game version filtering. No key.

## Tools

- `search_mods`, query + filters: loader (fabric/forge/neoforge/quilt), MC version
- `get_mod`, description, loaders, supported versions, downloads/follows
- `get_mod_versions`, versions with download links + required dependencies

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "Sodium for Fabric 1.20.1"
> `search_mods("sodium", loader="fabric", gameVersion="1.20.1")`
> → `get_mod_versions("sodium", "fabric", "1.20.1")` → Sodium 0.5.13, 10.2M downloads

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_mods`: Search Modrinth for Minecraft mods/modpacks/plugins, optionally
- `get_mod`: Get full details for a Modrinth project by slug: description,
- `get_mod_versions`: List versions of a mod, optionally filtered by loader and game

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_mods`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `search_sorted`
* `version_files`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
