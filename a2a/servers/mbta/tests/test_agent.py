"""Tests for the MBTA server.

    python3 servers/mbta/tests/test_agent.py
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)


from agent import (  # noqa: E402
    CARD_SKILLS,
    SKILL_HEADWAY_CHECK,
    MbtaAgent,
    parse,
    route_from_text,
)
from data import (  # noqa: E402
    DATASET,
    MAX_ARRIVALS,
    MbtaClient,
    haversine_km,
    relative_minutes,
)

ROUTE_RED = {
    "id": "Red",
    "type": "route",
    "attributes": {"long_name": "Red Line", "color": "DA291C", "text_color": "FFFFFF",
                   "description": "Rapid Transit", "direction_names": ["South", "North"],
                   "direction_destinations": ["Ashmont/Braintree", "Alewife"],
                   "listed_route": True},
}
ROUTE_66 = {
    "id": "66",
    "type": "route",
    "attributes": {"long_name": "66 Harvard-Cambridge via MIT", "color": "D71E08",
                   "text_color": "FFFFFF", "description": "Bus",
                   "direction_names": ["Westbound", "Eastbound"],
                   "direction_destinations": ["Harvard Square", "Harvard Square"],
                   "listed_route": True},
}

ARRIVALS = [
    {"id": "prediction-1", "type": "prediction",
     "attributes": {"arrival_time": "2026-09-28T22:57:34-04:00", "arrival_uncertainty": 60,
                    "direction_id": 0, "trip_headsign": None, "revenue": "REVENUE"},
     "relationships": {"route": {"data": {"id": "Red", "type": "route"}}}},
    {"id": "prediction-2", "type": "prediction",
     "attributes": {"arrival_time": "2026-09-28T23:02:28-04:00", "arrival_uncertainty": 360,
                    "direction_id": 1, "trip_headsign": None, "revenue": "REVENUE"},
     "relationships": {"route": {"data": {"id": "Red", "type": "route"}}}},
]

SCHEDULE_ROWS = [
    {"id": "schedule-1", "type": "schedule",
     "attributes": {"arrival_time": "2026-09-28T23:10:00-04:00", "direction_id": 0},
     "relationships": {"route": {"data": {"id": "Red", "type": "route"}}}},
    {"id": "schedule-2", "type": "schedule",
     "attributes": {"arrival_time": "2026-09-28T23:20:00-04:00", "direction_id": 1},
     "relationships": {"route": {"data": {"id": "66", "type": "route"}}}},
]

STOPS_NEAR = [
    {"id": "6555", "type": "stop",
     "attributes": {"name": "Chinatown Gate", "municipality": "Boston", "latitude": 42.35068,
                    "longitude": -71.059655, "location_type": 0, "platform_name": None,
                    "description": None, "wheelchair_boarding": 1, "at_street": "Beach Street",
                    "on_street": "Surface Artery"}},
    {"id": "70068", "type": "stop",
     "attributes": {"name": "Harvard Ave @ Beacon St", "municipality": "Boston",
                    "latitude": 42.35121, "longitude": -71.08313, "location_type": 0,
                    "platform_name": None, "description": None, "wheelchair_boarding": 0,
                    "at_street": "Harvard Ave", "on_street": "Beacon St"}},
]

STOP_PKTRM = {"id": "place-pktrm", "type": "stop",
              "attributes": {"name": "Kendall/GIT", "municipality": "Cambridge",
                             "latitude": 42.3563946, "longitude": -71.0624242,
                             "location_type": 1, "platform_name": None, "description": None,
                             "wheelchair_boarding": 1, "at_street": None, "on_street": None}}

ALERTS = [
    {"id": "alert-1", "type": "alert",
     "attributes": {"header": "Due to construction, the Savin Hill staircase is out of service.",
                    "short_header": "", "description": "long text", "severity": 7,
                    "cause": "UNKNOWN_CAUSE", "effect": "STATION_ISSUE",
                    "service_effect": "Station issue at Savin Hill", "lifecycle": "ONGOING",
                    "timeframe": "ongoing", "duration_certainty": "UNKNOWN", "url": None,
                    "created_at": "2026-09-15T17:29:28-04:00", "updated_at": "2026-09-15T17:30:13-04:00",
                    "active_period": [{"start": "2026-09-15T17:29:00-04:00", "end": None}],
                    "informed_entity": [{"stop": "place-shmnl", "route": "Red", "route_type": 1,
                                         "activities": ["BOARD"]}]}},
    {"id": "alert-2", "type": "alert",
     "attributes": {"header": "Elevator outage", "short_header": "", "description": "d",
                    "severity": 1, "cause": "EQUIPMENT_FAILURE", "effect": "NO_SERVICE",
                    "service_effect": "No elevator service", "lifecycle": "ONGOING",
                    "timeframe": "ongoing", "duration_certainty": "UNKNOWN", "url": None,
                    "created_at": "2026-09-16T08:00:00-04:00", "updated_at": "2026-09-16T08:00:00-04:00",
                    "active_period": [], "informed_entity": [{"stop": "70068", "route": "66",
                                                              "route_type": 3, "activities": []}]}},
]


def flatten_alert(record):
    """One raw alert record in the shape MbtaClient.alerts hands back."""
    attributes = record["attributes"]
    return {
        "id": record["id"],
        **{key: attributes.get(key) for key in
           ("header", "short_header", "description", "cause", "effect", "service_effect",
            "lifecycle", "timeframe", "duration_certainty", "url", "created_at", "updated_at",
            "active_period")},
        "severity": attributes.get("severity"),
        "severity_label": {1: "severe", 7: "info"}.get(attributes.get("severity"), "not reported"),
        "routes": sorted({entity["route"] for entity in attributes.get("informed_entity", [])}),
        "stops": sorted({entity["stop"] for entity in attributes.get("informed_entity", [])}),
    }


def _no_network(*args, **kwargs):
    raise AssertionError("FakeMbta must not touch the network")


class FakeMbta(MbtaClient):
    """Same interface as MbtaClient, no network. Derived helpers stay real."""

    def __init__(self, arrivals=ARRIVALS, schedule=SCHEDULE_ROWS, stops=STOPS_NEAR,
                 alerts=ALERTS, info=None, routes=None) -> None:
        super().__init__(fetch=_no_network)
        self.arrivals = list(arrivals)
        self.schedule = list(schedule)
        self.stops = list(stops)
        self.alert_rows = [flatten_alert(record) for record in alerts]
        self.info = info if info is not None else {"stop": "place-pktrm", **STOP_PKTRM["attributes"]}
        self.routes = {"Red": ROUTE_RED["attributes"], "66": ROUTE_66["attributes"]} if routes is None \
            else dict(routes)
        self.reads = []

    def predictions(self, stop, route=None, direction_id=None, limit=10):
        self.reads.append(("predictions", stop, route, direction_id, limit))
        return [dict(arrival) for arrival in self.arrivals]

    def schedules(self, stop, limit=10, date=None):
        self.reads.append(("schedules", stop, limit, date))
        return [dict(row) for row in self.schedule]

    def nearby_stops(self, point, limit=10, route=None):
        self.reads.append(("nearby", point, route, limit))
        return [dict(stop) for stop in self.stops][:limit]

    def alerts(self, route=None, stop=None, limit=10):
        self.reads.append(("alerts", route, stop, limit))
        rows = self.alert_rows
        if route:
            rows = [row for row in rows if route in row.get("routes", [])]
        if stop:
            rows = [row for row in rows if stop in row.get("stops", [])]
        return [dict(row) for row in rows][:limit]

    def stop_info(self, stop):
        self.reads.append(("stop", stop))
        return dict(self.info) if self.info else None

    def route_list(self):
        return dict(self.routes)


def fetch_from(payloads, calls=None):
    """A JsonApiClient `fetch` that dispatches on path, so data.py runs for real."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        for needle, key in (("/predictions", "predictions"), ("/schedules", "schedules"),
                            ("/alerts", "alerts"), ("/routes", "routes"),
                            ("/stops/", "stop"), ("/stops", "stops")):
            if needle in url:
                payload = payloads.get(key)
                if callable(payload):
                    return payload(params)
                return payload
        raise AssertionError(f"unexpected url {url}")

    return fetch


