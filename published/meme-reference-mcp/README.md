# meme-reference-mcp

Meme template reference and image generation. Backed by two official, keyless
APIs — **Imgflip** for the classic template catalogue and **memegen.link** for
rendering text onto a template. No API key, no HTML scraping, no headless
browser.

## Why it is built this way

This server started life as a Know Your Meme scraper. Know Your Meme has no
public API, its pages are HTML-only, and the original selectors were never
verified against a live page — so that version was thrown away rather than
shipped. Imgflip and memegen both publish documented JSON endpoints, and every
memegen template carries its Know Your Meme origin link (`Origin:` in the
output), which is the closest thing to an official cross-reference.

## Tools

| Tool | What it does |
|---|---|
| `search_templates` | Find templates by name, ranked by how often they are used. |
| `popular_templates` | The most-used templates in the catalogue. |
| `template_info` | Size, caption-box count and usage for one template; lists candidates when the name is ambiguous. |
| `random_template` | One random template with its blank image. |
| `list_generators` | Renderable memegen generators with line counts and styles. |
| `generate_meme` | Render text onto a template and return the image URL (the URL is HEAD-checked before it is returned). |

## Install

```bash
npx -y meme-reference-mcp
```

Claude Desktop / Cursor config:

```json
{
  "mcpServers": {
    "meme-reference-mcp": { "command": "npx", "args": ["-y", "meme-reference-mcp"] }
  }
}
```

## Example prompts

- what's a good template for comparing two options
- make a drake meme about verified APIs
- give me a random meme template

## Notes

Catalogue responses are cached for ten minutes so repeated searches do not hit
Imgflip every time. Errors come back as a readable message (unknown template,
upstream timeout) instead of a stack trace.

MIT licensed.
