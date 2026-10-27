# ScreenplayWriter MCP

An MCP server for reading, writing, and analyzing screenplays in Fountain format. Parse screenplays into structured data, query character stats, generate production breakdowns, and write proper Fountain syntax.

## What it does

Parse Fountain files into a queryable AST. Edit scenes while preserving formatting. Generate character reports and production breakdowns. Write new screenplays in proper industry format.

## Tools

- parse_screenplay. Parse Fountain text into a structured AST.
- load_screenplay_file. Load a .fountain file from disk.
- write_screenplay. Write a new screenplay in Fountain format to disk.
- get_scene. Get a specific scene by number.
- edit_scene. Replace a scene and save to disk.
- add_scene. Insert a scene at a position and save to disk.
- remove_scene. Delete a scene and save to disk.
- character_report. Per character stats including scenes, dialogue count, and word count.
- scene_breakdown. Production breakdown per scene with locations, characters, and line counts.
- runtime_estimate. Total pages, minutes, day or night split, interior or exterior split.
- export_fountain. Save stored screenplay back to a .fountain file.

## Install

```bash
npx screenplaywriter-mcp
```

## Claude Desktop setup

Add this to your claude_desktop_config.json:

```json
{
  "mcpServers": {
    "screenplaywriter": {
      "command": "node",
      "args": ["/absolute/path/to/screenplaywriter-mcp/dist/index.js"]
    }
  }
}
```

Or use npx:

```json
{
  "mcpServers": {
    "screenplaywriter": {
      "command": "npx",
      "args": ["-y", "screenplaywriter-mcp"]
    }
  }
}
```

## Example usage

Ask Claude:

"Write a three scene screenplay about a detective who discovers the murder weapon is a keyboard"

"Parse my screenplay and give me a character report"

"How many day scenes versus night scenes do I have?"

"Add a new scene after scene 3 where the protagonist confronts the villain"

"Generate a production breakdown for my script"

"What is the estimated runtime?"

## Fountain format

Fountain is a plain text format for screenwriting. Example:

```
FADE IN:

INT. COFFEE SHOP - DAY

JOHN (30s, tired programmer) stares at his laptop.

JOHN
This code does not work.

SARAH slides into the seat across from him.

SARAH
Have you tried turning it off and on again?

FADE OUT.
```

The server understands all standard Fountain elements. Scene headings, character cues, dialogue, parentheticals, transitions, action lines, section headings, and notes.

## Runtime estimate

The server estimates runtime based on the standard rule of 1 page equals 1 minute of screen time. Page count is calculated from action and dialogue lines.

## License

MIT
