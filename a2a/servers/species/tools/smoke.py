#!/usr/bin/env python3
"""End-to-end smoke test for the iNaturalist Species A2A server.

    SPECIES_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/species/server.py --port 8815
    python3 servers/species/tools/smoke.py --base http://127.0.0.1:8815

Every read here is live against api.inaturalist.org. The counts move as people
upload, so the checks assert relationships the feed must satisfy (a grade-filtered
count is smaller than the unfiltered one; a row carries a grade) rather than
fixed totals.
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

DATASET = "api.inaturalist.org/v1/observations"
#: A species with hundreds of thousands of records, so a count is never empty.
MONARCH = "monarch butterflies"
SCIENTIFIC = "Danaus plexippus"
#: Bryant Park, New York: dense with observers, so a 5 km window is never quiet.
MANHATTAN = "40.7527,-73.9832"
#: A common name whose taxon is unmistakable.
FOX = "red fox"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def result_text(response: dict) -> str:
    message = (response.get("status") or {}).get("message") or {}
    return "\n".join(part.get("text", "") for part in message.get("parts") or [])


def unreadable(response: dict) -> bool:
    """True when iNaturalist could not be read at all."""
    return "could not be read" in result_text(response)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the Species A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8815")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "iNaturalist Species Agent",
        ["species-count", "recent-sightings", "nearby-observations", "species-info", "range-survey"],
    ):
        return 1

    # Live: a count at every grade, and the same count at research grade only.
    counted = smoke.rpc("message/send",
                        {"message": smoke.user_message(f"how many {MONARCH} are there?")},
                        timeout=60).get("result", {})
    if unreadable(counted):
        smoke.check("iNaturalist answered", False, result_text(counted)[:160])
        return smoke.finish()
    counted_data = artifact_data(counted)
    total = counted_data.get("total")
    smoke.check("species-count completes", counted.get("status", {}).get("state") == "completed")
    smoke.check("a count came back", isinstance(total, int) and total > 0, str(total))
    smoke.check("the answer says which grade it counted",
                "at any grade" in result_text(counted))
    smoke.check("species-count cites the dataset", counted_data.get("dataset") == DATASET)

    graded = smoke.rpc("message/send",
                       {"message": smoke.user_message(
                           f"research grade {SCIENTIFIC} observations")},
                       timeout=60).get("result", {})
    graded_data = artifact_data(graded)
    research_total = graded_data.get("total")
    smoke.check("a research-grade count came back",
                isinstance(research_total, int) and research_total > 0, str(research_total))
    smoke.check("the research count is smaller than the any-grade count",
                isinstance(research_total, int) and isinstance(total, int)
                and research_total < total,
                f"research={research_total} any={total}")

    # Live: recent sightings, and every row has to carry its own grade.
    recent = smoke.rpc("message/send",
                       {"message": smoke.user_message(f"recent sightings of {SCIENTIFIC}")},
                       timeout=60).get("result", {})
    recent_data = artifact_data(recent)
    rows = recent_data.get("rows") or []
    smoke.check("recent-sightings completes", recent.get("status", {}).get("state") == "completed")
    smoke.check("sightings came back", len(rows) > 0, str(len(rows)))
    if rows:
        smoke.check("every row carries a grade", all(row.get("quality_grade") for row in rows),
                    str([row.get("quality_grade") for row in rows[:3]]))
        smoke.check("every row names its taxon", all(row.get("taxon") for row in rows),
                    str([row.get("taxon") for row in rows[:3]]))
        smoke.check("every row carries an observation date",
                    all(row.get("observed_on") for row in rows),
                    str([row.get("observed_on") for row in rows[:3]]))

    # Live: what is around a point. Positions iNaturalist obscured must be
    # flagged rather than passed off as the real place.
    nearby = smoke.rpc("message/send",
                       {"message": smoke.user_message(
                           f"what has been seen near {MANHATTAN} within 5 km?")},
                       timeout=60).get("result", {})
    nearby_data = artifact_data(nearby)
    near_rows = nearby_data.get("rows") or []
    smoke.check("nearby-observations completes",
                nearby.get("status", {}).get("state") == "completed")
    smoke.check("the point was read as given", nearby_data.get("point") == MANHATTAN,
                str(nearby_data.get("point")))
    smoke.check("the radius was read as given", nearby_data.get("radius_km") == 5,
                str(nearby_data.get("radius_km")))
    smoke.check("records came back for a dense window", len(near_rows) > 0, str(len(near_rows)))
    smoke.check("every row states whether its position was obscured",
                all("coordinates_obscured" in row for row in near_rows),
                str([row.get("coordinates_obscured") for row in near_rows[:3]]))

    # Live: one taxon's own record, which has to resolve a common name.
    info = smoke.rpc("message/send",
                     {"message": smoke.user_message(f"what is a {FOX}?")},
                     timeout=60).get("result", {})
    info_data = artifact_data(info)
    smoke.check("species-info completes", info.get("status", {}).get("state") == "completed")
    smoke.check("a common name resolved to its scientific one",
                info_data.get("taxon") == "Vulpes vulpes", str(info_data.get("taxon")))
    smoke.check("the rank is reported", info_data.get("rank") == "species",
                str(info_data.get("rank")))
    smoke.check("the observation count is reported",
                isinstance(info_data.get("observations_count"), int)
                and info_data["observations_count"] > 0,
                str(info_data.get("observations_count")))

    # The premium skill: without a key the refusal is a completed answer with no
    # counts invented in the feed's shape.
    survey = smoke.rpc("message/send",
                       {"message": smoke.user_message(
                           f"give me an overview of the {MONARCH} records")},
                       timeout=60).get("result", {})
    survey_data = artifact_data(survey)
    smoke.check("range-survey never returns a fabricated survey",
                survey_data.get("by_month") is None and survey_data.get("premium") is True,
                str({k: survey_data.get(k) for k in ("premium", "reason", "by_month")}))
    smoke.check("range-survey is answered, not crashed",
                survey.get("status", {}).get("state") in ("completed", "failed"),
                str(survey.get("status", {}).get("state")))

    # Streaming.
    events = smoke.stream("message/stream",
                          {"message": smoke.user_message(f"recent sightings of {SCIENTIFIC}")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"],
                str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final", bool(events[-1].get("final"))
                and events[-1].get("status", {}).get("state") == "completed")

    # Push config CRUD, on a task that exists.
    task_id = counted.get("id")
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
