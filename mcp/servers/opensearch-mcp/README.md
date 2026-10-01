# OpenSearch MCP

An MCP server for [OpenSearch](https://opensearch.org/), the community-driven, Apache 2.0 search and analytics suite.

## What it does

Search through OpenSearch indices, manage documents, create/delete indexes, check cluster health, and monitor statistics. Perfect for AI agents that need to query search indexes.

## Tools

- `check_health` - Check cluster health status
- `list_indices` - List all indices
- `get_index` - Get index details
- `create_index` - Create a new index
- `delete_index` - Delete an index
- `search_index` - Search documents in an index
- `search_raw` - Search with raw OpenSearch query DSL
- `get_documents` - List documents in an index
- `get_document` - Get a single document by ID
- `index_document` - Add a document to an index
- `delete_document` - Delete a document by ID
- `get_stats` - Get instance-wide statistics
- `get_cluster_stats` - Get cluster statistics
- `get_tasks` - List async tasks
- `get_mappings` - Get index mappings
- `list_shards` - List all shards
- `list_nodes` - List all cluster nodes

## Install

```bash
npx opensearch-mcp
```

## Environment Variables

- `OPENSEARCH_URL` - OpenSearch server URL (default: `http://localhost:9200`)
- `OPENSEARCH_API_KEY` - API key for authentication (preferred)
- `OPENSEARCH_USERNAME` / `OPENSEARCH_PASSWORD` - Basic auth credentials

## Claude Desktop setup

```json
{
  "mcpServers": {
    "opensearch": {
      "command": "npx",
      "args": ["-y", "opensearch-mcp"],
      "env": {
        "OPENSEARCH_URL": "http://localhost:9200",
        "OPENSEARCH_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Example usage

"Search my products index for 'wireless headphones'"
"Check if my OpenSearch cluster is healthy"
"Create a new index called 'blog-posts'"
"How many documents are in my logs index?"

## License

MIT
