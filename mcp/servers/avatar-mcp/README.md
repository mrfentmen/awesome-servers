# Avatar MCP

Generate avatar images for names or initials using the public DiceBear service. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `initials_avatar`  Avatar SVG for a name.
* `avatar_url`  Avatar URL without fetching.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Avatars come from the public DiceBear service.


