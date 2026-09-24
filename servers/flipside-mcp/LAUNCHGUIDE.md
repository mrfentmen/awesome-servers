# Flipside MCP

## Tagline
Flipside Crypto SQL API: run onchain queries, poll status, fetch results, cancel runs.

## Description
Flipside Crypto SQL API: run onchain queries, poll status, fetch results, cancel runs. Published from a private commercial monorepo. Not affiliated with or endorsed by Flipside.

## Setup Requirements
- `FLIPSIDE_API_KEY` (required): set in your MCP client config before use.

## Category
Finance

## Features
- Run SQL query: Submit a Flipside SQL query run against curated blockchain tables. Returns a token; poll status then fetch results.
- Get query status: Poll a Flipside query run: pending, running, finished or failed with row count.
- Get query results: Fetch result rows for a finished Flipside query run, paged.
- Cancel query run: Cancel a pending or running Flipside query.

## Getting Started
- "Ask your assistant about flipside using this server once installed"
- Tool: create_query — Submit a Flipside SQL query run against curated blockchain tables. Returns a token; poll status then fetch results.
- Tool: get_query_status — Poll a Flipside query run: pending, running, finished or failed with row count.
- Tool: get_query_results — Fetch result rows for a finished Flipside query run, paged.
- Tool: cancel_query — Cancel a pending or running Flipside query.

## Tags
flipside, mcp, data, api

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/flipside-mcp
