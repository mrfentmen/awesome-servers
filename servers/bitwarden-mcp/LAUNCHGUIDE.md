# Bitwarden MCP

## Tagline
Bitwarden public API: organization members, collections, groups, event logs. Needs API key.

## Description
Bitwarden public API: organization members, collections, groups, event logs. Needs API key. Published from a private commercial monorepo. Not affiliated with or endorsed by Bitwarden.

## Setup Requirements
- `BITWARDEN_API_URL` (required): set in your MCP client config before use.
- `BITWARDEN_CLIENT_ID` (required): set in your MCP client config before use.
- `BITWARDEN_CLIENT_SECRET` (required): set in your MCP client config before use.
- `BITWARDEN_IDENTITY_URL` (required): set in your MCP client config before use.

## Category
Business Tools

## Features

- List org members: Organization members: names, emails, status, collections access.
- List collections: Organization collections with member and group assignments.
- List groups: Organization groups with member ids and collection access.
- Get event logs: Organization event log: logins, item actions, admin changes. Optional date range.

## Getting Started

- "Ask your assistant about bitwarden using this server once installed"
- Tool: list_members — Organization members: names, emails, status, collections access.
- Tool: list_collections — Organization collections with member and group assignments.
- Tool: list_groups — Organization groups with member ids and collection access.
- Tool: get_events — Organization event log: logins, item actions, admin changes. Optional date range.

## Tags
bitwarden, mcp, data, api

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/bitwarden-mcp
