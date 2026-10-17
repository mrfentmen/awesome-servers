# Gitea MCP

Gitea.com public API: search repos and users. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_repos`  Search public repositories.
* `repo_detail`  Get repository details.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Gitea API.


