#!/usr/bin/env python3
"""End-to-end smoke test for the designer resale A2A server.

    RESALE_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/resale/server.py --port 8875
    python3 servers/resale/tools/smoke.py --base http://127.0.0.1:8875

Live network: reads the keyless Shopify catalogues of Fashionphile and Rebag. Stock changes all
day, so the checks assert shape and honesty (prices present and quoted from the stores, both
stores named, a short read reported as short) rather than fixed counts.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

from a2a_kit.smoke import Smoke  # noqa: E402  (path setup must come first)

DATASETS = ("fashionphile.com/products.json", "shop.rebag.com/products.json")
SKILLS = ["resale-search", "brand-market", "piece-lookup", "price-index", "help"]


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def task_text(response: dict) -> str:
    status = response.get("status") or {}
    return ((status.get("message") or {}).get("parts") or [{}])[0].get("text", "")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the designer resale A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8875")
    parser.add_argument("--hook", default="http://127.0.0.1:8799/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks("Designer Resale Agent", SKILLS):
        return 1

    # Live: a brand search across both catalogues.
    search = smoke.rpc("message/send", {
        "message": smoke.user_message("what does a chanel flap cost?")}).get("result", {})
    search_data = artifact_data(search)
    rows = search_data.get("rows") or []
    smoke.check("resale-search completes", search.get("status", {}).get("state") == "completed")
    cited = search_data.get("sources") or []
    smoke.check("the answer cites the catalogues that answered",
                bool(cited) and set(cited) <= set(DATASETS), str(cited))
    smoke.check("the brand was recognised", search_data.get("brand") == "chanel",
                str(search_data.get("brand")))
    smoke.check("listings came back", bool(rows), str(search_data.get("count")))
    smoke.check("the number of products scanned is reported", (search_data.get("read") or 0) > 0,
                str(search_data.get("read")))
    smoke.check("every listing carries a store price, a store name and a url",
                all(row.get("price") is not None and row.get("source") in DATASETS and row.get("url")
                    for row in rows))
    smoke.check("cheapest first", [row.get("price") for row in rows]
                == sorted(row.get("price") for row in rows))
    smoke.check("availability and condition are stated per listing",
                all(isinstance(row.get("available"), bool) and "condition" in row for row in rows))
    smoke.check("the answer says these are asking prices, not sales",
                "asking prices" in task_text(search))

    # A plural ask gets a singular retry: the catalogue titles are singular.
    plural = smoke.rpc("message/send", {
        "message": smoke.user_message("show me rolex watches")}).get("result", {})
    plural_data = artifact_data(plural)
    smoke.check("a plural ask still finds listings",
                plural.get("status", {}).get("state") == "completed" and bool(plural_data.get("rows")),
                str(plural_data.get("count")))

    # Live: a brand market read.
    market = smoke.rpc("message/send", {
        "message": smoke.user_message("what is the chanel market like right now?")}).get("result", {})
    market_data = artifact_data(market)
    smoke.check("brand-market completes", market.get("status", {}).get("state") == "completed")
    smoke.check("the market read counts listings and availability",
                (market_data.get("count") or 0) > 0
                and market_data.get("available") is not None
                and market_data.get("listed") is not None,
                f"{market_data.get('count')} listings, {market_data.get('available')} available")
    low, high, median = (market_data.get("low"), market_data.get("high"),
                         market_data.get("median"))
    smoke.check("the spread is coherent", None not in (low, high, median)
                and low <= median <= high, f"{low} <= {median} <= {high}")
    smoke.check("the market read says where the numbers come from",
                all(source in task_text(market) for source in market_data.get("sources") or []))

    # Live: one listing by handle, using a handle the search just returned.
    handle = (rows or [{}])[0].get("handle")
    piece = smoke.rpc("message/send", {
        "message": smoke.user_message(f"pull the listing {handle}")}).get("result", {})
    piece_data = artifact_data(piece)
    smoke.check("piece-lookup completes", piece.get("status", {}).get("state") == "completed")
    smoke.check("the listing is the one asked for", piece_data.get("handle") == handle,
                f"{piece_data.get('handle')} vs {handle}")
    smoke.check("the listing carries the store's own price and availability",
                piece_data.get("price") is not None and piece_data.get("available") is not None,
                f"{piece_data.get('price')}")

    # input-required -> follow-up.
    first = smoke.rpc("message/send", {
        "message": {"kind": "message", "role": "user", "messageId": "m",
                    "parts": [{"kind": "data", "data": {"skill": "piece-lookup"}}]}}).get("result", {})
    smoke.check("piece-lookup without a handle -> input-required",
                first.get("status", {}).get("state") == "input-required")
    follow = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(handle, taskId=first.get("id"),
                                       contextId=first.get("contextId"))},
    ).get("result", {})
    smoke.check("the follow-up answers for that listing",
                follow.get("status", {}).get("state") == "completed"
                and artifact_data(follow).get("handle") == handle)

    # The premium skill: a key that is missing or rejected is an answer, not a crash, and no
    # numbers may come back with it.
    index = smoke.rpc("message/send", {
        "message": smoke.user_message("compare chanel, gucci and prada")}).get("result", {})
    index_data = artifact_data(index)
    index_text = task_text(index).lower()
    refused = "key" in index_text and not index_data.get("brands")
    smoke.check("price-index completes (a refusal is an answer)",
                index.get("status", {}).get("state") == "completed", index_text[:80])
    smoke.check("price-index either reports the gateway's numbers or names the missing key",
                bool(index_data.get("brands")) or "mcp_license_key" in index_text or "licence" in index_text,
                index_text[:120])
    smoke.check("a refused index carries no numbers",
                bool(index_data.get("brands"))
                or (not index_data.get("brands") and index_data.get("premium") is True))
    smoke.check("the premium skill is marked premium in the artifact",
                index_data.get("premium") is True)

    # Streaming.
    events = smoke.stream("message/stream", {
        "message": smoke.user_message("show me hermes bags")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"],
                str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final",
                bool(events[-1].get("final")) and events[-1].get("status", {}).get("state") == "completed")

    # Push config CRUD (this agent has no watch, but every task takes a config).
    task_id = search.get("id")
    config = smoke.rpc(
        "tasks/pushNotificationConfig/set",
        {"taskId": task_id, "pushNotificationConfig": {"url": args.hook, "token": "smoke"}},
    ).get("result", {})
    config_id = config.get("pushNotificationConfig", {}).get("id")
    smoke.check("push config set", bool(config_id))
    listed = smoke.rpc("tasks/pushNotificationConfig/list", {"taskId": task_id}).get("result", {})
    smoke.check("push config listed", len(listed.get("configs", [])) == 1)
    smoke.rpc("tasks/pushNotificationConfig/delete",
              {"taskId": task_id, "pushNotificationConfigId": config_id})
    after = smoke.rpc("tasks/pushNotificationConfig/list", {"taskId": task_id}).get("result", {})
    smoke.check("push config deleted", after.get("configs") == [])

    return smoke.finish()


if __name__ == "__main__":
    raise SystemExit(main())
