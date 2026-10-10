# Arweave MCP

## Tagline
Keyless MCP server for Arweave: network info, transactions, wallet balances, storage price.

## Description
Keyless MCP server for Arweave: network info, transactions, wallet balances, storage price. Published from a private commercial monorepo. Not affiliated with or endorsed by Arweave.

## Setup Requirements
- `ARWEAVE_URL` (required): set in your MCP client config before use.

## Category
Business Tools

## Features

- Network info: Arweave network: height, peers, queue. Set ARWEAVE_URL for other gateways.
- Transaction status: Check if an Arweave transaction is confirmed and in which block.
- Wallet balance: AR balance of a wallet address.
- Storage price: What storing N bytes costs in AR right now.
- Search transactions by tag: Find Arweave transactions by a tag pair, which is how permanent apps label their data, for example App-Name=ArDrive or Content-Type=image/png.
- Address transactions: The newest transactions written by one Arweave address, with confirmation height, data size, content type and the tags that identify each upload.
- Block detail: One Arweave block in full: mining reward in AR, transaction count, block and weave size, nonce, difficulty and the previous block hash.

## Getting Started

- "Ask your assistant about arweave using this server once installed"
- Tool: network_info — Arweave network: height, peers, queue. Set ARWEAVE_URL for other gateways.
- Tool: tx_status — Check if an Arweave transaction is confirmed and in which block.
- Tool: wallet_balance — AR balance of a wallet address.
- Tool: storage_price — What storing N bytes costs in AR right now.
- Tool: search_by_tag — Find Arweave transactions by a tag pair, which is how permanent apps label their data, for example App-Name=ArDrive or Content-Type=image/png.
- Tool: address_transactions — The newest transactions written by one Arweave address, with confirmation height, data size, content type and the tags that identify each upload.
- Tool: block_detail — One Arweave block in full: mining reward in AR, transaction count, block and weave size, nonce, difficulty and the previous block hash.

## Tags
arweave, mcp, shopping, api

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/arweave-mcp
