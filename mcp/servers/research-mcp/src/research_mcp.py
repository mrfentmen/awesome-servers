#!/usr/bin/env python3
"""
research_mcp.py — MCP wrapper around market_research.py
Exposes 3 tools to any MCP client (OpenCode, Claude Desktop, etc.):
  - market_check(keyword)  -> organic demand/saturation snapshot
  - trend(keyword)         -> 12-month Google Trends trajectory
  - suggest(keyword)       -> query-space expansion

Zero API keys. stdio transport, MCP 2024-11-05 protocol.
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import market_research as mr


TOOLS = {
    "market_check": {
        "name": "market_check",
        "description": ("Organic niche snapshot for a product keyword: DDG "
                        "suggest breadth (demand space) + approximate Etsy "
                        "saturation (competition proxy)."),
        "inputSchema": {
            "type": "object",
            "properties": {"keyword": {"type": "string"}},
            "required": ["keyword"],
        },
    },
    "trend": {
        "name": "trend",
        "description": "12-month Google Trends trajectory for a keyword.",
        "inputSchema": {
            "type": "object",
            "properties": {"keyword": {"type": "string"}},
            "required": ["keyword"],
        },
    },
    "suggest": {
        "name": "suggest",
        "description": "DuckDuckGo autocomplete query-space for a keyword.",
        "inputSchema": {
            "type": "object",
            "properties": {"keyword": {"type": "string"}},
            "required": ["keyword"],
        },
    },
}


def handle(req):
    method = req.get("method")
    rid = req.get("id")

    if method == "initialize":
        return {
            "jsonrpc": "2.0", "id": rid,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "research", "version": "0.1.0"},
            },
        }

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": rid,
                "result": {"tools": list(TOOLS.values())}}

    if method == "tools/call":
        p = req.get("params", {})
        name = p.get("name")
        args = p.get("arguments", {}) or {}
        kw = (args.get("keyword") or "").strip()
        try:
            if name == "market_check":
                out = mr.market_check(kw)
            elif name == "trend":
                out = mr.trend_12mo(kw)
            elif name == "suggest":
                out = {"suggestions": mr.suggest(kw)}
            else:
                raise ValueError(f"unknown tool: {name}")
            return {
                "jsonrpc": "2.0", "id": rid,
                "result": {
                    "content": [{"type": "text",
                                 "text": json.dumps(out, indent=1)}]
                },
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0", "id": rid,
                "error": {"code": -32603,
                          "message": f"{name} failed: {e}"},
            }

    if method in ("notifications/initialized",):
        return None

    return {
        "jsonrpc": "2.0", "id": rid,
        "error": {"code": -32601, "message": "method not found"},
    }


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            continue
        resp = handle(req)
        if resp is not None:
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
