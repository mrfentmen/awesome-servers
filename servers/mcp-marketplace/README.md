# mcp-marketplace MCP server

MCP server for **mcp-marketplace.io** — lets an AI browse the public catalog
and manage your creator listings (price, description, and everything else).

Built 2026-09-27. Reverse-engineered from the site's public JS: the backend
is Supabase (`virupvwhtkpkjsiskckg.supabase.co`), catalog table
`public.mcp_servers`. The publishable key is public by design (ships in the
site's JS) and is embedded here.

## Tools (gateway prefix `marketplace__`)

Public (no auth):

| Tool | What it does |
|---|---|
| `search_servers` | Search catalog by keyword, category, pricing_type |
| `get_server` | Full detail for one server (slug or id) |
| `list_categories` | All categories with ids |
| `server_reviews` | Public reviews for a server |

Creator (needs marketplace account — see Auth):

| Tool | What it does |
|---|---|
| `my_listings` | Your servers with price/status/stats |
| `update_price` | Set `price_cents` + `pricing_type` on your listing |
| `update_listing` | Edit tagline, description, category, tags, urls, version, changelog, screenshots, pricing, etc. |
| `my_reviews` | Reviews on your listings |
| `my_stats` | Install / rating snapshot per listing |

`pricing_type`: `free` | `one_time` | `subscription`. `price_cents` is USD
cents (`700` = $7.00; subscription = per month).

## Auth

Set in the environment before the gateway starts the backend:

```bash
MCP_MARKETPLACE_EMAIL=you@example.com
MCP_MARKETPLACE_PASSWORD=...
```

or reuse tokens:

```bash
MCP_MARKETPLACE_ACCESS_TOKEN=...
MCP_MARKETPLACE_REFRESH_TOKEN=...
```

Writes are owner-guarded: the server fetches the row and refuses unless its
`creator_id` matches your account (the site's RLS enforces this too).

## Run standalone

```bash
~/workspace/mcp-gateway/.venv/bin/python ~/workspace/mcp-marketplace/server.py
```

Wired into the local MCP gateway as backend prefix `marketplace`.
