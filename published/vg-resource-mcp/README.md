# VG Resource MCP

An MCP server for The VG Resource network. Search, browse, and download game sprites, models, textures, and sounds across 100k+ assets from 50+ consoles.

## What it does

Search across four sites at once. Browse consoles, games, and assets. Download individual files or batch download entire games.

## Tools

- search_assets. Search sprites, models, textures, or sounds by name.
- browse_console. List all games for a console.
- browse_game. List all assets for a specific game.
- get_asset_detail. Get metadata plus download URL.
- get_latest. Recently uploaded assets.
- get_popular. Most viewed assets.
- random_asset. Random pick from 100k+ assets.
- cross_reference. Find the same game across all four resources.
- list_consoles. All available platforms.
- download_asset. Download a single file to disk.
- batch_download. Download multiple files to a directory.

## Install

```bash
npx vg-resource-mcp
```

## Claude Desktop setup

Add this to your claude_desktop_config.json:

```json
{
  "mcpServers": {
    "vg-resource": {
      "command": "node",
      "args": ["/absolute/path/to/vg-resource-mcp/dist/index.js"]
    }
  }
}
```

Or use npx:

```json
{
  "mcpServers": {
    "vg-resource": {
      "command": "npx",
      "args": ["-y", "vg-resource-mcp"]
    }
  }
}
```

## Example usage

Ask Claude:

"Find all Crash Bandicoot PlayStation models and download them to my Downloads folder"

"Search for Mario textures across all resources"

"Show me the latest uploads to the Spriters Resource"

"Browse all SNES games"

## Supported resources

- The Spriters Resource (2D sprites)
- The Models Resource (3D models)
- The Textures Resource (textures)
- The Sounds Resource (audio)

## Rate limiting

The server includes built in rate limiting (500ms between requests) to be respectful to the source sites.

## License

MIT
