# mempool-mcp

Bitcoin network status: recommended fees, mempool backlog, blocks, addresses, difficulty retargets.

Data source: https://mempool.space/api (no key). No API key needed. Runs on stdio.

## Tools

| Tool | What it does |
|---|---|
| `recommended_fees` | Fee estimates in sat/vB by confirmation speed. |
| `mempool_stats` | Pending transactions, queued fees and backlog size. |
| `recent_blocks` | The latest mined blocks. |
| `block_info` | One block by height or hash. |
| `address_info` | Confirmed and unconfirmed balance for an address. |
| `difficulty_adjustment` | Retarget progress, estimate and ETA. |

## Install

```bash
npx -y mempool-mcp
```

Claude Desktop / Cursor config:

```json
{
  "mcpServers": {
    "mempool-mcp": { "command": "npx", "args": ["-y", "mempool-mcp"] }
  }
}
```

## Example prompts

- what fee do I need right now
- how big is the mempool

## Notes

Responses are plain text, trimmed to the fields that matter. Failures come back as a
readable message (bad name, upstream timeout, not found) instead of a stack trace.

MIT licensed.
