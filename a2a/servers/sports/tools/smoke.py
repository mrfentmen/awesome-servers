#!/usr/bin/env python3
"""End-to-end smoke test for the ESPN sports A2A server.

    ESPN_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/sports/server.py --port 8807
    python3 servers/sports/tools/smoke.py --base http://127.0.0.1:8807
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

from a2a_kit.smoke import Smoke  # noqa: E402  (path setup must come first)

DATASET = "site.web.api.espn.com/apis"
TODAY = datetime.now(timezone.utc).date()


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
    parser = argparse.ArgumentParser(description="smoke-test the ESPN sports A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8807")
    parser.add_argument("--hook", default="http://127.0.0.1:8799/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "ESPN Sports Agent",
        ["scores", "team-lookup", "standings", "game-detail", "slate-brief"],
    ):
        return 1

    # Live: NHL today, a league that is genuinely in season.
    scores = smoke.rpc(
        "message/send", {"message": smoke.user_message("what are the nhl scores today?")}
    ).get("result", {})
    scores_data = artifact_data(scores)
    games = scores_data.get("games") or []
    smoke.check("scores skill completes", scores.get("status", {}).get("state") == "completed")
    smoke.check("scores cite the dataset", scores_data.get("dataset") == DATASET)
    smoke.check("nhl board came back live", len(games) > 0, str(len(games)))
    smoke.check("a named date reaches ESPN as YYYYMMDD",
                smoke.rpc("message/send", {"message": json_message(
                    "nhl scores", {"league": "nhl", "date": TODAY.isoformat()})},
                ).get("result", {}).get("status", {}).get("state") == "completed",
                "the dashed form is HTTP 400 at ESPN")
    smoke.check("today was named, not assumed", scores_data.get("date_named") is True,
                str(scores_data.get("date")))
    smoke.check("both sides of a game are named",
                bool(games) and bool(games[0].get("away")) and bool(games[0].get("home")),
                str((games[0].get("away") or {}).get("team")) if games else "no games")
    smoke.check("a scheduled game carries a real start time",
                bool(games) and bool(games[0].get("detail")),
                str(games[0].get("detail")) if games else "no games")
    smoke.check("no day named -> ESPN's own current board",
                artifact_data(smoke.rpc(
                    "message/send", {"message": json_message("mlb scores", {"league": "mlb"})},
                ).get("result", {})).get("date") == "current board")

    # Live: the same read for a date with a known fixture list.
    dated = smoke.rpc(
        "message/send",
        {"message": json_message("mlb scores", {"league": "mlb",
                                                "date": TODAY.isoformat(), "limit": 5})},
    ).get("result", {})
    smoke.check("a named date is accepted",
                dated.get("status", {}).get("state") == "completed"
                and artifact_data(dated).get("date") == TODAY.isoformat(),
                str(artifact_data(dated).get("date")))

    # Live: a bad league is a question back, not a crash.
    bad = smoke.rpc(
        "message/send", {"message": json_message("curling scores", {"league": "curling"})},
    ).get("result", {})
    smoke.check("an unknown league is refused as input-required",
                bad.get("status", {}).get("state") == "input-required"
                and "league must be one of" in text_of(bad), text_of(bad)[:120])

    # Live: team lookup, and the id it hands back is usable.
    team = smoke.rpc(
        "message/send", {"message": json_message("look up the Toronto Raptors", {"league": "nba"})},
    ).get("result", {})
    team_data = artifact_data(team)
    teams = team_data.get("teams") or []
    smoke.check("team-lookup skill completes", team.get("status", {}).get("state") == "completed")
    smoke.check("the team came back live", len(teams) > 0, str(len(teams)))
    smoke.check("a match carries an ESPN team id",
                bool(teams) and teams[0].get("id") is not None,
                str(teams[0].get("displayName")) if teams else "none")

    # Live: standings, for a league whose table exists.
    standings = smoke.rpc(
        "message/send", {"message": json_message("nba standings", {"league": "nba"})},
    ).get("result", {})
    standings_data = artifact_data(standings)
    groups = standings_data.get("groups") or []
    smoke.check("standings skill completes", standings.get("status", {}).get("state") == "completed")
    smoke.check("a table or an honest note",
                bool(groups) or "publishes no" in text_of(standings), str(len(groups)))
    if groups:
        entries = groups[0].get("entries") or []
        smoke.check("a table row carries a record",
                    bool(entries) and entries[0].get("stats", {}).get("wins") is not None,
                    str(entries[0].get("stats") if entries else "no entries"))
        smoke.check("the season is named", bool(standings_data.get("season")),
                    str(standings_data.get("season")))

    # Live: one game's detail, using an id from the live board.
    live_game = None
    for league in ("nhl", "nba", "mlb", "nfl"):
        board = smoke.rpc(
            "message/send",
            {"message": json_message("scores", {"league": league, "limit": 5})},
        ).get("result", {})
        for row in artifact_data(board).get("games") or []:
            if row.get("event_id"):
                live_game = (league, row)
                break
        if live_game:
            break
    smoke.check("a live board produced an event id", bool(live_game),
                str(live_game[1].get("event_id")) if live_game else "none")
    if live_game:
        league, row = live_game
        detail = smoke.rpc(
            "message/send",
            {"message": json_message("game detail", {"league": league, "event_id": row["event_id"]})},
        ).get("result", {})
        detail_data = artifact_data(detail)
        smoke.check("game-detail skill completes",
                    detail.get("status", {}).get("state") == "completed")
        smoke.check("the same game came back",
                    (detail_data.get("game") or {}).get("event_id") == row["event_id"],
                    str((detail_data.get("game") or {}).get("name")))
        smoke.check("the answer says whether ESPN published odds",
                    "Odds:" in text_of(detail), text_of(detail)[-120:])

    # input-required -> follow-up carries the event id through.
    first = smoke.rpc(
        "message/send", {"message": smoke.user_message("tell me about that game in detail")}
    ).get("result", {})
    smoke.check("a game detail with no id asks for one",
                first.get("status", {}).get("state") == "input-required"
                and "ESPN event id" in text_of(first), text_of(first)[:120])
    smoke.check("game-detail with no id -> input-required",
                first.get("status", {}).get("state") == "input-required")
    follow = smoke.rpc(
        "message/send",
        {"message": json_message(str(live_game[1]["event_id"]) if live_game else "401902644", {})
         | {"taskId": first.get("id"), "contextId": first.get("contextId")}},
    ).get("result", {})
    smoke.check("follow-up reads the game",
                follow.get("status", {}).get("state") == "completed"
                and bool((artifact_data(follow).get("game") or {}).get("event_id")),
                str((artifact_data(follow).get("game") or {}).get("event_id")))

    # gateway's own wording, not a crash and not a fabricated slate.

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message("what are the nhl scores today?")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"], str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final",
                bool(events[-1].get("final")) and events[-1].get("status", {}).get("state") == "completed")

    # Push config CRUD.
    task_id = follow.get("id")
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
