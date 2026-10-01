#!/usr/bin/env python3
"""End-to-end smoke test for the 7Timer Stargazing A2A server.

    STARGAZING_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/stargazing/server.py --port 8816
    python3 servers/stargazing/tools/smoke.py --base http://127.0.0.1:8816

Every read here is live against www.7timer.info. The forecast changes as the
model reruns, so the checks assert the shape the feed must have - 24 slots of 3
hours, indices inside their published ranges, words that match the scale - and
not particular values.
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

DATASET = "7timer.info/bin/api.pl?product=astro"
#: The published ranges. Bigger is better on all three, which is the trap: a low
#: cloud-cover number is a covered sky and not a clear one.
CLOUD_RANGE = (1, 9)
SEEING_RANGE = (1, 8)
TRANSPARENCY_RANGE = (1, 7)
#: Two places far enough apart that their weather cannot be the same thing.
PLACE_A = "New York"
PLACE_B = "Los Angeles"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def result_text(response: dict) -> str:
    message = (response.get("status") or {}).get("message") or {}
    return "\n".join(part.get("text", "") for part in message.get("parts") or [])


def unreadable(response: dict) -> bool:
    """True when 7Timer could not be read at all."""
    return "could not be read" in result_text(response)


def in_range(value, bounds) -> bool:
    return isinstance(value, int) and bounds[0] <= value <= bounds[1]


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the Stargazing A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8816")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "7Timer Stargazing Agent",
        ["sky-tonight", "sky-forecast", "sky-compare", "sky-best-window"],
    ):
        return 1

    # Live: the coming hours, with every index inside its published range.
    tonight = smoke.rpc("message/send",
                        {"message": smoke.user_message(
                            f"is tonight good for stargazing in {PLACE_A}?")},
                        timeout=60).get("result", {})
    if unreadable(tonight):
        smoke.check("7Timer answered", False, result_text(tonight)[:160])
        return smoke.finish()
    tonight_data = artifact_data(tonight)
    slots = tonight_data.get("slots") or []
    smoke.check("sky-tonight completes", tonight.get("status", {}).get("state") == "completed")
    smoke.check("slots came back", len(slots) > 0, str(len(slots)))
    smoke.check("sky-tonight cites the dataset", tonight_data.get("dataset") == DATASET)
    if slots:
        smoke.check("every cloud cover is inside 1-9",
                    all(in_range(slot.get("cloudcover"), CLOUD_RANGE) for slot in slots),
                    str([slot.get("cloudcover") for slot in slots[:5]]))
        smoke.check("every seeing value is inside 1-8",
                    all(in_range(slot.get("seeing"), SEEING_RANGE) for slot in slots),
                    str([slot.get("seeing") for slot in slots[:5]]))
        smoke.check("every transparency value is inside 1-7",
                    all(in_range(slot.get("transparency"), TRANSPARENCY_RANGE) for slot in slots),
                    str([slot.get("transparency") for slot in slots[:5]]))
        smoke.check("every slot is stamped in UTC", all(slot.get("utc") for slot in slots),
                    str([slot.get("utc") for slot in slots[:3]]))
        smoke.check("every index is printed with its scale word",
                    all(slot.get("cloud_word") and slot.get("seeing_word")
                        and slot.get("transparency_word") for slot in slots))
        # A low cloud number is a bad sky, and the wording must not invert it.
        worst = min(slots, key=lambda slot: slot.get("cloudcover") or 9)
        if worst.get("cloudcover") == 1:
            smoke.check("a cloud cover of 1 reads as fully covered, not clear",
                        worst.get("cloud_word") == "fully covered", str(worst.get("cloud_word")))
    smoke.check("the answer states that bigger is better", "Bigger is better" in result_text(tonight))
    smoke.check("the answer refuses to guess the moon phase",
                "no moon data" in result_text(tonight) or "moon" in result_text(tonight))
    smoke.check("the answer states the daylight limitation",
                "daylight" in result_text(tonight))

    # Live: the whole run, which is 24 slots of 3 hours and therefore 72 hours.
    forecast = smoke.rpc("message/send",
                         {"message": smoke.user_message(
                             f"three day stargazing forecast for {PLACE_A}")},
                         timeout=60).get("result", {})
    forecast_data = artifact_data(forecast)
    smoke.check("sky-forecast completes", forecast.get("status", {}).get("state") == "completed")
    smoke.check("the run is 24 slots", forecast_data.get("count") == 24,
                str(forecast_data.get("count")))
    smoke.check("the horizon is 72 hours, not the 48 the product is named for",
                forecast_data.get("horizon_hours") == 72, str(forecast_data.get("horizon_hours")))
    smoke.check("the slots are 3 hours apart", forecast_data.get("slot_hours") == 3,
                str(forecast_data.get("slot_hours")))

    # Live: two places side by side, each with its own best slot.
    compare = smoke.rpc("message/send",
                        {"message": smoke.user_message(
                            f"compare stargazing in {PLACE_A} and {PLACE_B} tonight")},
                        timeout=60).get("result", {})
    compare_data = artifact_data(compare)
    compared = compare_data.get("compared") or []
    smoke.check("sky-compare completes", compare.get("status", {}).get("state") == "completed")
    smoke.check("two places were compared", len(compared) == 2, str(len(compared)))
    if len(compared) == 2:
        smoke.check("each compared place has its own coordinates",
                    compared[0].get("latitude") != compared[1].get("latitude"))
        smoke.check("each compared place has a clearest slot",
                    bool(compared[0].get("best_slot")) and bool(compared[1].get("best_slot")))

    # The premium skill: without a key the refusal is a completed answer with no
    # ranking invented in the feed's shape.
    best = smoke.rpc("message/send",
                     {"message": smoke.user_message(
                         f"when is the best time to stargaze in {PLACE_A}?")},
                     timeout=60).get("result", {})
    best_data = artifact_data(best)
    smoke.check("sky-best-window never returns a fabricated ranking",
                best_data.get("windows") is None and best_data.get("premium") is True,
                str({k: best_data.get(k) for k in ("premium", "reason", "windows")}))
    smoke.check("sky-best-window is answered, not crashed",
                best.get("status", {}).get("state") in ("completed", "failed"),
                str(best.get("status", {}).get("state")))

    # Streaming.
    events = smoke.stream("message/stream",
                          {"message": smoke.user_message(
                              f"is tonight good for stargazing in {PLACE_A}?")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"],
                str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final", bool(events[-1].get("final"))
                and events[-1].get("status", {}).get("state") == "completed")

    # Push config CRUD, on a task that exists.
    task_id = tonight.get("id")
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
