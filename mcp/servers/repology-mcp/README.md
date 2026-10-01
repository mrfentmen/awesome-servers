# Repology MCP

Repology: package versions across many software repositories. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `project`  Get package versions across repos.
* `projects`  List all projects matching a pattern.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Repology API.
