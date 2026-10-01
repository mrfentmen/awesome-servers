# ROM MCP

An MCP server for searching, verifying, and managing game ROM collections. Search Internet Archive, verify checksums against No-Intro and Redump databases, parse emulator save files, and download ROMs.

## What it does

Search for ROMs across Internet Archive, ROMsgames.net, CoolROM, Arcade Punks, ROMsFun, and Reddit r/Roms. Verify ROM integrity using checksums. Identify unknown ROMs by hash. Parse save files to check playtime and progress. Scan entire collections and catalog everything.

## Supported Sources

- **Internet Archive** - Search via the IA API
- **ROMsgames.net** - HTML scraping
- **CoolROM** - HTML scraping
- **Arcade Punks** - HTML scraping
- **ROMsFun** - HTML scraping
- **Reddit r/Roms** - Community discussions and recommendations

## Tools

- search_rom. Search Internet Archive for game ROMs by title or keyword.
- search_all_sources. Search across all ROM sources (Internet Archive, ROMsgames, CoolROM, Arcade Punks, ROMsFun, Reddit r/Roms).
- search_romsgames. Search ROMsgames.net for ROMs.
- search_coolrom. Search CoolROM for ROMs.
- search_arcadepunks. Search Arcade Punks for ROMs.
- search_romsfun. Search ROMsFun for ROMs.
- search_reddit_roms. Search Reddit r/Roms for community discussions and recommendations.
- verify_rom. Compute MD5 and SHA1 checksums and verify against known databases.
- match_by_checksum. Identify a game by providing its hash.
- parse_save_file. Read emulator save files (.sav, .srm, .states).
- scan_collection. Scan a directory and identify all ROM files.
- get_download_link. Get direct download URL from Internet Archive.
- download_rom. Download a ROM to a local directory.
- detect_console. Detect the console from filename or path.

## Install

```bash
npx rom-mcp
```

## Claude Desktop setup

Add this to your claude_desktop_config.json:

```json
{
  "mcpServers": {
    "rom": {
      "command": "npx",
      "args": ["-y", "rom-mcp"]
    }
  }
}
```

## Example usage

Ask Claude:

"Search Internet Archive for Super Mario World ROMs"

"Verify this ROM file at ~/Downloads/game.sfc"

"What game is this? MD5: a1b2c3d4e5f6..."

"Scan my ROM collection at ~/ROMs and tell me what I have"

"Download the Sonic the Hedgehog ROM to my desktop"

"Parse this save file and tell me how much playtime I have"

## Checksum verification

The server computes MD5 and SHA1 hashes of ROM files and checks them against known databases to verify integrity and identify games.

## Save file support

Parses common emulator save formats including .srv, .srm, .sav, .states, and .ss files.

## License

MIT

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `archive_item_files`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
