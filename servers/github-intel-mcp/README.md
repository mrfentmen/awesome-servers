# GitHub Intel MCP

Read GitHub repository intelligence: search repos, inspect repo details, and list a user's repos. No API key is required for public data.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_repos`  Repo search sorted by stars.
* `get_repo`  One repository with stars, language, and description.
* `get_user_repos`  Repositories for a user.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Set the GITHUB_TOKEN environment variable to a token for higher rate limits.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `repo_languages`
* `repo_contributors`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-github-intel-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
