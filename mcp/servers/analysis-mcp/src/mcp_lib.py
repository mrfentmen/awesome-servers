#!/usr/bin/env python3
"""
mcp_lib — shared zero-dependency MCP server scaffolding.

Extracts the JSON-RPC boilerplate so multiple local MCP servers (secstack,
state) share one tested implementation instead of duplicating it.

Transport: newline-delimited JSON-RPC 2.0 over stdio (same shape as
fedora-hat's kit/acp_kit/rpc.py).
"""

import json
import subprocess
import sys

PROTOCOL_VERSION = "2024-11-05"
MAX_RESULT_BYTES = 60000


def truncate(s, limit=MAX_RESULT_BYTES):
    s = str(s)
    if len(s) > limit:
        return s[:limit] + "\n...[truncated %d bytes]" % (len(s) - limit)
    return s


class Server:
    """Minimal MCP server. Register callables with tool(); run() blocks on stdio."""

    def __init__(self, name, version="1.0.0"):
        self.name = name
        self.version = version
        self._tools = []          # schema list
        self._handlers = {}       # name -> callable

    # -- registration ----------------------------------------------------
    def tool(self, name, description, schema, handler):
        self._tools.append({
            "name": name,
            "description": description,
            "inputSchema": schema,
        })
        self._handlers[name] = handler
        return self

    # -- transport -------------------------------------------------------
    def _send(self, obj):
        sys.stdout.write(json.dumps(obj) + "\n")
        sys.stdout.flush()

    def _handle(self, msg):
        method = msg.get("method")
        mid = msg.get("id")

        if method == "initialize":
            self._send({"jsonrpc": "2.0", "id": mid, "result": {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {"tools": {}},
                "serverInfo": {"name": self.name, "version": self.version},
            }})

        elif method == "tools/list":
            self._send({"jsonrpc": "2.0", "id": mid,
                        "result": {"tools": self._tools}})

        elif method == "tools/call":
            params = msg.get("params", {}) or {}
            tname = params.get("name")
            args = params.get("arguments", {}) or {}
            fn = self._handlers.get(tname)
            if fn is None:
                text = "unknown tool: %s" % tname
            else:
                try:
                    text = fn(**args)
                except TypeError as e:
                    text = "bad arguments for %s: %s" % (tname, e)
                except Exception as e:
                    text = "%s: %s" % (type(e).__name__, e)
            self._send({"jsonrpc": "2.0", "id": mid, "result": {
                "content": [{"type": "text", "text": truncate(text)}],
                "isError": False,
            }})

        elif method in ("notifications/initialized", "notifications/cancelled"):
            return
        elif mid is not None:
            self._send({"jsonrpc": "2.0", "id": mid,
                        "result": {"content": [{"type": "text", "text": "ok"}]}})

    def run(self):
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                msg = json.loads(line)
            except Exception:
                continue
            self._handle(msg)


# -- process helper -------------------------------------------------------

def run(argv, timeout=120, input_text=None):
    """Run a binary. argv is always a list - never a shell string."""
    try:
        p = subprocess.run(argv, capture_output=True, text=True,
                           timeout=timeout, input=input_text)
        return p.returncode, p.stdout, p.stderr
    except subprocess.TimeoutExpired:
        return 124, "", "timeout after %ss" % timeout
    except Exception as e:
        return 1, "", str(e)