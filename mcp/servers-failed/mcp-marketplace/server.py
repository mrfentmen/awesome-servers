#!/usr/bin/env python3
"""MCP server for mcp-marketplace.io.

Public catalog reads work with no credentials (the site's publishable
Supabase key is public - it ships in the site's own JS).

Creator writes (price / listing updates) need the creator's marketplace
account. Provide one of:
  MCP_MARKETPLACE_EMAIL + MCP_MARKETPLACE_PASSWORD, or
  MCP_MARKETPLACE_ACCESS_TOKEN (+ optional MCP_MARKETPLACE_REFRESH_TOKEN)

Writes are owner-guarded client-side: the server fetches the row first and
refuses unless its creator_id matches the authenticated user. The site's
row-level security enforces the same server-side.
"""
import json
import os
import re
import urllib.parse
import urllib.request

from mcp.server.fastmcp import FastMCP

SUPABASE_URL = "https://virupvwhtkpkjsiskckg.supabase.co"
# Publishable key - public by design, embedded in mcp-marketplace.io's JS.
PUBLISHABLE_KEY = "sb_publishable_BuqlW96Ke8C_zzJG-LQv1Q_YHi_r_4h"
REST = SUPABASE_URL + "/rest/v1"
AUTH = SUPABASE_URL + "/auth/v1"

PRICING_TYPES = ("free", "one_time", "subscription")

EDITABLE_FIELDS = (
    "tagline", "description", "category_id", "tags", "use_cases",
    "screenshots", "github_url", "documentation_url", "npm_package",
    "pypi_package", "version", "changelog", "getting_started",
    "setup_requirements", "hide_source_code", "health_check_url",
    "price_cents", "pricing_type",
)

mcp = FastMCP("mcp-marketplace")

_session = {"access_token": os.environ.get("MCP_MARKETPLACE_ACCESS_TOKEN"),
            "refresh_token": os.environ.get("MCP_MARKETPLACE_REFRESH_TOKEN"),
            "user_id": None}


class MarketplaceError(Exception):
    pass


