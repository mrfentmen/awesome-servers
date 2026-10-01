#!/usr/bin/env python3
"""End-to-end smoke test for the Lichess A2A server.

    LICHESS_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/chess/server.py --port 8808
    python3 servers/chess/tools/smoke.py --base http://127.0.0.1:8808
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

DATASET = "lichess.org/api"
PLAYER = "thibault"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def text_of(response: dict) -> str:
    return response.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", "")


def json_message(text: str, data: dict) -> dict:
    """A user message carrying both a sentence and a data part, as the protocol wants.

    `Smoke.user_message` takes extra top-level keys, so passing `parts` to it would
    drop the text; the two parts have to be built here.
    """
    return {"kind": "message", "role": "user", "messageId": "smoke-json",
            "parts": [{"kind": "text", "text": text}, {"kind": "data", "data": data}]}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the Lichess A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8808")
    parser.add_argument("--hook", default="http://127.0.0.1:8799/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "Lichess Chess Agent",
        ["player-profile", "recent-games", "game-detail", "opening-lookup", "player-form"],
    ):
        return 1

    # Live: the player's profile.
    profile = smoke.rpc(
        "message/send", {"message": smoke.user_message(f"how strong is {PLAYER} on lichess?")}
    ).get("result", {})
    profile_data = artifact_data(profile)
    ratings = (profile_data.get("player") or {}).get("ratings") or []
    record = (profile_data.get("player") or {}).get("record") or {}
    smoke.check("profile skill completes", profile.get("status", {}).get("state") == "completed")
    smoke.check("profile cites the dataset", profile_data.get("dataset") == DATASET)
    smoke.check("ratings came back live", len(ratings) > 0, str(len(ratings)))
    smoke.check("a rating carries a number and a deviation",
                bool(ratings) and ratings[0].get("rating") is not None
                and ratings[0].get("deviation") is not None,
                str(ratings[0]) if ratings else "none")
    smoke.check("shortest games are listed first",
                len(ratings) < 2 or ratings[0]["perf"] == "ultraBullet"
                or ratings[0]["games"] <= ratings[1]["games"],
                str([row["perf"] for row in ratings]))
    smoke.check("the all-time record came back live", (record.get("all") or 0) > 0, str(record.get("all")))

    # Live: recent games, read from the NDJSON export.
    recent = smoke.rpc(
        "message/send", {"message": json_message(f"last 10 games for {PLAYER}",
                                                 {"player": PLAYER, "count": 10})},
    ).get("result", {})
    recent_data = artifact_data(recent)
    games = recent_data.get("games") or []
    smoke.check("recent-games skill completes", recent.get("status", {}).get("state") == "completed")
    smoke.check("games came back live", len(games) > 0, str(len(games)))
    smoke.check("the export was read as NDJSON", recent_data.get("export_format") == "NDJSON")
    smoke.check("a game carries side, result and opponent",
                bool(games) and games[0].get("side") in ("white", "black")
                and games[0].get("result") in ("win", "loss", "draw")
                and bool(games[0].get("opponent")),
                str({k: games[0].get(k) for k in ("side", "result", "opponent")}) if games else "none")
    smoke.check("a game carries a time control",
                bool(games) and bool(games[0].get("time_control")),
                str(games[0].get("time_control")) if games else "none")

    # Live: one game's detail, using an id the live game list actually returned.
    live_id = next((game["id"] for game in games if game.get("id")), None)
    smoke.check("the game list produced an id to follow", bool(live_id), str(live_id))
    if live_id:
        detail = smoke.rpc(
            "message/send", {"message": json_message("show me that game", {"game_id": live_id})},
        ).get("result", {})
        detail_data = artifact_data(detail)
        game = detail_data.get("game") or {}
        smoke.check("game-detail skill completes",
                    detail.get("status", {}).get("state") == "completed")
        smoke.check("the same game came back", game.get("id") == live_id, str(game.get("id")))
        smoke.check("both players are named",
                    bool(game.get("white", {}).get("id")) and bool(game.get("black", {}).get("id")),
                    f"{game.get('white', {}).get('id')} vs {game.get('black', {}).get('id')}")
        smoke.check("the move list came back", (game.get("move_count") or 0) > 0,
                    str(game.get("move_count")))
        smoke.check("moves are shown in the answer", "half-moves" in text_of(detail),
                    text_of(detail)[-160:])

        # Live: the opening that game reached, from Lichess's own analysis.
        opening = smoke.rpc(
            "message/send",
            {"message": json_message("what opening is it?", {"game_id": live_id})},
        ).get("result", {})
        opening_data = artifact_data(opening)
        found = opening_data.get("opening")
        smoke.check("opening-lookup skill completes",
                    opening.get("status", {}).get("state") == "completed")
        smoke.check("the opening is reported or honestly absent",
                    bool(found and found.get("name")) or "no opening analysis" in text_of(opening),
                    str(found))
        smoke.check("the opening comes from Lichess's analysis",
                    opening_data.get("opening_source") in
                    ("Lichess game analysis", "Lichess opening dictionary"),
                    str(opening_data.get("opening_source")))

    # Live: the opening dictionary, by name.
    dictionary = smoke.rpc(
        "message/send",
        {"message": json_message("what opening is the sicilian defense?",
                                 {"skill": "opening-lookup", "opening": "Sicilian Defense"})},
    ).get("result", {})
    dictionary_data = artifact_data(dictionary)
    smoke.check("an opening name resolves or is reported missing",
                bool((dictionary_data.get("opening") or {}).get("eco"))
                or "dictionary has nothing" in text_of(dictionary), text_of(dictionary)[:140])

    # A bare username is a player, not a game id: the two are the same shape.
    bare = smoke.rpc(
        "message/send", {"message": smoke.user_message(PLAYER)}
    ).get("result", {})
    smoke.check("a bare username is not read as a game id",
                bare.get("status", {}).get("state") == "completed"
                and (artifact_data(bare).get("player") or {}).get("id") == PLAYER,
                str((artifact_data(bare).get("player") or {}).get("id")))

    # An unknown player is a completed answer, not a crash.
    unknown = smoke.rpc(
        "message/send",
        {"message": json_message("ratings", {"player": "no_such_player_zzz9999"})},
    ).get("result", {})
    smoke.check("an unknown player is answered, not crashed",
                unknown.get("status", {}).get("state") == "completed"
                and "no player called" in text_of(unknown), text_of(unknown)[:140])

    # The premium skill: with no key set this must be a COMPLETED answer carrying the
    # gateway's own wording, not a crash and not a fabricated form report.
    premium = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(f"is {PLAYER} improving at the moment?")},
    ).get("result", {})
    smoke.check("premium skill answers rather than crashing",
                premium.get("status", {}).get("state") in ("completed", "failed"),
                str(premium.get("status", {}).get("state")))
    smoke.check("premium skill names the licence gate",
                "chess_player_form" in text_of(premium) or "MCP_LICENSE_KEY" in text_of(premium),
                text_of(premium)[:120])
    smoke.check("premium skill reports no form without a licence",
                not artifact_data(premium).get("repertoire"),
                str(artifact_data(premium).get("reason")))

    # Streaming.
    events = smoke.stream("message/stream",
                          {"message": smoke.user_message(f"ratings for {PLAYER}")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"], str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final",
                bool(events[-1].get("final")) and events[-1].get("status", {}).get("state") == "completed")

    # Push config CRUD.
    task_id = profile.get("id")
    config = smoke.rpc(
        "tasks/pushNotificationConfig/set",
        {"taskId": task_id, "pushNotificationConfig": {"url": args.hook, "token": "smoke"}},
    ).get("result", {})
    config_id = config.get("pushNotificationConfig", {}).get("id")
    smoke.check("push config set", bool(config_id))
    listed = smoke.rpc("tasks/pushNotificationConfig/list", {"taskId": task_id}).get("result", {})
    smoke.check("push config listed", len(listed.get("configs", [])) == 1)
    smoke.rpc("tasks/pushNotificationConfig/delete", {"taskId": task_id, "pushNotificationConfigId": config_id})
    after = smoke.rpc("tasks/pushNotificationConfig/list", {"taskId": task_id}).get("result", {})
    smoke.check("push config deleted", after.get("configs", []) == [])

    return smoke.finish()


if __name__ == "__main__":
    raise SystemExit(main())
