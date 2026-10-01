#!/usr/bin/env python3
"""End-to-end smoke test for the games A2A server.

    python3 servers/games/server.py --port 8876
    python3 servers/games/tools/smoke.py --base http://127.0.0.1:8876

Live network: reads Steam's store API, SteamSpy, Steam's news feed and Epic's promotions feed.
Prices and player counts move all day, so the checks assert shape and honesty (a price is the
store's own and quoted as dollars, owners is the published range, a source is named) rather than
fixed numbers.
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

SKILLS = ["game-search", "game-stats", "game-news", "free-games", "price-board", "help"]


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def task_text(response: dict) -> str:
    status = response.get("status") or {}
    return ((status.get("message") or {}).get("parts") or [{}])[0].get("text", "")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the games A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8876")
    parser.add_argument("--hook", default="http://127.0.0.1:8799/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks("Games Agent", SKILLS):
        return 1

    # Live: a Steam store lookup.
    search = smoke.rpc("message/send", {
        "message": smoke.user_message("how much is portal 2 on steam?")}).get("result", {})
    search_data = artifact_data(search)
    rows = search_data.get("rows") or []
    smoke.check("game-search completes", search.get("status", {}).get("state") == "completed")
    smoke.check("listings came back", bool(rows), str(search_data.get("summary")))
    smoke.check("every row carries the store's own price or a free flag",
                all(row.get("is_free") is True or row.get("price") is not None for row in rows))
    prices = [row.get("price") if row.get("price") is not None else float("inf")
              for row in rows]
    smoke.check("cheapest first", prices == sorted(prices))
    smoke.check("every row carries a Steam store url",
                all(str(row.get("url") or "").startswith("https://store.steampowered.com/app/")
                    for row in rows))
    smoke.check("the answer says the prices are Steam's US store prices",
                "us store prices" in task_text(search).lower())

    # Live: a SteamSpy read. Owners must stay a published range, never a single number.
    stats = smoke.rpc("message/send", {
        "message": smoke.user_message("how many people play rust right now?")}).get("result", {})
    stats_data = artifact_data(stats)
    smoke.check("game-stats completes", stats.get("status", {}).get("state") == "completed")
    smoke.check("SteamSpy named the game it answered for", bool(stats_data.get("name")),
                str(stats_data.get("name")))
    smoke.check("owners is the published range, not a count",
                isinstance(stats_data.get("owners"), str) and ".." in stats_data["owners"],
                str(stats_data.get("owners")))
    smoke.check("a concurrent player count came back",
                isinstance(stats_data.get("ccu"), int) and stats_data["ccu"] > 0,
                str(stats_data.get("ccu")))
    smoke.check("the review share is a fraction or absent",
                stats_data.get("review_ratio") is None
                or 0.0 <= stats_data["review_ratio"] <= 1.0, str(stats_data.get("review_ratio")))
    smoke.check("the answer says owners is a published range",
                "range" in task_text(stats).lower())

    # Live: Steam's per-app news.
    news = smoke.rpc("message/send", {
        "message": smoke.user_message("any news for stardew valley?")}).get("result", {})
    news_data = artifact_data(news)
    news_rows = news_data.get("rows") or []
    smoke.check("game-news completes", news.get("status", {}).get("state") == "completed")
    smoke.check("news items came back with titles", bool(news_rows)
                and all(row.get("title") for row in news_rows), str(len(news_rows)))
    smoke.check("the answer names the feed's source", "ISteamNews" in task_text(news))

    # Live: Epic's free promotions.
    free = smoke.rpc("message/send", {
        "message": smoke.user_message("what is free on epic this week?")}).get("result", {})
    free_data = artifact_data(free)
    smoke.check("free-games completes", free.get("status", {}).get("state") == "completed")
    smoke.check("Epic answered something free now or coming",
                bool(free_data.get("now") or free_data.get("soon")),
                f"{len(free_data.get('now') or [])} now, {len(free_data.get('soon') or [])} coming")
    smoke.check("the answer names the promotions feed",
                "freeGamesPromotions" in task_text(free))

    # input-required -> a bare game name as the follow-up.
    first = smoke.rpc("message/send", {
        "message": {"kind": "message", "role": "user", "messageId": "m",
                    "parts": [{"kind": "data", "data": {"skill": "game-search"}}]}}).get("result", {})
    smoke.check("game-search without a name -> input-required",
                first.get("status", {}).get("state") == "input-required")
    follow = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("portal 2", taskId=first.get("id"),
                                       contextId=first.get("contextId"))},
    ).get("result", {})
    smoke.check("the follow-up searches for that game",
                follow.get("status", {}).get("state") == "completed"
                and artifact_data(follow).get("query") == "portal 2",
                str(artifact_data(follow).get("query")))

    # The premium skill: a missing key is an answer, not a crash, and no numbers may come back.
    board = smoke.rpc("message/send", {
        "message": smoke.user_message("compare elden ring and dark souls 3")}).get("result", {})
    board_data = artifact_data(board)
    board_text = task_text(board).lower()
    smoke.check("price-board completes (a refusal is an answer)",
                board.get("status", {}).get("state") == "completed", board_text[:80])
    smoke.check("price-board either reports the gateway's board or names the missing key",
                bool(board_data.get("games")) or "mcp_license_key" in board_text
                or "licence" in board_text, board_text[:120])
    smoke.check("a refused board carries no numbers", not board_data.get("games"))
    smoke.check("the premium skill is marked premium in the artifact",
                board_data.get("premium") is True)

    # Streaming.
    events = smoke.stream("message/stream", {
        "message": smoke.user_message("show me hades")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"],
                str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final",
                bool(events[-1].get("final"))
                and events[-1].get("status", {}).get("state") == "completed")

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