def _req(method, url, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    headers = {
        "apikey": PUBLISHABLE_KEY,
        "Authorization": "Bearer " + (token or PUBLISHABLE_KEY),
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        try:
            detail = json.loads(e.read().decode())
        except Exception:
            detail = {"message": "HTTP %d" % e.code}
        raise MarketplaceError(
            "%s %s failed: %s" % (method, url.split("?")[0],
                                  detail.get("message", detail)))


def _rest(method, path, params=None, body=None, token=None):
    url = REST + path
    if params:
        url += "?" + urllib.parse.urlencode(params, doseq=True)
    return _req(method, url, body, token)


def _sign_in():
    email = os.environ.get("MCP_MARKETPLACE_EMAIL")
    password = os.environ.get("MCP_MARKETPLACE_PASSWORD")
    if not email or not password:
        raise MarketplaceError(
            "Creator auth required: set MCP_MARKETPLACE_EMAIL and "
            "MCP_MARKETPLACE_PASSWORD (or MCP_MARKETPLACE_ACCESS_TOKEN).")
    res = _req("POST", AUTH + "/token?grant_type=password",
               {"email": email, "password": password})
    _session["access_token"] = res["access_token"]
    _session["refresh_token"] = res.get("refresh_token")
    _session["user_id"] = res["user"]["id"]
    return _session["access_token"]


def _token():
    if _session["access_token"]:
        return _session["access_token"]
    return _sign_in()


def _authed_rest(method, path, params=None, body=None):
    token = _token()
    try:
        return _rest(method, path, params, body, token)
    except MarketplaceError as e:
        if "401" not in str(e) and "expired" not in str(e).lower():
            raise
        # try refresh once
        if _session["refresh_token"]:
            res = _req("POST", AUTH + "/token?grant_type=refresh_token",
                       {"refresh_token": _session["refresh_token"]})
            _session["access_token"] = res["access_token"]
            _session["refresh_token"] = res.get("refresh_token",
                                                _session["refresh_token"])
            return _rest(method, path, params, body, _session["access_token"])
        _session["access_token"] = None
        return _rest(method, path, params, body, _token())


def _me():
    token = _token()
    me = _req("GET", AUTH + "/user", token=token)
    _session["user_id"] = me["id"]
    return me


_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)


def _get_server_row(ref):
    """Fetch one mcp_servers row by id or slug."""
    key = "id" if _UUID_RE.match(ref) else "slug"
    params = {"select": "*", key: "eq." + ref, "limit": 1}
    rows = _rest("GET", "/mcp_servers", params)
    if not rows:
        raise MarketplaceError("No server found for %r" % ref)
    return rows[0]


def _slim(row):
    return {k: row.get(k) for k in (
        "id", "slug", "name", "tagline", "pricing_type", "price_cents",
        "category_id", "status", "version", "install_count", "avg_rating",
        "security_score", "github_url", "npm_package", "pypi_package",
        "remote_url", "updated_at")}


@mcp.tool()
def search_servers(query: str, category: str = "", pricing_type: str = "",
                    limit: int = 20, offset: int = 0) -> str:
    """Search the public marketplace catalog. pricing_type: free, one_time, subscription."""
    params = {"select": ",".join((
                  "id", "slug", "name", "tagline", "pricing_type", "price_cents",
                  "category_id", "status", "version", "install_count",
                  "avg_rating", "security_score", "github_url", "npm_package",
                  "pypi_package", "remote_url", "updated_at")),
              "limit": min(limit, 100), "offset": offset,
              "order": "install_count.desc"}
    if query:
        params["or"] = "(name.ilike.*%s*,tagline.ilike.*%s*,description.ilike.*%s*)" % (
            query, query, query)
    if category:
        params["category_id"] = "eq." + category
    if pricing_type:
        if pricing_type not in PRICING_TYPES:
            raise MarketplaceError("pricing_type must be one of %s" % (PRICING_TYPES,))
        params["pricing_type"] = "eq." + pricing_type
    rows = _rest("GET", "/mcp_servers", params)
    return json.dumps([_slim(r) for r in rows], indent=2)


@mcp.tool()
def get_server(ref: str) -> str:
    """Full public detail for one server, by slug or id."""
    return json.dumps(_get_server_row(ref), indent=2, default=str)


@mcp.tool()
def list_categories() -> str:
    """All marketplace categories with ids."""
    rows = _rest("GET", "/categories",
                 {"select": "id,name,slug,description", "order": "name"})
    return json.dumps(rows, indent=2)


@mcp.tool()
def server_reviews(ref: str, limit: int = 20) -> str:
    """Public reviews for one server, by slug or id."""
    row = _get_server_row(ref)
    rows = _rest("GET", "/reviews",
                 {"select": "*", "mcp_server_id": "eq." + row["id"],
                  "order": "created_at.desc", "limit": min(limit, 100)})
    return json.dumps(rows, indent=2, default=str)


@mcp.tool()
def my_listings() -> str:
    """Servers owned by the authenticated creator (needs creator login)."""
    me = _me()
    rows = _authed_rest("GET", "/mcp_servers",
                        {"select": "*", "creator_id": "eq." + me["id"],
                         "order": "updated_at.desc"})
    return json.dumps([_slim(r) for r in rows], indent=2, default=str)


@mcp.tool()
def update_price(ref: str, price_cents: int, pricing_type: str) -> str:
    """Update price on one of YOUR listings, by slug or id.
    pricing_type: free (forces price 0), one_time (USD cents), subscription (USD cents / month)."""
    if pricing_type not in PRICING_TYPES:
        raise MarketplaceError("pricing_type must be one of %s" % (PRICING_TYPES,))
    if not isinstance(price_cents, int) or price_cents < 0:
        raise MarketplaceError("price_cents must be a non-negative integer (cents).")
    if pricing_type == "free":
        price_cents = 0
    me = _me()
    row = _get_server_row(ref)
    if row["creator_id"] != me["id"]:
        raise MarketplaceError(
            "Refusing: server %r is not owned by this account." % row["slug"])
    updated = _authed_rest(
        "PATCH", "/mcp_servers",
        {"id": "eq." + row["id"]},
        {"price_cents": price_cents, "pricing_type": pricing_type})
    return json.dumps(_slim(updated[0]) if updated else
                      {"ok": True, "slug": row["slug"],
                       "price_cents": price_cents, "pricing_type": pricing_type},
                      indent=2, default=str)


@mcp.tool()
def update_listing(ref: str, fields: dict) -> str:
    """Update editable fields on one of YOUR listings (slug or id).
    Allowed: tagline, description, category_id, tags, use_cases, screenshots,
    github_url, documentation_url, npm_package, pypi_package, version,
    changelog, getting_started, setup_requirements, hide_source_code,
    health_check_url, price_cents, pricing_type."""
    bad = [k for k in fields if k not in EDITABLE_FIELDS]
    if bad:
        raise MarketplaceError("Not editable via this tool: %s" % ", ".join(bad))
    if "pricing_type" in fields and fields["pricing_type"] not in PRICING_TYPES:
        raise MarketplaceError("pricing_type must be one of %s" % (PRICING_TYPES,))
    if "pricing_type" in fields and fields["pricing_type"] == "free":
        fields = dict(fields, price_cents=0)
    me = _me()
    row = _get_server_row(ref)
    if row["creator_id"] != me["id"]:
        raise MarketplaceError(
            "Refusing: server %r is not owned by this account." % row["slug"])
    updated = _authed_rest("PATCH", "/mcp_servers",
                           {"id": "eq." + row["id"]}, fields)
    return json.dumps(updated[0] if updated else {"ok": True, "slug": row["slug"]},
                      indent=2, default=str)


@mcp.tool()
def my_reviews(limit: int = 50) -> str:
    """Reviews left on the authenticated creator's listings."""
    me = _me()
    mine = _authed_rest("GET", "/mcp_servers",
                        {"select": "id,slug,name", "creator_id": "eq." + me["id"]})
    ids = [s["id"] for s in mine]
    if not ids:
        return "[]"
    rows = _authed_rest(
        "GET", "/reviews",
        {"select": "*,mcp_servers(slug,name)",
         "mcp_server_id": "in.(" + ",".join(ids) + ")",
         "order": "created_at.desc", "limit": min(limit, 100)})
    return json.dumps(rows, indent=2, default=str)


@mcp.tool()
def my_stats() -> str:
    """Install / rating snapshot across the authenticated creator's listings."""
    me = _me()
    rows = _authed_rest(
        "GET", "/mcp_servers",
        {"select": "slug,name,pricing_type,price_cents,install_count,"
                   "anon_install_count,avg_rating,status",
         "creator_id": "eq." + me["id"], "order": "install_count.desc"})
    return json.dumps(rows, indent=2, default=str)


if __name__ == "__main__":
    mcp.run()
