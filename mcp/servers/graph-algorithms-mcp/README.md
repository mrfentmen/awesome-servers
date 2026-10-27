# Graph Algorithms

Shortest paths, topological order and connected components for directed or undirected graphs - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/graph-algorithms-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "graph-algorithms-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/graph-algorithms-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `shortest_path` | Find the cheapest path between two nodes with Dijkstra. |
| `topological_sort` | Order a directed acyclic graph so every edge points forward. |
| `connected_components` | Group nodes into connected components. |

## Data source

Pure local computation, no network calls.
