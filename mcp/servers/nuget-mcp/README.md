# NuGet MCP

Search .NET packages on the public NuGet API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search packages.
* `package`  Details for one package.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public NuGet gallery search API.


