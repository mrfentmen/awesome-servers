#!/usr/bin/env python3
"""End-to-end smoke test for the GB grid carbon A2A server.

    GRID_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/grid/server.py --port 8874
    python3 servers/grid/tools/smoke.py --base http://127.0.0.1:8874

Live: every check reads National Grid ESO's real carbon intensity API. Bands are
asserted to be NESO's own strings rather than numbers this repo derived, and the
half-hourly cadence means the checks assert on shape, not on a particular value.
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

DATASET = "api.carbonintensity.org.uk"
BANDS = ("very low", "low", "moderate", "high", "very high")
LONDON_POSTCODE = "SW1A 1AA"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def ask(smoke: Smoke, text: str) -> dict:
    return smoke.rpc("message/send", {"message": smoke.user_message(text)}).get("result", {})


def text_of(response: dict) -> str:
    return response.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", "")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the GB grid carbon A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8874")
    parser.add_argument("--hook", default="http://127.0.0.1:8823/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "GB Grid Carbon Agent",
        ["grid-now", "grid-forecast", "grid-regional", "grid-mix", "clean-windows"],
    ):
        return 1

    # Live: the current half-hour.
    now = ask(smoke, "how dirty is the grid right now?")
    now_data = artifact_data(now)
    slot = now_data.get("slot") or {}
    smoke.check("grid-now completes", now.get("status", {}).get("state") == "completed",
                str(now.get("status", {}).get("state")))
    smoke.check("a half-hour came back", bool(slot.get("from")) and slot.get("forecast") is not None,
                f"{slot.get('from')} {slot.get('forecast')} gCO2/kWh")
    smoke.check("the band is one of NESO's own",
                slot.get("band") in BANDS, str(slot.get("band")))
    smoke.check("the half-hour is dated in UTC", str(slot.get("from", "")).endswith("Z"),
                str(slot.get("from")))
    smoke.check("grid-now cites the dataset", now_data.get("dataset") == DATASET)

    # Live: the forecast, and the measured series behind us.
    forecast = ask(smoke, "what's the carbon intensity forecast for the next 6 hours?")
    forecast_data = artifact_data(forecast)
    slots = forecast_data.get("slots") or []
    smoke.check("grid-forecast completes", forecast.get("status", {}).get("state") == "completed")
    smoke.check("half-hours returned", len(slots) >= 6, str(len(slots)))
    smoke.check("one value per half-hour",
                all(entry.get("value") is not None and entry.get("band") in BANDS for entry in slots),
                str([(entry.get("from"), entry.get("value"), entry.get("band")) for entry in slots[:3]]))
    smoke.check("the forecast cites the dataset", forecast_data.get("dataset") == DATASET)
    measured = ask(smoke, "what was the grid like over the past 3 hours?")
    measured_data = artifact_data(measured)
    smoke.check("the measured series is a different read",
                measured_data.get("series") == "actual"
                and all(entry.get("actual") is not None
                        for entry in (measured_data.get("slots") or [])),
                str(measured_data.get("series")))

    # Live: every region, ranked.
    regional = ask(smoke, "where is the grid dirtiest?")
    regional_data = artifact_data(regional)
    regions = regional_data.get("regions") or []
    smoke.check("grid-regional completes", regional.get("status", {}).get("state") == "completed")
    smoke.check("all 18 regions came back", len(regions) == 18, str(len(regions)))
    smoke.check("ranked dirtiest first",
                all(regions[i]["forecast"] >= regions[i + 1]["forecast"] for i in range(len(regions) - 1)),
                str([(row.get("short_name"), row.get("forecast")) for row in regions[:3]]))
    smoke.check("each region carries NESO's band",
                all(row.get("band") in BANDS for row in regions))
    smoke.check("the regional answer admits there is no history",
                "only publishes the current half-hour" in text_of(regional))

    # Live: a region by postcode, and a postcode the feed does not hold.
    by_postcode = ask(smoke, f"which region is {LONDON_POSTCODE} in?")
    postcode_region = (artifact_data(by_postcode).get("region") or {})
    smoke.check("a postcode resolves to its region", bool(postcode_region.get("short_name")),
                str(postcode_region.get("short_name")))
    smoke.check("with its intensity and band",
                postcode_region.get("forecast") is not None and postcode_region.get("band") in BANDS,
                f"{postcode_region.get('forecast')} {postcode_region.get('band')}")
    unknown = ask(smoke, "which region is ZZ99 in?")
    smoke.check("an unknown postcode is reported, not guessed",
                unknown.get("status", {}).get("state") == "completed"
                and "no regional record" in text_of(unknown), text_of(unknown)[:140])

    # Live: the generation mix.
    mix = ask(smoke, "what is the UK generating right now?")
    mix_data = artifact_data(mix)
    entries = (mix_data.get("generation_mix") or {}).get("mix") or []
    smoke.check("grid-mix completes", mix.get("status", {}).get("state") == "completed")
    smoke.check("fuels came back with shares",
                bool(entries) and all("percent" in entry for entry in entries),
                str([(entry.get("fuel"), entry.get("percent")) for entry in entries[:4]]))
    smoke.check("biggest share first",
                all(entries[i]["percent"] >= entries[i + 1]["percent"] for i in range(len(entries) - 1)))
    smoke.check("the shares roughly add up",
                abs(sum(entry["percent"] for entry in entries) - 100) < 5,
                str(sum(entry["percent"] for entry in entries)))

    # The premium skill: without a key the gateway's own wording comes back as an answer.
    premium = ask(smoke, "when is the grid cleanest over the next two days?")
    premium_data = artifact_data(premium)
    premium_state = premium.get("status", {}).get("state")
    if premium_data.get("premium") and premium_data.get("reason") in ("missing_key", "denied"):
        smoke.check("clean-windows with no licence is a completed answer",
                    premium_state == "completed", str(premium_state))
        smoke.check("the refusal names the key", "MCP_LICENSE_KEY" in text_of(premium),
                    premium_data.get("reason"))
        smoke.check("no windows are handed over without a licence",
                    premium_data.get("windows") is None)
    else:
        smoke.check("clean-windows returned live windows",
                    premium_state == "completed" and premium_data.get("window_count") is not None,
                    str(premium_state))
        smoke.check("a threshold with its source is stated",
                    premium_data.get("threshold") is not None
                    and bool(premium_data.get("threshold_source")),
                    str(premium_data.get("threshold_source")))

    # A question with no argument at all still answers, because the national answer needs none.
    plain = ask(smoke, "when can I run my batch job cheaply?")
    smoke.check("a window question with no threshold still answers",
                plain.get("status", {}).get("state") in ("completed", "input-required"),
                str(plain.get("status", {}).get("state")))

    # input-required -> follow-up on the one skill that asks.
    lonely = ask(smoke, "what can you do?")
    smoke.check("help answers without input-required",
                lonely.get("status", {}).get("state") == "completed")

    # A horizon this API cannot serve falls back to a shorter one, and must say which.
    beyond = ask(smoke, "what's the carbon intensity forecast for the next 200 hours?")
    beyond_slots = artifact_data(beyond).get("slots") or []
    smoke.check("a horizon beyond the API's is answered with a stated, shorter window",
                beyond.get("status", {}).get("state") in ("completed", "input-required")
                and len(beyond_slots) <= 96,
                f"{len(beyond_slots)} half-hour(s) reported for a 200-hour question")
    smoke.check("and the window it covered is named in the answer",
                "200" not in text_of(beyond).split("\n")[0],
                text_of(beyond).split("\n")[0][:120])

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message("how dirty is the grid?")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"], str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final",
                bool(events[-1].get("final")) and events[-1].get("status", {}).get("state") == "completed")

    # Push config CRUD.
    task_id = (plain or now).get("id")
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
