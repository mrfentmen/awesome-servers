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
- export_for_website. Save a ScriptWriter website backup (.json) — the user clicks Restore on the site and the script appears with title, logline and body intact.
- list_templates. The 24 starter templates from the ScriptWriter website, with descriptions.
- start_from_template. Load a site template skeleton and write the story into it.
- site_guide. How the site reads Fountain (title-page contract, elements, force markers, hand-off paths) — call before writing for the site.

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

## Works with the ScriptWriter website

This server writes the exact Fountain the free ScriptWriter website imports: pass `title`/`logline`/`byline` to `write_screenplay` (or stamp a template with `start_from_template`), then hand the user the file via `export_for_website`. On the site they click Restore (for the `.json`) or Import (for the `.fountain`) — title, logline and scenes land in the editor. The parser reads screenplays the same way the site does: multi-line dialogue blocks, standalone parentheticals, `Notes:` loglines, force markers (`.`, `!`, `@`, `>`), and the site's structural inserts (MONTAGE, ACT ONE, COLD OPEN…) as action, never as characters.

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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `source_material_reference`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
