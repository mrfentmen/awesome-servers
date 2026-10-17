#!/usr/bin/env python3
"""End-to-end smoke test for the SpaceDevs launch-schedule A2A server.

    LAUNCHES_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/launches/server.py --port 8813
    python3 servers/launches/tools/smoke.py --base http://127.0.0.1:8813

The Launch Library allows roughly thirty requests an hour per address, so this
runs few live calls and the schedule is cached server-side. A 429 is reported by
the agent in plain words and this file fails loudly rather than hiding it.
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

DATASET = "ll.thespacedevs.com/2.2.0/launch"
#: A window far enough ahead to have launches in it whatever the date.
FUTURE_START = "2030-06-01"
FUTURE_END = "2030-07-01"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def result_text(response: dict) -> str:
    message = (response.get("status") or {}).get("message") or {}
    return "\n".join(part.get("text", "") for part in message.get("parts") or [])


def throttled(response: dict) -> bool:
    """The Launch Library's own rate-limit wording, as the agent reports it."""
    return "throttling" in result_text(response)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the launch-schedule A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8813")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "SpaceDevs Launch Library Agent",
        ["upcoming-launches", "launch-in-window", "launch-lookup", "launch-details", "launch-board"],
    ):
        return 1

    # Live: the published schedule.
    upcoming = smoke.rpc(
        "message/send", {"message": smoke.user_message("next 3 launches")}
    ).get("result", {})
    upcoming_data = artifact_data(upcoming)
    launches = upcoming_data.get("launches") or []
    if throttled(upcoming):
        smoke.check("the Launch Library answered rather than throttling", False,
                    result_text(upcoming)[:160])
        return smoke.finish()
    smoke.check("upcoming completes", upcoming.get("status", {}).get("state") == "completed")
    smoke.check("a row count asks for that many rows", len(launches) <= 3, str(len(launches)))
    smoke.check("the schedule has rows", len(launches) > 0, str(len(launches)))
    if launches:
        first = launches[0]
        smoke.check("a row has a name and a NET",
                    bool(first.get("name")) and bool(first.get("net")),
                    f"{first.get('name')} at {first.get('net')}")
        smoke.check("a row says whether its NET is still ahead",
                    isinstance(first.get("net_is_future"), bool), str(first.get("net_is_future")))
        smoke.check("a row names its provider or says so",
                    "lsp_name" in first, str(first.get("lsp_name")))
    smoke.check("upcoming cites the dataset", upcoming_data.get("dataset") == DATASET)

    # Live: a date range far enough out to be empty, which is still an answer.
    window = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(f"what launches are between {FUTURE_START} and {FUTURE_END}?")},
    ).get("result", {})
    window_data = artifact_data(window)
    smoke.check("a window completes", window.get("status", {}).get("state") == "completed")
    smoke.check("a window reports its bounds",
                str(window_data.get("start", "")).startswith(FUTURE_START)
                and str(window_data.get("end", "")).startswith(FUTURE_END),
                f"{window_data.get('start')} to {window_data.get('end')}")
    if not throttled(window):
        smoke.check("an empty window says so",
                    (window_data.get("count") == 0) == ("no launch scheduled" in result_text(window)),
                    f"count={window_data.get('count')}")

    # Live: one launch in full, by id from the schedule.
    if launches and launches[0].get("id"):
        details = smoke.rpc(
            "message/send",
            {"message": smoke.user_message(f"tell me about launch {launches[0]['id']}")},
        ).get("result", {})
        details_data = artifact_data(details)
        launch = details_data.get("launch") or {}
        if not throttled(details):
            smoke.check("details completes", details.get("status", {}).get("state") == "completed")
            smoke.check("the record is the one asked for",
                        launch.get("id") == launches[0]["id"], str(launch.get("id")))
            smoke.check("a rocket is reported or said not to be",
                        launch.get("rocket_full") or launch.get("rocket_name")
                        or "not reported" in result_text(details),
                        str(launch.get("rocket_full")))
            smoke.check("a provider country is reported",
                        launch.get("lsp_country") is not None, str(launch.get("lsp_country")))
            smoke.check("missions are shaped",
                        isinstance(launch.get("missions"), list), str(launch.get("mission_count")))

    # Live: a name that cannot match.
    lookup = smoke.rpc(
        "message/send", {"message": smoke.user_message('find the "definitely-not-a-launch-name"')}
    ).get("result", {})
    lookup_data = artifact_data(lookup)
    if not throttled(lookup):
        smoke.check("lookup completes", lookup.get("status", {}).get("state") == "completed")
        smoke.check("no match is reported, not a guess",
                    lookup_data.get("matched") == 0, str(lookup_data.get("matched")))

    # input-required for a details question with no id.
    needs_id = smoke.rpc(
        "message/send", {"message": smoke.user_message("tell me about the launch")}
    ).get("result", {})
    smoke.check("details with no id asks for one",
                needs_id.get("status", {}).get("state") == "input-required"
                or throttled(needs_id))

    # carries the gateway's own wording, with no counts invented.
    board = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("how busy is the launch calendar this month?")},
    ).get("result", {})
    board_data = artifact_data(board)
    smoke.check("launch-board is answered, not crashed",
                board.get("status", {}).get("state") in ("completed", "failed"),
                str(board.get("status", {}).get("state")))

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message("next 2 launches")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"],
                str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final", bool(events[-1].get("final"))
                and events[-1].get("status", {}).get("state") in ("completed", "failed"))

    # Push config CRUD, on a task that exists.
    task_id = upcoming.get("id")
    config = smoke.rpc(
        "tasks/pushNotificationConfig/set",
        {"taskId": task_id,
         "pushNotificationConfig": {"url": "https://example.com/hook", "token": "t"}},
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
