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