def prediction_row(when, route="Red", direction=0, uncertainty=60, headsign=None):
    return {
        "id": f"prediction-{when}",
        "type": "prediction",
        "attributes": {"arrival_time": when, "arrival_uncertainty": uncertainty,
                       "direction_id": direction, "trip_headsign": headsign, "revenue": "REVENUE"},
        "relationships": {"route": {"data": {"id": route, "type": "route"}}},
    }


class ValidationTests(unittest.TestCase):
    def test_check_stop(self):
        self.assertEqual(MbtaClient.check_stop(" place-pktrm "), "place-pktrm")
        for bad in ("Kendall/GIT", "", "place pktrm", "a" * 41):
            with self.assertRaises(ValueError):
                MbtaClient.check_stop(bad)

    def test_check_route_direction_limit(self):
        self.assertEqual(MbtaClient.check_route(" Red "), "Red")
        with self.assertRaises(ValueError):
            MbtaClient.check_route("Red Line!!")
        self.assertEqual(MbtaClient.check_direction("1"), 1)
        self.assertIsNone(MbtaClient.check_direction(None))
        with self.assertRaises(ValueError):
            MbtaClient.check_direction(2)
        self.assertEqual(MbtaClient.check_limit("3"), 3)
        with self.assertRaises(ValueError):
            MbtaClient.check_limit(str(MAX_ARRIVALS + 1))

    def test_check_point(self):
        self.assertEqual(MbtaClient.check_point("42.3519, -71.0601"), (42.3519, -71.0601))
        with self.assertRaises(ValueError):
            MbtaClient.check_point("91.0,-71.0")
        with self.assertRaises(ValueError):
            MbtaClient.check_point("downtown")

    def test_haversine_and_minutes(self):
        self.assertAlmostEqual(haversine_km(42.35, -71.06, 42.35, -71.06), 0.0, places=6)
        self.assertGreater(haversine_km(42.3564, -71.0624, 42.3512, -71.0831), 1.5)
        self.assertEqual(relative_minutes(__import__("datetime").datetime(
            2026, 9, 28, 23, 0, tzinfo=__import__("datetime").timezone.utc),
            __import__("datetime").datetime(2026, 9, 28, 22, 30, tzinfo=__import__("datetime").timezone.utc)), 30)
        self.assertEqual(relative_minutes(__import__("datetime").datetime(
            2020, 1, 1, tzinfo=__import__("datetime").timezone.utc)), 0)


