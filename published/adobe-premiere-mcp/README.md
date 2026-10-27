# Adobe Premiere MCP

An MCP server for [Adobe Premiere Pro](https://www.adobe.com/products/premiere.html), the industry-standard video editing software.

## What it does

Control Adobe Premiere Pro from AI agents via ExtendScript. Import media, create sequences, apply effects, export media, and run custom scripts.

## Tools

- `is_premiere_running` - Check if Premiere Pro is running
- `get_project_info` - Get current project info (name, path, sequence count)
- `list_sequences` - List all sequences in the project
- `list_clips` - List clips in the first sequence
- `create_sequence` - Create a new sequence with custom dimensions and frame rate
- `import_media` - Import a media file into the project
- `get_media_info` - Get metadata about a media file
- `get_sequence_info` - Get active sequence details
- `apply_effect` - Apply an effect to the first clip
- `export_media` - Export the sequence to a file (H.264, ProRes, HEVC)
- `run_custom_script` - Run arbitrary ExtendScript (JavaScript) code

## Install

```bash
npx adobe-premiere-mcp
```

## Requirements

- Adobe Premiere Pro must be installed
- On macOS: `PREMIERE_PATH` env var to the app bundle (default: standard location)
- On Windows: Premiere must be installed and accessible

## Environment Variables

- `PREMIERE_PATH` - Optional custom path to Adobe Premiere Pro app

## Claude Desktop setup

```json
{
  "mcpServers": {
    "premiere": {
      "command": "npx",
      "args": ["-y", "adobe-premiere-mcp"]
    }
  }
}
```

## Example usage

"Is Adobe Premiere running?"
"Create a 1920x1080 30fps sequence called 'YouTube Video'"
"Import /Users/me/videos/clip.mp4 into the current project"
"Apply GaussianBlur effect with radius 5.0"
"Export the current sequence as H.264 to /Users/me/output.mp4"

## License

MIT
