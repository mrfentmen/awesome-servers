#!/usr/bin/env python3
"""End-to-end smoke test for the TVMaze A2A server.

    TVMAZE_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/tv/server.py --port 8804
    python3 servers/tv/tools/smoke.py --base http://127.0.0.1:8804
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

DATASET = "api.tvmaze.com"
SHOW = "Severance"
SHOW_ID = 44933


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the TVMaze A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8804")
    parser.add_argument("--hook", default="http://127.0.0.1:8799/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "TVMaze Agent",
        ["show-search", "show-episodes", "next-airing", "schedule-day", "binge-plan"],
    ):
        return 1

    # Live: show search.
    found = smoke.rpc(
        "message/send", {"message": smoke.user_message(f"search for {SHOW.lower()}")}
    ).get("result", {})
    found_data = artifact_data(found)
    shows = found_data.get("shows") or []
    smoke.check("search skill completes", found.get("status", {}).get("state") == "completed")
    smoke.check("search found the show live", any(row.get("name") == SHOW for row in shows),
                str([row.get("name") for row in shows[:3]]))
    smoke.check("search cites the dataset + score",
                found_data.get("dataset") == DATASET and shows[0].get("match_score") is not None,
                str(shows[0].get("match_score") if shows else None))

    # Live: the episode list of a real season.
    episodes = smoke.rpc(
        "message/send", {"message": smoke.user_message(f"list the episodes of {SHOW} season 2")}
    ).get("result", {})
    episodes_data = artifact_data(episodes)
    rows = episodes_data.get("episodes") or []
    smoke.check("episodes skill completes", episodes.get("status", {}).get("state") == "completed")
    smoke.check("season 2 episodes came back live", len(rows) >= 5, str(len(rows)))
    smoke.check("episode rows carry a season number and airdate",
                bool(rows) and rows[0].get("season") == 2 and bool(rows[0].get("airdate")),
                f"season {rows[0].get('season')} on {rows[0].get('airdate')}" if rows else "no rows")
    smoke.check("show resolved to the right show id",
                (episodes_data.get("show") or {}).get("id") == SHOW_ID,
                str((episodes_data.get("show") or {}).get("id")))

    # Live: next air date. Severance has finished, so an honest "none scheduled" is
    # the correct answer here - the point is that it is reported, not invented.
    upcoming = smoke.rpc(
        "message/send", {"message": smoke.user_message(f"when does {SHOW} air next?")}
    ).get("result", {})
    upcoming_data = artifact_data(upcoming)
    smoke.check("next-airing skill completes", upcoming.get("status", {}).get("state") == "completed")
    smoke.check("next-airing answers with a show", (upcoming_data.get("show") or {}).get("id") == SHOW_ID)
    smoke.check("next-airing says so when nothing is scheduled",
                (upcoming_data.get("next_episode") is None) == ("no future episode" in
                                                                 upcoming.get("status", {})
                                                                 .get("message", {}).get("parts", [{}])[0]
                                                                 .get("text", "")),
                str(upcoming_data.get("next_episode")))

    # Live: the day's schedule, worldwide and for one country.
    schedule = smoke.rpc(
        "message/send", {"message": smoke.user_message("what is on tv today?")}
    ).get("result", {})
    schedule_data = artifact_data(schedule)
    smoke.check("schedule skill completes", schedule.get("status", {}).get("state") == "completed")
    smoke.check("today's schedule came back live", (schedule_data.get("count") or 0) > 0,
                str(schedule_data.get("count")))
    smoke.check("schedule cites the dataset", schedule_data.get("dataset") == DATASET)
    us = smoke.rpc(
        "message/send", {"message": smoke.user_message("what's on tv in the US on monday?")}
    ).get("result", {})
    us_data = artifact_data(us)
    smoke.check("country + weekday resolved",
                us.get("status", {}).get("state") == "completed" and us_data.get("country") == "US",
                f"{us_data.get('country')} on {us_data.get('date')}")

    # input-required -> follow-up carries the show title through.
    first = smoke.rpc("message/send", {"message": smoke.user_message("list the episodes")}).get("result", {})
    smoke.check("episodes with no show -> input-required",
                first.get("status", {}).get("state") == "input-required")
    follow = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(SHOW, taskId=first.get("id"), contextId=first.get("contextId"))},
    ).get("result", {})
    smoke.check("follow-up lists the episodes",
                follow.get("status", {}).get("state") == "completed"
                and len(artifact_data(follow).get("episodes") or []) > 0,
                str(len(artifact_data(follow).get("episodes") or [])))

    # The premium skill: with no key set this must be a COMPLETED answer carrying the
    # gateway's own wording, not a crash and not a fabricated plan.
    premium = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(f"how long do I need to finish season 2 of {SHOW}?")},
    ).get("result", {})
    premium_text = premium.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", "")
    smoke.check("premium skill answers rather than crashing",
                premium.get("status", {}).get("state") in ("completed", "failed"), str(premium.get("status")))
    smoke.check("premium skill names the licence gate",
                "tv_binge_plan" in premium_text or "MCP_LICENSE_KEY" in premium_text, premium_text[:120])
    smoke.check("premium skill reports no episodes without a licence",
                not artifact_data(premium).get("episodes"), str(artifact_data(premium).get("reason")))

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message(f"search for {SHOW}")})
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
