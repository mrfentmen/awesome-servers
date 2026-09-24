# Cyberark MCP

## Tagline
CyberArk PVWA API: logon, safes, accounts. Token cached per process.

## Description
CyberArk PVWA API: logon, safes, accounts. Token cached per process. Published from a private commercial monorepo. Not affiliated with or endorsed by Cyberark.

## Setup Requirements
- `CYBERARK_BASE_URL` (required): set in your MCP client config before use.
- `CYBERARK_PASSWORD` (required): set in your MCP client config before use.
- `CYBERARK_USERNAME` (required): set in your MCP client config before use.

## Category
Business Tools

## Features
- List safes: CyberArk safes visible to the logon user.
- List accounts: CyberArk accounts, optionally filtered by safe.
- Get account: One CyberArk account by id (metadata, not the password value).

## Getting Started
- "Ask your assistant about cyberark using this server once installed"
- Tool: list_safes — CyberArk safes visible to the logon user.
- Tool: list_accounts — CyberArk accounts, optionally filtered by safe.
- Tool: get_account — One CyberArk account by id (metadata, not the password value).

## Tags
cyberark, mcp, data, api

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/cyberark-mcp
