# thegraph-mcp

The Graph decentralized network: run GraphQL against any subgraph via API-key gateway.

## Setup

```bash
export THEGRAPH_API_KEY=YOUR_KEY
```

## Tools

- `query_subgraph` — Run GraphQL against a subgraph on The Graph decentralized network. Example query: '{ _meta { block { number } } }'. Variables as JSON string.
- `get_subgraph_schema` — Fetch the GraphQL schema of a subgraph via introspection: entities and fields you can query.
- `get_latest_block` — Latest block a subgraph has indexed: chain, number, hash, timestamp.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