class ReaderTests(unittest.TestCase):
    def test_predictions_sort_and_shape(self):
        from datetime import datetime, timedelta, timezone

        now = datetime.now(timezone.utc)
        rows = [prediction_row((now + timedelta(minutes=20)).isoformat(), direction=0),
                prediction_row((now + timedelta(minutes=5)).isoformat(), direction=1),
                prediction_row((now + timedelta(minutes=90)).isoformat(), route="66")]
        calls = []
        payload = {"data": list(reversed(rows)), "included": [ROUTE_RED, ROUTE_66]}
        client = MbtaClient(fetch=fetch_from({"predictions": payload}, calls))
        arrivals = client.predictions("place-pktrm", limit=10)
        self.assertEqual([a["route"] for a in arrivals], ["Red", "Red", "66"])
        self.assertEqual(arrivals[0]["route_name"], "Red Line")
        self.assertEqual(arrivals[0]["direction"], "Alewife")
        self.assertEqual(arrivals[1]["direction"], "Ashmont/Braintree")
        self.assertEqual(arrivals[2]["direction"], "Harvard Square")
        self.assertEqual(arrivals[0]["minutes"], 4)
        url, params = calls[0]
        self.assertTrue(url.endswith("/predictions"))
        self.assertEqual(params["filter[stop]"], "place-pktrm")
        self.assertEqual(params["sort"], "arrival_time")
        self.assertEqual(params["include"], "route")

    def test_predictions_drops_stale_rows_and_filters(self):
        calls = []
        payload = {"data": [prediction_row("2026-09-28T06:00:00-04:00")], "included": [ROUTE_RED]}
        client = MbtaClient(fetch=fetch_from({"predictions": payload}, calls))
        self.assertEqual(client.predictions("place-pktrm"), [])
        client.predictions("place-pktrm", route="Red", direction_id=1)
        self.assertEqual(calls[-1][1]["filter[route]"], "Red")
        self.assertEqual(calls[-1][1]["filter[direction_id]"], 1)

    def test_error_array_becomes_an_upstream_error(self):
        from a2a_kit import UpstreamError

        payload = {"errors": [{"status": "400", "title": "Bad Request",
                               "detail": "`filter[stop]` is invalid"}]}
        client = MbtaClient(fetch=fetch_from({"predictions": payload}))
        with self.assertRaises(UpstreamError) as caught:
            client.predictions("place-pktrm")
        self.assertIn("filter[stop]", str(caught.exception))

    def test_schedules_and_stop_info(self):
        from datetime import datetime, timedelta, timezone

        now = datetime.now(timezone.utc)
        rows = [{"id": "schedule-1", "type": "schedule",
                 "attributes": {"arrival_time": (now + timedelta(minutes=15)).isoformat(),
                                "direction_id": 0},
                 "relationships": {"route": {"data": {"id": "Red", "type": "route"}}}},
                {"id": "schedule-old", "type": "schedule",
                 "attributes": {"arrival_time": (now - timedelta(hours=2)).isoformat(),
                                "direction_id": 0},
                 "relationships": {"route": {"data": {"id": "Red", "type": "route"}}}}]
        payload = {"data": rows, "included": [ROUTE_RED]}
        client = MbtaClient(fetch=fetch_from({"schedules": payload}))
        upcoming = client.schedules("place-pktrm")
        self.assertEqual(len(upcoming), 1)
        self.assertEqual(upcoming[0]["route_name"], "Red Line")

        client = MbtaClient(fetch=fetch_from({"stop": {"data": [STOP_PKTRM]}}))
        info = client.stop_info("place-pktrm")
        self.assertEqual(info["name"], "Kendall/GIT")
        self.assertEqual(info["municipality"], "Cambridge")

    def test_nearby_stops_compute_distance(self):
        client = MbtaClient(fetch=fetch_from({"stops": {"data": STOPS_NEAR}}))
        stops = client.nearby_stops("42.3519,-71.0601", limit=2)
        self.assertEqual([stop["stop"] for stop in stops], ["6555", "70068"])
        self.assertLess(stops[0]["distance_km"], stops[1]["distance_km"])
        self.assertEqual(stops[0]["name"], "Chinatown Gate")

    def test_alerts_derive_severity_and_routes(self):
        client = MbtaClient(fetch=fetch_from({"alerts": {"data": ALERTS}}))
        alerts = client.alerts()
        self.assertEqual(alerts[0]["severity_label"], "info")
        self.assertEqual(alerts[1]["severity_label"], "severe")
        self.assertEqual(alerts[0]["routes"], ["Red"])
        self.assertEqual(alerts[0]["stops"], ["place-shmnl"])
        # A route filter is the feed's job, not ours: the id goes out on the query.
        calls = []
        client = MbtaClient(fetch=fetch_from({"alerts": {"data": ALERTS}}, calls))
        client.alerts(route="66", stop="70068", limit=5)
        self.assertEqual(calls[0][1]["filter[route]"], "66")
        self.assertEqual(calls[0][1]["filter[stop]"], "70068")
        self.assertEqual(calls[0][1]["page[limit]"], 5)

    def test_find_route_matches_names(self):
        client = MbtaClient(fetch=fetch_from({"routes": {"data": [ROUTE_RED, ROUTE_66]}}))
        self.assertEqual(client.find_route("Red"), "Red")
        self.assertEqual(client.find_route("red line"), "Red")
        self.assertEqual(client.find_route("Harvard"), "66")
        self.assertIsNone(client.find_route("Purple"))


