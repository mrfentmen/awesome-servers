"""Tests for the Citi Bike server.

    python3 servers/bikeshare/tests/test_agent.py
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

from a2a_kit import GatewayClient  # noqa: E402

from agent import (  # noqa: E402
    CARD_SKILLS,
    SKILL_RIDE_PAIR,
    BikeShareAgent,
    parse,
    station_name_from_text,
)
from data import (  # noqa: E402
    DATASET,
    NEAR_RADIUS_KM,
    BikeShareClient,
    haversine_km,
    relative_seconds,
)

FEED_NOW = 1790653078

TIMES_SQUARE = {
    "station_id": "66dc840f-0aca-11e7-82f6-3863bb44ef7c", "name": "E 33 St & 5 Ave",
    "short_name": "6322.01", "lat": 40.748440, "lon": -73.985700, "region_id": "51",
    "capacity": 0, "has_kiosk": True, "station_type": "classic",
}
BROADWAY_48 = {
    "station_id": "64f0f28c-bedc-42d5-b107-ecdd48fc30cd", "name": "Broadway & W 48 St",
    "short_name": "6708.04", "lat": 40.758000, "lon": -73.985500, "region_id": "51",
    "capacity": 0, "has_kiosk": True, "station_type": "classic",
}
EMPTY_STATION = {
    "station_id": "64f0f28c-bedc-42d5-b107-ecdd48fc33ff", "name": "6 Ave & W 45 St",
    "short_name": "6593.15", "lat": 40.760000, "lon": -73.990000, "region_id": "51",
    "capacity": 0, "has_kiosk": False, "station_type": "classic",
}
DISABLED_STATION = {
    "station_id": "64f0f28c-bedc-42d5-b107-ecdd48fc00aa", "name": "Brooklyn Bridge Park",
    "short_name": "4900.01", "lat": 40.700800, "lon": -73.993800, "region_id": "71",
    "capacity": 0, "has_kiosk": False, "station_type": "classic",
}

INFO_ROWS = [TIMES_SQUARE, BROADWAY_48, EMPTY_STATION, DISABLED_STATION]


def status_row(station_id, bikes=0, ebikes=0, docks=0, installed=1, renting=1, returning=1,
               docks_disabled=0, bikes_disabled=0, last_reported=0):
    return {"station_id": station_id, "num_bikes_available": bikes, "num_ebikes_available": ebikes,
            "num_docks_available": docks, "num_docks_disabled": docks_disabled,
            "num_bikes_disabled": bikes_disabled, "is_installed": installed, "is_renting": renting,
            "is_returning": returning, "last_reported": last_reported}


STATUS_ROWS = [
    status_row(TIMES_SQUARE["station_id"], bikes=3, ebikes=2, docks=54, bikes_disabled=1),
    status_row(BROADWAY_48["station_id"], bikes=5, ebikes=4, docks=96, bikes_disabled=1),
    status_row(EMPTY_STATION["station_id"], bikes=0, docks=63, bikes_disabled=4),
    # A station that is out of service still reports its last numbers, as GBFS does.
    status_row(DISABLED_STATION["station_id"], bikes=7, docks=12, installed=0, renting=0, returning=0),
]


def gbfs(status_rows=None, info_rows=None, last_updated=FEED_NOW):
    return {
        "last_updated": last_updated,
        "ttl": 30,
        "data": {"stations": list(STATUS_ROWS if status_rows is None else status_rows)},
    }, {"last_updated": last_updated, "data": {"stations": list(INFO_ROWS if info_rows is None else info_rows)}}


def _no_network(*args, **kwargs):
    raise AssertionError("this client must not touch the network")


def local_fetch(status_rows=None, info_rows=None, last_updated=FEED_NOW, calls=None):
    """A JsonApiClient `fetch` that serves both GBFS documents, so data.py runs for real."""
    status_doc, info_doc = gbfs(status_rows, info_rows, last_updated)

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        if url.endswith("/station_status.json"):
            return status_doc
        if url.endswith("/station_information.json"):
            return info_doc
        raise AssertionError(f"unexpected url {url}")

    return fetch


def fetch_from(status_rows=None, info_rows=None, last_updated=FEED_NOW, calls=None):
    return local_fetch(status_rows, info_rows, last_updated, calls)


class FakeBikeShare(BikeShareClient):
    """Same interface as BikeShareClient, served from memory. The real join runs."""

    def __init__(self, status_rows=None, info_rows=None, last_updated=FEED_NOW) -> None:
        self.reads: list[str] = []
        super().__init__(fetch=local_fetch(status_rows, info_rows, last_updated, self.reads))


class ValidationTests(unittest.TestCase):
    def test_check_point(self):
        self.assertEqual(BikeShareClient.check_point("40.7484, -73.9857"), (40.7484, -73.9857))
        with self.assertRaises(ValueError):
            BikeShareClient.check_point("91.0,-73.9")
        with self.assertRaises(ValueError):
            BikeShareClient.check_point("times square")

    def test_check_search_km_and_limit(self):
        self.assertEqual(BikeShareClient.check_search_km("1.25"), 1.25)
        for bad in ("0", "6", "close"):
            with self.assertRaises(ValueError):
                BikeShareClient.check_search_km(bad)
        self.assertEqual(BikeShareClient.check_limit(5), 5)
        with self.assertRaises(ValueError):
            BikeShareClient.check_limit(0)

    def test_relative_seconds(self):
        self.assertIsNone(relative_seconds(None))
        self.assertIsNone(relative_seconds("soon"))
        self.assertIsInstance(relative_seconds(FEED_NOW), int)

    def test_haversine(self):
        self.assertAlmostEqual(haversine_km(40.7484, -73.9857, 40.7484, -73.9857), 0.0, places=6)
        self.assertLess(haversine_km(40.7484, -73.9857, 40.7580, -73.9855), 1.2)


class ReaderTests(unittest.TestCase):
    def test_stations_joins_both_documents(self):
        calls = []
        client = BikeShareClient(fetch=fetch_from(calls=calls))
        stations = client.stations()
        self.assertEqual(len(stations), 4)
        times_square = stations[0]
        self.assertEqual(times_square["name"], "E 33 St & 5 Ave")
        self.assertEqual(times_square["bikes_available"], 3)
        self.assertEqual(times_square["ebikes_available"], 2)
        self.assertEqual(times_square["docks_available"], 54)
        self.assertEqual(times_square["bikes_disabled"], 1)
        self.assertTrue(times_square["renting"])
        self.assertIsInstance(times_square["feed_age_seconds"], int)
        self.assertEqual([url.rsplit("/", 1)[-1] for url, _ in calls],
                         ["station_status.json", "station_information.json"])

    def test_stations_without_a_position_are_dropped(self):
        info = [*INFO_ROWS, {"station_id": "no-position", "name": "Ghost", "short_name": "0.00"}]
        client = BikeShareClient(fetch=fetch_from(info_rows=info))
        self.assertEqual(len(client.stations()), 4)

    def test_stations_without_a_status_are_dropped(self):
        status = [row for row in STATUS_ROWS if row["station_id"] != TIMES_SQUARE["station_id"]]
        client = BikeShareClient(fetch=fetch_from(status_rows=status))
        names = [station["name"] for station in client.stations()]
        self.assertNotIn("E 33 St & 5 Ave", names)
        self.assertEqual(len(names), 3)

    def test_a_document_with_no_station_list_is_upstream_error(self):
        from a2a_kit import UpstreamError

        client = BikeShareClient(fetch=lambda url, params, headers: {"data": {}})
        with self.assertRaises(UpstreamError):
            client.stations()

    def test_nearby_sorts_by_real_distance(self):
        client = BikeShareClient(fetch=fetch_from())
        rows = client.nearby("40.7490,-73.9857", limit=4, radius_km=2)
        self.assertEqual([row["name"] for row in rows][0], "E 33 St & 5 Ave")
        self.assertLess(rows[0]["distance_km"], rows[1]["distance_km"])
        self.assertEqual(client.nearby("40.7490,-73.9857", limit=4, radius_km=0.1)[0]["short_name"],
                         "6322.01")
        self.assertEqual(client.nearby("0.0,0.0", limit=4, radius_km=1), [])

    def test_find_station_by_id_short_name_and_name(self):
        client = BikeShareClient(fetch=fetch_from())
        self.assertEqual(client.find_station("6322.01")["name"], "E 33 St & 5 Ave")
        self.assertEqual(client.find_station("66dc840f-0aca-11e7-82f6-3863bb44ef7c")["short_name"], "6322.01")
        self.assertEqual(client.find_station("Broadway & W 48 St")["short_name"], "6708.04")
        self.assertEqual(client.find_station("6 Ave & W 45")["short_name"], "6593.15")
        self.assertIsNone(client.find_station("Nowhere"))
        self.assertIsNone(client.find_station(""))

    def test_system_totals(self):
        client = BikeShareClient(fetch=fetch_from())
        totals = client.system_totals()
        self.assertEqual(totals["stations"], 4)
        self.assertEqual(totals["bikes_available"], 15)
        self.assertEqual(totals["ebikes_available"], 6)
        self.assertEqual(totals["docks_available"], 225)
        self.assertEqual(totals["out_of_service"], 1)
        self.assertEqual(totals["renting"], 3)
        self.assertEqual(totals["full_stations"], 0)
        self.assertEqual(totals["empty_stations"], 1)

    def test_service_note_uses_the_feeds_own_flags(self):
        client = BikeShareClient(fetch=fetch_from())
        stations = {station["name"]: station for station in client.stations()}
        self.assertEqual(client.service_note(stations["E 33 St & 5 Ave"]), "in service")
        self.assertEqual(client.service_note(stations["6 Ave & W 45 St"]), "no bikes free")
        self.assertEqual(client.service_note(stations["Brooklyn Bridge Park"]), "out of service")
        full = {**stations["E 33 St & 5 Ave"], "docks_available": 0}
        self.assertEqual(client.service_note(full), "full: no free dock to return to")
        not_renting = {**stations["E 33 St & 5 Ave"], "renting": False}
        self.assertEqual(client.service_note(not_renting), "not renting")
        not_returning = {**stations["E 33 St & 5 Ave"], "returning": False}
        self.assertEqual(client.service_note(not_returning), "not accepting returns")

    def test_search_by_name(self):
        client = BikeShareClient(fetch=fetch_from())
        self.assertEqual([row["short_name"] for row in client.search(name="W 4")],
                         ["6593.15", "6708.04"], "name matches come back in name order")
        with self.assertRaises(ValueError):
            client.search(name="<script>")


class ParseTests(unittest.TestCase):
    def message(self, text):
        return {"parts": [{"kind": "text", "text": text}]}

    def test_default_is_availability(self):
        for text in ("how many bikes are there right now?", "is the bike system healthy?",
                     "total bikes across the city", "hello"):
            self.assertEqual(parse(self.message(text))["skill"], "availability", text)

    def test_a_bike_question_with_no_location_asks_for_one(self):
        request = parse(self.message("can I bike from Times Square to somewhere?"))
        self.assertEqual(request["skill"], "bikes-near")
        self.assertNotIn("point", request["params"])

    def test_bikes_near(self):
        for text in ("where can I get a bike near 40.7484,-73.9857?",
                     "bikes and docks near 40.7484,-73.9857",
                     "find a bike near 40.7484,-73.9857"):
            request = parse(self.message(text))
            self.assertEqual(request["skill"], "bikes-near", text)
            self.assertEqual(request["params"]["point"], "40.7484,-73.9857", text)

    def test_nearest_stations(self):
        request = parse(self.message("which bike stations are closest to 40.7580,-73.9855?"))
        self.assertEqual(request["skill"], "nearest-stations")
        self.assertEqual(request["params"]["point"], "40.7580,-73.9855")

    def test_station_lookup(self):
        request = parse(self.message("what is at Broadway & W 48 St?"))
        self.assertEqual(request["skill"], "station-lookup")
        self.assertEqual(request["params"]["station"], "Broadway & W 48 St")
        self.assertEqual(parse(self.message("how many bikes at station 6322.01?"))["params"]["station"],
                         "6322.01")

    def test_a_named_station_beats_the_system_wide_question(self):
        self.assertEqual(parse(self.message("how many bikes at station 6322.01?"))["skill"],
                         "station-lookup")

    def test_ride_pair_routes_to_the_premium_skill(self):
        for text in ("can I bike from 40.7484,-73.9857 to 40.7580,-73.9855?",
                     "where do I pick up and drop off for 40.7008,-73.9938 to 40.7128,-74.0060?",
                     "ride 40.7484,-73.9857 -> 40.7580,-73.9855"):
            request = parse(self.message(text))
            self.assertEqual(request["skill"], SKILL_RIDE_PAIR, text)
            self.assertTrue(request["params"]["origin"], text)
            self.assertTrue(request["params"]["destination"], text)
            self.assertTrue(request["explicit"], text)

    def test_free_skills_keep_their_own_questions(self):
        self.assertEqual(parse(self.message("where can I get a bike near 40.7484,-73.9857?"))["skill"],
                         "bikes-near")
        self.assertEqual(parse(self.message("which bike stations are closest to 40.7580,-73.9855?"))["skill"],
                         "nearest-stations")
        self.assertEqual(parse(self.message("what is at Broadway & W 48 St?"))["skill"], "station-lookup")
        self.assertEqual(parse(self.message("how many bikes are there right now?"))["skill"], "availability")

    def test_explicit_json_wins(self):
        message = {"parts": [{"kind": "text", "text": "anything"},
                             {"kind": "data", "data": {"skill": SKILL_RIDE_PAIR,
                                                       "origin": "40.7484,-73.9857",
                                                       "destination": "40.7580,-73.9855",
                                                       "search_km": 0.5}}]}
        request = parse(message)
        self.assertEqual(request["skill"], SKILL_RIDE_PAIR)
        self.assertEqual(request["params"]["search_km"], 0.5)

    def test_help_and_station_name_extraction(self):
        self.assertEqual(parse(self.message(""))["skill"], "help")
        self.assertEqual(parse(self.message("what can you do?"))["skill"], "help")
        self.assertEqual(station_name_from_text("how many bikes at station 6322.01?"), "6322.01")
        self.assertEqual(station_name_from_text("what is at Broadway & W 48 St?"), "Broadway & W 48 St")
        self.assertIsNone(station_name_from_text("how many bikes are there right now?"))


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, client=None, **params):
        agent = BikeShareAgent(client=client or FakeBikeShare())
        return agent.run({"skill": skill, "params": params, "missing": agent.missing(skill, params)})

    def test_bikes_near_counts_only_renting_stations(self):
        result = self.run_skill("bikes-near", client=FakeBikeShare(), point="40.7490,-73.9857", limit=5)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("have a bike free and are renting", result["message"])
        self.assertIn("E 33 St & 5 Ave", result["message"])
        self.assertIn("2 e-bike", result["message"])
        self.assertIn(DATASET, result["message"])
        artifact = result["artifact"]
        # Brooklyn Bridge Park is 7 km away, so only three Midtown stations are listed.
        self.assertEqual(artifact["count"], 3)
        self.assertEqual(artifact["usable_count"], 2, "the station with no bikes is not usable")
        self.assertEqual(artifact["stations"][0]["name"], "E 33 St & 5 Ave")

    def test_bikes_near_with_nothing_usable_says_so(self):
        empty = [status_row(row["station_id"]) for row in INFO_ROWS]
        result = self.run_skill("bikes-near", client=FakeBikeShare(status_rows=empty),
                                point="40.7490,-73.9857")
        self.assertIn("None of the", result["message"])
        self.assertEqual(result["artifact"]["usable_count"], 0)

    def test_bikes_near_with_nothing_at_all(self):
        result = self.run_skill("bikes-near", client=FakeBikeShare(), point="0.0,0.0")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("no station within", result["message"])

    def test_nearest_stations_keeps_unusable_ones(self):
        result = self.run_skill("nearest-stations", client=FakeBikeShare(),
                                point="40.7010,-73.9930", limit=4)
        self.assertIn("whatever their state", result["message"])
        self.assertIn("out of service", result["message"])
        self.assertEqual(result["artifact"]["stations"][0]["name"], "Brooklyn Bridge Park")

    def test_near_skills_need_a_point(self):
        agent = BikeShareAgent(client=FakeBikeShare())
        self.assertEqual(agent.missing("bikes-near", {}), ["point"])
        result = agent.run({"skill": "bikes-near", "params": {}, "missing": ["point"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("40.7484,-73.9857", result["message"])

    def test_near_skills_use_the_wider_default_radius(self):
        result = self.run_skill("nearest-stations", client=FakeBikeShare(), point="40.7490,-73.9857")
        self.assertIn(f"{NEAR_RADIUS_KM} km", result["message"])

    def test_station_lookup_by_name_and_short_name(self):
        for wanted in ("Broadway & W 48 St", "6708.04", "E 33 St & 5 Ave"):
            result = self.run_skill("station-lookup", client=FakeBikeShare(), station=wanted)
            self.assertEqual(result["final_state"], "completed", wanted)
            self.assertIn("free dock(s) to return to", result["message"])
        self.assertEqual(result["artifact"]["station_found"]["short_name"], "6322.01")

    def test_station_lookup_reports_an_out_of_service_station(self):
        result = self.run_skill("station-lookup", client=FakeBikeShare(), station="Brooklyn Bridge Park")
        self.assertIn("out of service", result["message"])
        self.assertIn("7 bike(s) free", result["message"])

    def test_station_lookup_unknown_and_ambiguous(self):
        unknown = self.run_skill("station-lookup", client=FakeBikeShare(), station="Nowhere")
        self.assertIn("No Citi Bike station matches", unknown["message"])
        self.assertIn("short name such as 6708.04", unknown["message"])

    def test_station_lookup_needs_a_station(self):
        agent = BikeShareAgent(client=FakeBikeShare())
        self.assertEqual(agent.missing("station-lookup", {}), ["station"])
        self.assertIn("Broadway & W 48 St", agent.input_prompt("station-lookup", ["station"]))

    def test_availability_totals(self):
        result = self.run_skill("availability", client=FakeBikeShare())
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("15 bike(s) free", result["message"])
        self.assertIn("225 dock(s) free", result["message"])
        self.assertIn("1 out of service", result["message"])
        self.assertIn("1 with no bike to take", result["message"])
        totals = result["artifact"]["totals"]
        self.assertEqual(totals["stations"], 4)
        self.assertEqual(totals["bikes_available"], 15)

    def test_help_does_not_touch_the_feed(self):
        client = FakeBikeShare()
        result = self.run_skill("help", client=client)
        self.assertIn("Citi Bike", result["message"])
        self.assertIsNone(result["artifact"])
        self.assertEqual(client.reads, [])

    def test_card_and_upstream_failure(self):
        from a2a_kit import UpstreamError

        agent = BikeShareAgent(client=FakeBikeShare())
        self.assertEqual([skill["id"] for skill in CARD_SKILLS],
                         ["bikes-near", "nearest-stations", "station-lookup", "availability",
                          "ride-pair"])
        self.assertEqual(agent.env_prefix, "BIKESHARE")
        self.assertEqual(agent.watch_kinds, ())

        class Broken(FakeBikeShare):
            def stations(self):
                raise UpstreamError("BIKESHARE request failed: HTTP 502")

        result = BikeShareAgent(client=Broken()).run(
            {"skill": "availability", "params": {}, "missing": []})
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("HTTP 502", result["message"])


#: Shape copied from a live gateway `a2a_bikeshare_ride_pair` answer for Midtown.
RIDE_PAYLOAD = {
    "dataset": "gbfs.citibikenyc.com",
    "product": "Citi Bike GBFS station status and station information",
    "source": "Citi Bike / Lyft (GBFS)",
    "generated_at": "2026-09-29T03:39:35.794Z",
    "feed_last_updated": "1790653078",
    "stations_read": 2520,
    "search_km": 1,
    "pairs_compared": 25,
    "best": {
        "pickup": {"station_id": "66dc840f-0aca-11e7-82f6-3863bb44ef7c", "name": "E 33 St & 5 Ave",
                   "short_name": "6322.01", "walk_km": 0.106, "bikes_available": 2,
                   "ebikes_available": 2, "docks_available": 54, "renting": True, "returning": True},
        "dropoff": {"station_id": "64f0f28c-bedc-42d5-b107-ecdd48fc30cd",
                    "name": "Broadway & W 48 St", "short_name": "6708.04", "walk_km": 0.248,
                    "bikes_available": 2, "ebikes_available": 1, "docks_available": 99,
                    "renting": True, "returning": True},
        "total_walk_km": 0.354,
    },
    "alternatives": [
        {"pickup": {"station_id": "p1", "name": "6 Ave & W 34 St", "short_name": "6364.10",
                    "walk_km": 0.241, "bikes_available": 4, "ebikes_available": 1,
                    "docks_available": 20, "renting": True, "returning": True},
         "dropoff": {"station_id": "d1", "name": "6 Ave & W 45 St", "short_name": "6593.15",
                     "walk_km": 0.268, "bikes_available": 1, "ebikes_available": 0,
                     "docks_available": 62, "renting": True, "returning": True},
         "total_walk_km": 0.509},
    ],
    "note": "walk distances are straight-line; the feed publishes no cycling or walking time",
}

DENIED_TEXT = ("`a2a_bikeshare_ride_pair` is a premium tool, but that license key is not valid. "
               "Get a key at https://buy.polar.sh/polar_cl_example")
TOOL_ERROR_TEXT = "`a2a_bikeshare_ride_pair` failed: the Citi Bike feed returned a GBFS document with no station list"


def _message(text, **extra):
    payload = {"kind": "message", "role": "user", "messageId": "test-message",
               "parts": [{"kind": "text", "text": text}]}
    payload.update(extra)
    return payload


def fake_gateway(payload=None, error=None, text=None, tool_error=None, key="polar_test_key"):
    """A GatewayClient whose HTTP POST is a function, so no test touches the network."""
    calls: list[dict] = []

    def fetch(url, request_payload, headers):
        calls.append({"url": url, "payload": request_payload, "headers": headers})
        if error is not None:
            raise error
        if tool_error is not None:
            # Failed after the gate let it through: no licenceRefusal marker.
            return {"jsonrpc": "2.0", "id": 1,
                    "result": {"content": [{"type": "text", "text": tool_error}], "isError": True}}
        if payload is None and text is None:
            # The gateway's licence refusal, marker included: the marker is what tells a
            # refusal apart from a tool that failed after the gate had let it through.
            return {"jsonrpc": "2.0", "id": 1,
                    "result": {"content": [{"type": "text", "text": DENIED_TEXT}],
                               "structuredContent": {"licenceRefusal": True, "reason": "invalid"},
                               "isError": True}}
        body = text if text is not None else json.dumps(payload)
        return {"jsonrpc": "2.0", "id": 1, "result": {"content": [{"type": "text", "text": body}]}}

    return GatewayClient(fetch=fetch, key=key), calls


class RidePairSkillTests(unittest.TestCase):
    """The premium skill: parsing stays local, the pairing comes from the gateway."""

    def ride(self, client=None, gateway=None, **params):
        return BikeShareAgent(client=client or FakeBikeShare(), gateway=gateway).run(
            {"skill": SKILL_RIDE_PAIR, "params": params, "missing": []})

    def test_the_message_reports_the_gateways_pair(self):
        gateway, calls = fake_gateway(RIDE_PAYLOAD)
        result = self.ride(gateway=gateway, origin="40.7484,-73.9857", destination="40.7580,-73.9855")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Pick up at E 33 St & 5 Ave", result["message"])
        self.assertIn("0.106 km walk", result["message"])
        self.assertIn("Drop off at Broadway & W 48 St", result["message"])
        self.assertIn("99 free dock(s)", result["message"])
        self.assertIn("0.354 km of walking in total", result["message"])
        self.assertIn("also: 6 Ave & W 34 St", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertTrue(result["artifact"]["premium"])
        self.assertEqual(result["artifact"]["stations_read"], 2520)
        self.assertEqual(len(result["artifact"]["alternatives"]), 1)

        # The GBFS feeds were read behind the gate, not here.
        self.assertEqual(len(calls), 1)
        sent = calls[0]["payload"]["params"]
        self.assertEqual(sent["name"], "a2a_bikeshare_ride_pair")
        self.assertEqual(sent["arguments"]["origin_latitude"], 40.7484)
        self.assertEqual(sent["arguments"]["origin_longitude"], -73.9857)
        self.assertEqual(sent["arguments"]["destination_latitude"], 40.758)
        self.assertEqual(sent["arguments"]["destination_longitude"], -73.9855)
        self.assertEqual(sent["arguments"]["search_km"], 1.0)

    def test_a_station_not_renting_is_called_out(self):
        payload = {**RIDE_PAYLOAD, "best": {
            **RIDE_PAYLOAD["best"],
            "pickup": {**RIDE_PAYLOAD["best"]["pickup"], "renting": False}}}
        gateway, _ = fake_gateway(payload)
        result = self.ride(gateway=gateway, origin="40.7484,-73.9857", destination="40.7580,-73.9855")
        self.assertIn("NOT renting", result["message"])

    def test_without_a_licence_the_caller_is_told_how_to_get_one(self):
        gateway, calls = fake_gateway(key="")
        result = self.ride(gateway=gateway, origin="40.7484,-73.9857", destination="40.7580,-73.9855")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("MCP_LICENSE_KEY", result["message"])
        self.assertEqual(result["artifact"]["reason"], "missing_key")
        self.assertNotIn("best", result["artifact"])
        self.assertEqual(calls, [], "a keyless caller must not reach the gateway")

    def test_a_licence_refusal_keeps_the_gateways_wording(self):
        gateway, _ = fake_gateway()  # nothing but a refusal
        result = self.ride(gateway=gateway, origin="40.7484,-73.9857", destination="40.7580,-73.9855")
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["message"], DENIED_TEXT)
        self.assertEqual(result["artifact"]["reason"], "denied")

    def test_a_dead_gateway_fails_instead_of_inventing_a_ride(self):
        gateway, _ = fake_gateway(error=OSError("connection refused"))
        result = self.ride(gateway=gateway, origin="40.7484,-73.9857", destination="40.7580,-73.9855")
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("could not be reached", result["message"])
        self.assertIsNone(result["artifact"].get("best"))

    def test_a_tool_error_is_not_sold_as_a_licence_problem(self):
        gateway, _ = fake_gateway(tool_error=TOOL_ERROR_TEXT)
        result = self.ride(gateway=gateway, origin="40.7484,-73.9857", destination="40.7580,-73.9855")
        self.assertEqual(result["final_state"], "failed")
        self.assertNotIn("MCP_LICENSE_KEY", result["message"])
        self.assertIn("no station list", result["message"])

    def test_a_bad_point_is_a_question_not_a_charge(self):
        gateway, calls = fake_gateway(RIDE_PAYLOAD)
        result = self.ride(gateway=gateway, origin="the office", destination="40.7580,-73.9855")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("lat,lon", result["message"])
        self.assertEqual(calls, [])

    def test_a_bad_search_radius_is_a_question_not_a_charge(self):
        gateway, calls = fake_gateway(RIDE_PAYLOAD)
        result = self.ride(gateway=gateway, origin="40.7484,-73.9857",
                           destination="40.7580,-73.9855", search_km=90)
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("between 0.1 and 5 km", result["message"])
        self.assertEqual(calls, [])

    def test_a_gateway_answer_without_a_pair_is_not_a_ride(self):
        gateway, _ = fake_gateway({"stations_read": 2520, "pairs_compared": 0})
        result = self.ride(gateway=gateway, origin="40.7484,-73.9857", destination="40.7580,-73.9855")
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("without a ride pair", result["message"])


if __name__ == "__main__":
    unittest.main()
