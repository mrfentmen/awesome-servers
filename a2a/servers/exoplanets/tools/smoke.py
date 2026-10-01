#!/usr/bin/env python3
"""End-to-end smoke test for the NASA Exoplanet Archive A2A server.

    EXOPLANETS_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/exoplanets/server.py --port 8814
    python3 servers/exoplanets/tools/smoke.py --base http://127.0.0.1:8814

TAP runs ad-hoc SELECTs, so a cold first query and a full-table read are slower
than a plain JSON API and each live call here is given a longer timeout.
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

DATASET = "exoplanetarchive.ipac.caltech.edu/TAP/sync"
#: A real planet in a real seven-planet system, and a real directly-imaged planet.
TRAPPIST = "TRAPPIST-1"
#: A pulsar-timing planet: the archive publishes its period and mass but no
#: radius and no equilibrium temperature, so it is the blank-value case.
PSR = "PSR J1719-1438 b"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def result_text(response: dict) -> str:
    message = (response.get("status") or {}).get("message") or {}
    return "\n".join(part.get("text", "") for part in message.get("parts") or [])


def unreadable(response: dict) -> bool:
    """True when the archive could not be read at all."""
    return "could not be read" in result_text(response)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the Exoplanet Archive A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8814")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "NASA Exoplanet Archive Agent",
        ["planet-lookup", "system-planets", "planet-search", "planet-extremes", "catalogue-survey"],
    ):
        return 1

    # Live: one planet, with the real published values.
    planet = smoke.rpc("message/send",
                       {"message": smoke.user_message(f"look up {TRAPPIST} e")},
                       timeout=120).get("result", {})
    planet_data = artifact_data(planet)
    found = planet_data.get("planet") or {}
    if unreadable(planet):
        smoke.check("the Exoplanet Archive answered", False, result_text(planet)[:160])
        return smoke.finish()
    smoke.check("planet-lookup completes", planet.get("status", {}).get("state") == "completed")
    smoke.check("the planet is the one asked for", found.get("planet") == "TRAPPIST-1 e",
                str(found.get("planet")))
    smoke.check("its host is reported", found.get("host") == TRAPPIST, str(found.get("host")))
    # TRAPPIST-1 e is a 6.101 day orbit of a 0.92 Earth-radii planet. A unit slip
    # in the archive's own columns would still print a number, so check the value.
    smoke.check("orbital period is the published 6.101 day",
                abs((found.get("orbital_period_days") or 0) - 6.101) < 0.01,
                str(found.get("orbital_period_days")))
    smoke.check("radius is the published 0.92 Earth radii",
                abs((found.get("radius_earth") or 0) - 0.92) < 0.01,
                str(found.get("radius_earth")))
    smoke.check("the host star's spectral type is reported", bool(found.get("star_spectral_type")),
                str(found.get("star_spectral_type")))
    smoke.check("the discovery method is reported", bool(found.get("discovery_method")),
                str(found.get("discovery_method")))
    smoke.check("planet-lookup cites the dataset", planet_data.get("dataset") == DATASET)

    # Live: an unpublished value must read as not published, never as zero.
    blank = smoke.rpc("message/send",
                      {"message": smoke.user_message(f"look up {PSR}")},
                      timeout=120).get("result", {})
    blank_planet = artifact_data(blank).get("planet") or {}
    smoke.check("the pulsar planet is found", blank_planet.get("planet") == PSR,
                str(blank_planet.get("planet")))
    smoke.check("its unpublished radius is None, not 0", blank_planet.get("radius_earth") is None,
                str(blank_planet.get("radius_earth")))
    smoke.check("its unpublished temperature is None, not 0",
                blank_planet.get("temperature_k") is None, str(blank_planet.get("temperature_k")))
    smoke.check("its published period is still reported",
                blank_planet.get("orbital_period_days") is not None,
                str(blank_planet.get("orbital_period_days")))
    smoke.check("the answer says not published", "not published" in result_text(blank))

    # Live: a whole system, which has to be the seven TRAPPIST-1 planets.
    system = smoke.rpc("message/send",
                       {"message": smoke.user_message(f"what planets orbit {TRAPPIST}?")},
                       timeout=120).get("result", {})
    system_data = artifact_data(system)
    planets = system_data.get("planets") or []
    smoke.check("system-planets completes", system.get("status", {}).get("state") == "completed")
    smoke.check("TRAPPIST-1 has seven known planets", system_data.get("count") == 7,
                str(system_data.get("count")))
    if len(planets) >= 2:
        # sy_pnum is the system's planet count, not the letter, so order by letter.
        letters = [p.get("planet_letter") for p in planets]
        smoke.check("the planets are in letter order", letters == sorted(letters), str(letters))
        smoke.check("sy_pnum is reported as a system count, not a letter",
                    all(p.get("planets_in_system") == 7 for p in planets),
                    str([p.get("planets_in_system") for p in planets[:3]]))
        smoke.check("every planet has an orbital period",
                    all(p.get("orbital_period_days") for p in planets))

    # Live: a discovery-year search.
    search = smoke.rpc("message/send",
                       {"message": smoke.user_message("which planets were discovered in 2016-2016?")},
                       timeout=120).get("result", {})
    search_data = artifact_data(search)
    smoke.check("planet-search completes", search.get("status", {}).get("state") == "completed")
    smoke.check("the search returns planets", (search_data.get("matched") or 0) > 0,
                str(search_data.get("matched")))
    if search_data.get("planets"):
        years = [p.get("discovery_year") for p in search_data["planets"]]
        smoke.check("every hit is from the year asked for", all(y == 2016 for y in years),
                    str(years[:5]))

    # Live: the extremes. The largest planet in the archive is a directly-imaged
    # one, and a broken row cap would return some other planet entirely.
    extremes = smoke.rpc("message/send",
                         {"message": smoke.user_message("what is the largest exoplanet?")},
                         timeout=120).get("result", {})
    extremes_data = artifact_data(extremes)
    rows = extremes_data.get("planets") or []
    smoke.check("planet-extremes completes", extremes.get("status", {}).get("state") == "completed")
    smoke.check("extremes are returned", len(rows) > 0, str(len(rows)))
    if rows:
        smoke.check("the leader has a published radius", rows[0].get("radius_earth") is not None,
                    str(rows[0].get("radius_earth")))
        smoke.check("the radii descend",
                    [r.get("radius_earth") for r in rows]
                    == sorted([r.get("radius_earth") or 0 for r in rows], reverse=True),
                    str([r.get("radius_earth") for r in rows[:3]]))
    nearest = smoke.rpc("message/send",
                        {"message": smoke.user_message("the closest planet to us")},
                        timeout=120).get("result", {})
    close = artifact_data(nearest).get("planets") or []
    smoke.check("the nearest planet has a published distance",
                bool(close) and close[0].get("distance_pc") is not None,
                str(close[0].get("distance_pc") if close else None))
    if len(close) > 1:
        smoke.check("the distances ascend", [r.get("distance_pc") for r in close]
                    == sorted([r.get("distance_pc") or 0 for r in close]),
                    str([r.get("distance_pc") for r in close[:3]]))

    # The premium skill: without a key the refusal is a completed answer with no
    # counts invented.
    survey = smoke.rpc("message/send",
                       {"message": smoke.user_message("give me an overview of the exoplanet catalogue")}
                       ).get("result", {})
    survey_data = artifact_data(survey)
    smoke.check("catalogue-survey never returns a fabricated survey",
                survey_data.get("by_decade") is None and survey_data.get("premium") is True,
                str({k: survey_data.get(k) for k in ("premium", "reason", "by_decade")}))
    smoke.check("catalogue-survey is answered, not crashed",
                survey.get("status", {}).get("state") in ("completed", "failed"),
                str(survey.get("status", {}).get("state")))

    # Streaming.
    events = smoke.stream("message/stream",
                          {"message": smoke.user_message(f"look up {TRAPPIST} e")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"],
                str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final", bool(events[-1].get("final"))
                and events[-1].get("status", {}).get("state") == "completed")

    # Push config CRUD, on a task that exists.
    task_id = planet.get("id")
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
