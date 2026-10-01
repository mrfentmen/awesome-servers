# GIMP MCP

An MCP server for [GIMP](https://www.gimp.org/), the free and open-source raster graphics editor.

## What it does

Control GIMP image editing through Python-Fu scripting. Open images, apply filters, resize, export, and run batch processing - all from AI agents.

## Tools

- `open_image` - Open an image file in GIMP
- `save_image` - Save the current image
- `export_image` - Export to PNG, JPEG, XCF, PSD formats
- `resize_image` - Resize to specific dimensions
- `get_image_info` - Get image dimensions, mode, type, layers
- `list_layers` - List all layers in an image
- `apply_filter` - Apply blur, sharpen, brightness/contrast, grayscale
- `batch_process` - Batch process multiple files with custom Python code

## Install

```bash
npx gimp-mcp
```

## Requirements

- GIMP must be installed on your system
- On macOS: GIMP at `/Applications/GIMP.app` or in PATH
- On Linux: GIMP available via package manager (usually `gimp` in PATH)
- On Windows: Install GIMP and add to PATH

## Environment Variables

- `GIMP_PATH` - Optional custom path to GIMP executable

## Claude Desktop setup

```json
{
  "mcpServers": {
    "gimp": {
      "command": "npx",
      "args": ["-y", "gimp-mcp"]
    }
  }
}
```

## Example usage

"Open the photo at /Users/me/pictures/landscape.jpg and resize it to 1920x1080"
"Apply a blur filter with radius 10 to /Users/me/images/profile.png"
"Export all PNGs in /Users/me/images/ to JPEG format"
"Apply grayscale to this image and save it"

## License

MIT
