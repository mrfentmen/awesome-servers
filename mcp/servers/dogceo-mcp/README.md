# Dog CEO

Dog photos from dog.ceo - a random image, the full breed list with sub-breeds, and every image for a breed, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/dogceo-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "dogceo-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/dogceo-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `random_dog_image` | One random dog photo, optionally from a specific breed or sub-breed. |
| `list_breeds` | Every breed dog.ceo serves, with the sub-breeds each one has. |
| `breed_images` | All photos dog.ceo holds for one breed or sub-breed. |

## Data source

The dog.ceo image API (Stanford Dogs Dataset photos), no key required.