class ParseTests(unittest.TestCase):
    def message(self, text):
        return {"parts": [{"kind": "text", "text": text}]}

    def test_default_is_next_departures(self):
        self.assertEqual(parse(self.message("when is the next train from place-pktrm?"))["skill"],
                         "next-departures")

    def test_stop_point_and_limit(self):
        request = parse(self.message("next 3 trains from place-pktrm"))
        self.assertEqual(request["params"]["stop"], "place-pktrm")
        self.assertEqual(request["params"]["limit"], "3")

    def test_timetable_words_route_to_stop_times(self):
        self.assertEqual(parse(self.message("what's the timetable at place-pktrm today?"))["skill"],
                         "stop-times")
        self.assertEqual(parse(self.message("scheduled departures from 70068"))["skill"], "stop-times")

    def test_nearby_needs_a_point(self):
        request = parse(self.message("which mbta stops are near 42.3519,-71.0601?"))
        self.assertEqual(request["skill"], "nearby-stops")
        self.assertEqual(request["params"]["point"], "42.3519,-71.0601")
        self.assertEqual(parse(self.message("next train from place-pktrm"))["skill"], "next-departures")

    def test_route_alerts_take_a_line_name(self):
        request = parse(self.message("any alerts on the Red Line?"))
        self.assertEqual(request["skill"], "route-alerts")
        self.assertEqual(request["params"]["route"], "Red Line")

    def test_network_alerts_beat_a_line_mention(self):
        request = parse(self.message("how is the T running right now?"))
        self.assertEqual(request["skill"], "service-alerts")
        request = parse(self.message("any disruptions across the whole network?"))
        self.assertEqual(request["skill"], "service-alerts")

    def test_alerts_with_no_line_is_network(self):
        self.assertEqual(parse(self.message("are there any delays?"))["skill"], "service-alerts")


    def test_explicit_json_wins(self):
        message = {"parts": [{"kind": "text", "text": "anything"},
                             {"kind": "data", "data": {"skill": SKILL_HEADWAY_CHECK,
                                                       "stop": "place-pktrm", "limit": 6}}]}
        request = parse(message)
        self.assertEqual(request["skill"], SKILL_HEADWAY_CHECK)
        self.assertEqual(request["params"]["limit"], 6)
        self.assertTrue(request["explicit"])

    def test_help_and_route_extraction(self):
        self.assertEqual(parse(self.message(""))["skill"], "help")
        self.assertEqual(parse(self.message("what can you do?"))["skill"], "help")
        self.assertEqual(route_from_text("next bus on route 66 from place-harsq"), "66")
        self.assertEqual(route_from_text("any alerts on the Red Line?"), "Red Line")
        self.assertIsNone(route_from_text("next train from place-pktrm"))


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, client=None, **params):
        agent = MbtaAgent(client=client or FakeMbta())
        return agent.run({"skill": skill, "params": params, "missing": agent.missing(skill, params)})

    def test_next_departures_reports_lines_and_minutes(self):
        from datetime import datetime, timedelta, timezone

        now = datetime.now(timezone.utc)
        arrivals = [{
            "at": (now + timedelta(minutes=6)).isoformat(),
            "route": "Red", "route_name": "Red Line", "color": "DA291C", "direction_id": 0,
            "direction": "Ashmont/Braintree", "uncertainty_minutes": 60, "minutes": 5,
        }]
        client = FakeMbta(arrivals=arrivals)
        result = self.run_skill("next-departures", client=client, stop="place-pktrm", limit=8)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Kendall/GIT", result["message"])
        self.assertIn("Red Line", result["message"])
        self.assertIn("Ashmont/Braintree", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertEqual(result["artifact"]["stop"], "place-pktrm")
        self.assertEqual(result["artifact"]["count"], 1)
        self.assertEqual(client.reads[0], ("predictions", "place-pktrm", None, None, 8))

    def test_next_departures_with_no_live_arrivals_points_at_the_timetable(self):
        result = self.run_skill("next-departures", client=FakeMbta(arrivals=[]), stop="place-pktrm")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("no live arrival", result["message"])
        self.assertIn("timetable", result["message"])

    def test_unknown_route_is_reported_not_guessed(self):
        result = self.run_skill("next-departures", client=FakeMbta(), stop="place-pktrm", route="Purple")
        self.assertIn("No MBTA line is called", result["message"])
        self.assertIsNone(result["artifact"]["resolved_route"])

    def test_stop_times_is_the_schedule(self):
        from datetime import datetime, timedelta, timezone

        now = datetime.now(timezone.utc)
        rows = [{"at": (now + timedelta(minutes=30)).isoformat(), "route_name": "Red Line",
                 "direction": "Alewife", "route": "Red"}]
        client = FakeMbta(schedule=rows)
        result = self.run_skill("stop-times", client=client, stop="70068")
        self.assertIn("for the rest of the day", result["message"])
        self.assertIn("Red Line", result["message"])
        self.assertEqual(result["artifact"]["count"], 1)
        self.assertEqual(result["artifact"]["service_day"], client.agency_today())
        self.assertIn(("schedules", "70068", 8, None), client.reads)

    def test_stop_times_rolls_over_to_the_next_service_day(self):
        """Nothing left today, so the answer is tomorrow's first departures."""
        from datetime import datetime, timedelta, timezone

        now = datetime.now(timezone.utc)
        rows = [{"at": (now + timedelta(hours=10)).isoformat(), "route_name": "Red Line",
                 "direction": "Alewife", "route": "Red"}]

        class ClosedTonight(FakeMbta):
            def schedules(self, stop, limit=10, date=None):
                self.reads.append(("schedules", stop, limit, date))
                # An undated request is today's service day, as the client resolves it.
                day = date or self.agency_today()
                return [] if day == self.agency_today() else [dict(row) for row in rows]

        client = ClosedTonight()
        result = self.run_skill("stop-times", client=client, stop="70068")
        self.assertIn("nothing is left today", result["message"])
        self.assertIn("Red Line", result["message"])
        self.assertEqual(result["artifact"]["service_day"], client.agency_tomorrow())
        # The first call is undated, which the client resolves to today's service day.
        self.assertEqual([read[3] for read in client.reads if read[0] == "schedules"],
                         [None, client.agency_tomorrow()])

    def test_stop_times_with_nothing_at_all_is_reported(self):
        result = self.run_skill("stop-times", client=FakeMbta(schedule=[]), stop="70068")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("no scheduled departure", result["message"])

    def test_stop_times_takes_a_named_day(self):
        client = FakeMbta(schedule=[])
        result = self.run_skill("stop-times", client=client, stop="70068", date="2026-09-30")
        self.assertIn("2026-09-30", result["message"])
        self.assertIn("no scheduled departure", result["message"])
        self.assertEqual([read[3] for read in client.reads if read[0] == "schedules"], ["2026-09-30"])

    def test_stop_times_rejects_a_bad_day(self):
        result = self.run_skill("stop-times", client=FakeMbta(), stop="70068", date="30-09-2026")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("YYYY-MM-DD", result["message"])

    def test_nearby_stops_lists_distances(self):
        stops = [
            {"stop": "6555", "name": "Chinatown Gate", "municipality": "Boston", "distance_km": 0.4},
            {"stop": "70068", "name": "Harvard Ave @ Beacon St", "municipality": "Boston",
             "distance_km": 1.8},
        ]
        result = self.run_skill("nearby-stops", client=FakeMbta(stops=stops),
                                point="42.3519,-71.0601", limit=5)
        self.assertIn("6555", result["message"])
        self.assertIn("0.4 km away", result["message"])
        self.assertEqual(result["artifact"]["count"], 2)

    def test_nearby_stops_needs_a_point(self):
        agent = MbtaAgent(client=FakeMbta())
        self.assertEqual(agent.missing("nearby-stops", {}), ["point"])
        result = agent.run({"skill": "nearby-stops", "params": {}, "missing": ["point"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("latitude/longitude", result["message"])

    def test_stop_skills_ask_for_a_stop(self):
        agent = MbtaAgent(client=FakeMbta())
        self.assertEqual(agent.missing("next-departures", {}), ["stop"])
        result = agent.run({"skill": "next-departures", "params": {}, "missing": ["stop"]})
        self.assertIn("place-pktrm", result["message"])

    def test_route_alerts_resolve_a_name(self):
        result = self.run_skill("route-alerts", client=FakeMbta(), route="Red Line")
        self.assertIn("Red Line", result["message"])
        self.assertIn("Station issue at Savin Hill", result["message"])
        self.assertEqual(result["artifact"]["route"], "Red")

    def test_route_alerts_when_the_line_is_clear(self):
        result = self.run_skill("route-alerts", client=FakeMbta(alerts=[]), route="Red")
        self.assertIn("no alert running", result["message"])

    def test_service_alerts_puts_severe_first(self):
        result = self.run_skill("service-alerts", client=FakeMbta())
        self.assertIn("2 MBTA alert(s)", result["message"])
        self.assertIn("1 severe", result["message"])
        self.assertLess(result["message"].index("[severe]"), result["message"].index("[info]"))

    def test_service_alerts_when_the_network_is_clear(self):
        result = self.run_skill("service-alerts", client=FakeMbta(alerts=[]))
        self.assertIn("no service alert running", result["message"])

    def test_help_does_not_touch_the_feed(self):
        result = self.run_skill("help")
        self.assertIn("MBTA", result["message"])
        self.assertIsNone(result["artifact"])

    def test_card_and_upstream_failure_is_a_failed_task(self):
        agent = MbtaAgent(client=FakeMbta())
        self.assertEqual([skill["id"] for skill in CARD_SKILLS],
                         ["next-departures", "stop-times", "nearby-stops", "route-alerts",
                          "service-alerts", "headway-check"])
        self.assertEqual(agent.env_prefix, "MBTA")
        self.assertEqual(agent.watch_kinds, ())

        from a2a_kit import UpstreamError

        class Broken(FakeMbta):
            def predictions(self, *args, **kwargs):
                raise UpstreamError("the MBTA request failed: HTTP 429")

        result = MbtaAgent(client=Broken()).run(
            {"skill": "next-departures", "params": {"stop": "place-pktrm"}, "missing": []})
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("429", result["message"])


#: Shape copied from a live gateway `a2a_mbta_headway` answer for place-pktrm.
HEADWAY_PAYLOAD = {
    "dataset": "api-v3.mbta.com",
    "product": "MBTA v3 real-time predictions",
    "source": "Massachusetts Bay Transportation Authority",
    "stop": "place-pktrm",
    "route": "Red",
    "direction_id": None,
    "generated_at": "2026-09-29T02:56:08.148Z",
    "arrivals_read": 9,
    "arrivals": [
        {"at": "2026-09-28T22:57:34-04:00", "route": "Red", "route_name": "Red Line",
         "direction_id": 0, "direction": "Ashmont/Braintree", "uncertainty_minutes": 60},
        {"at": "2026-09-28T23:02:28-04:00", "route": "Red", "route_name": "Red Line",
         "direction_id": 1, "direction": "Alewife", "uncertainty_minutes": 60},
    ],
    "headway_minutes": {"gaps": 8, "median": 3.2, "shortest": 0.9, "longest": 4.9,
                        "max_deviation_from_median": 2.3},
    "longest_wait": {"at": "2026-09-28T22:57:34-04:00", "minutes": 4.9,
                     "next_at": "2026-09-28T23:02:28-04:00"},
    "regularity": {"verdict": "irregular", "rule": "every gap within 2 minute(s) of the median",
                   "median_headway_minutes": 3.2, "max_deviation_minutes": 2.3},
}

TOOL_ERROR_TEXT = "`a2a_mbta_headway` failed: the MBTA refused that request: `filter[stop]` is invalid"


def _message(text, **extra):
    payload = {"kind": "message", "role": "user", "messageId": "test-message",
               "parts": [{"kind": "text", "text": text}]}
    payload.update(extra)
    return payload




class HeadwaySkillTests(unittest.TestCase):
    """The premium skill: parsing and the stop lookup stay local, the gaps come from the gateway."""

    def headway(self, client=None, gateway=None, **params):
        return MbtaAgent(client=client or FakeMbta(), gateway=gateway).run(
            {"skill": SKILL_HEADWAY_CHECK, "params": params, "missing": []})













if __name__ == "__main__":
    unittest.main()
