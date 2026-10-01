#!/usr/bin/env python3
"""End-to-end smoke test for the BART A2A server.

    BART_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/bart/server.py --port 8871
    python3 servers/bart/tools/smoke.py --base http://127.0.0.1:8871

Live: every check reads the real BART public API. BART's board only holds a handful
of estimates and no timetable, so the checks read what is actually on the board
rather than assuming a train is running.
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

DATASET = "api.bart.gov"
EMBARCADERO = "EMBR"
EMBARCADERO_NAME = "Embarcadero"
PITTSBURG = "PITT"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def ask(smoke: Smoke, text: str) -> dict:
    return smoke.rpc("message/send", {"message": smoke.user_message(text)}).get("result", {})


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the BART A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8871")
    parser.add_argument("--hook", default="http://127.0.0.1:8820/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "BART Transit Agent",
        ["departures", "lines", "stations", "delays", "last-departure"],
    ):
        return 1

    # Live: the departure board, asked the way a rider would ask it.
    board = ask(smoke, f"when is the next train from {EMBARCADERO_NAME}?")
    board_data = artifact_data(board)
    rows = board_data.get("departures") or []
    state = board.get("status", {}).get("state")
    if state == "completed" and rows:
        smoke.check("departures lists the live board", True, f"{len(rows)} train(s)")
        smoke.check("the board resolves the station name", board_data.get("station") == EMBARCADERO,
                    str(board_data.get("station")))
        smoke.check("BART's own clock is reported",
                    bool((board_data.get("bart_clock") or {}).get("time")),
                    str(board_data.get("bart_clock")))
        smoke.check("each train carries a destination and a platform",
                    all(row.get("destination") for row in rows)
                    and any(row.get("platform") for row in rows),
                    str([(row.get("destination"), row.get("minutes")) for row in rows[:3]]))
        smoke.check("the board cites the dataset", board_data.get("dataset") == DATASET)
    else:
        # Outside service hours BART publishes no estimates; that is a real answer.
        smoke.check("departures reports an empty board honestly", state in ("completed", "input-required"),
                    str(state))

    # Live: what the station serves, read off the same board.
    lines = ask(smoke, f"what lines does {EMBARCADERO_NAME} serve?")
    lines_data = artifact_data(lines)
    served = lines_data.get("lines") or []
    smoke.check("lines completes", lines.get("status", {}).get("state") == "completed")
    smoke.check("destinations carry platforms and line colours",
                all(row.get("platforms") is not None and row.get("line_colours") is not None
                    for row in served),
                str([(row.get("destination"), row.get("platforms"), row.get("line_colours"))
                     for row in served[:3]]))

    # Live: the station directory.
    directory = ask(smoke, "which bart station is in Berkeley?")
    directory_data = artifact_data(directory)
    matches = directory_data.get("station_matches") or []
    smoke.check("stations completes", directory.get("status", {}).get("state") == "completed")
    smoke.check("a city search returns its stations",
                all(row.get("abbr") and row.get("name") for row in matches),
                str([(row.get("abbr"), row.get("name")) for row in matches[:4]]))
    by_name = artifact_data(ask(smoke, "find the station called Pittsburg Center"))
    smoke.check("a name search finds the station",
                (by_name.get("station_matches") or [{}])[0].get("abbr") == "PCTR",
                str([row.get("abbr") for row in (by_name.get("station_matches") or [])]))

    # Live: the disruption view of a board.
    delays = ask(smoke, f"any cancelled trains at {PITTSBURG}?")
    delays_data = artifact_data(delays)
    smoke.check("delays completes", delays.get("status", {}).get("state") == "completed")
    smoke.check("the board is reported with its flag count",
                delays_data.get("trains_on_board") is not None,
                f"{delays_data.get('count')} flagged of {delays_data.get('trains_on_board')}")

    # The premium skill: without a key the gateway's own wording comes back as an answer.
    premium = ask(smoke, f"if I leave in 20 minutes can I still get to Antioch from {EMBARCADERO}?")
    premium_data = artifact_data(premium)
    premium_state = premium.get("status", {}).get("state")
    if premium_data.get("premium") and premium_data.get("reason") in ("missing_key", "denied"):
        text = premium.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", "")
        smoke.check("last-departure with no licence is a completed answer",
                    premium_state == "completed", str(premium_state))
        smoke.check("the refusal names the key", "MCP_LICENSE_KEY" in text, premium_data.get("reason"))
        smoke.check("no trains are handed over without a licence",
                    premium_data.get("catchable_count") is None, str(premium_data.get("reason")))
    else:
        smoke.check("last-departure returned live trains",
                    premium_state == "completed" and premium_data.get("catchable_count") is not None,
                    str(premium_state))
        smoke.check("a last catchable train is named",
                    bool((premium_data.get("last_catchable") or {}).get("destination")),
                    str(premium_data.get("last_catchable")))

    # input-required -> follow-up for a question with no station named.
    lonely = smoke.rpc("message/send", {"message": smoke.user_message("when is the next train?")}).get("result", {})
    smoke.check("departures without a station -> input-required",
                lonely.get("status", {}).get("state") == "input-required",
                str(lonely.get("status", {}).get("state")))
    follow = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(EMBARCADERO, taskId=lonely.get("id"),
                                       contextId=lonely.get("contextId"))},
    ).get("result", {})
    smoke.check("follow-up with an abbreviation completes",
                follow.get("status", {}).get("state") == "completed"
                and artifact_data(follow).get("station") == EMBARCADERO,
                str(artifact_data(follow).get("station")))

    # An ambiguous name is offered back as a choice rather than guessed at.
    ambiguous = ask(smoke, "when is the next train from Oakland?")
    smoke.check("an ambiguous station name -> input-required with candidates",
                ambiguous.get("status", {}).get("state") == "input-required"
                and bool(artifact_data(ambiguous).get("candidates")),
                str(ambiguous.get("status", {}).get("state")))

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message(f"departures at {PITTSBURG}")})
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
    smoke.check("push config deleted", after.get("configs") == [])

    return smoke.finish()


if __name__ == "__main__":
    raise SystemExit(main())
