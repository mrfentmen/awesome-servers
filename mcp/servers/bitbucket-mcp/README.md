# Bitbucket MCP

Bitbucket repositories from the public Bitbucket API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `repos`  List repos for a workspace.
* `repo`  Get a repo.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Bitbucket API.


