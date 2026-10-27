# MeiliSearch MCP

An MCP server for [MeiliSearch](https://www.meilisearch.com/), the fast and typo-tolerant search engine.

## What it does

Search through MeiliSearch indexes, manage documents, create/delete indexes, check health and stats, and manage API keys. Perfect for AI agents that need to search through your data.

## Tools

- `check_health` - Check if the MeiliSearch server is running
- `list_indexes` - List all indexes
- `get_index` - Get index details
- `create_index` - Create a new index
- `delete_index` - Delete an index
- `search_index` - Search documents in an index
- `get_documents` - List documents in an index
- `get_document` - Get a single document by ID
- `add_documents` - Add documents to an index
- `delete_document` - Delete a document by ID
- `get_stats` - Get instance statistics
- `get_index_stats` - Get index-specific statistics
- `get_task` - Check async task status
- `list_keys` - List API keys
- `update_settings` - Update index settings (ranking rules, searchable attributes, filters, etc.)

## Install

```bash
npx meilisearch-mcp
```

## Environment Variables

- `MEILISEARCH_URL` - MeiliSearch server URL (default: `http://localhost:7575`)
- `MEILISEARCH_API_KEY` - API key for authentication (if your instance requires it)

## Claude Desktop setup

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "meilisearch": {
      "command": "npx",
      "args": ["-y", "meilisearch-mcp"],
      "env": {
        "MEILISEARCH_URL": "http://localhost:7575",
        "MEILISEARCH_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Example usage

Ask Claude:

- "Search my products index for 'wireless headphones'"
- "Show me all indexes in my MeiliSearch instance"
- "Add these documents to my blog-posts index"
- "How many documents are in my main index?"
- "Update my index settings to use title as searchable attribute"

## Requirements

- A running MeiliSearch instance (v1.0+)
- Optional: API key if your instance has authentication enabled

## License

MIT
