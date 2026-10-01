"""Tests for the uk-postcode agent: records, health, governance, districts and turns.

    python3 agents/uk-postcode/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(EC1A 1BB in Islington, Cl﻿erkenwell ward, NHS West and North London ICB; LS1 as a
district with a Leeds centroid; and the nearest-postcode query, which publishes
no distances at all).
"""

from __future__ import annotations

import json
import queue
import sys
import threading
import unittest
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]
for path in (str(REPO_ROOT), str(AGENT_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

from acp_kit import (AcpClient, Connection, GatewayClient,  # noqa: E402
                     STOP_END_TURN, STOP_REFUSAL)

from agent import route  # noqa: E402
from data import (PostcodeData, PostcodeError, PostcodeNotFound,  # noqa: E402
                  bearing_deg, compass_point, great_circle_km, normalise,
                  outcode_from_text, postcode_from_text)

#: `/postcodes/EC1A1BB` as the directory publishes it, 2026-09-28. `senedd_*` and
#: `admin_county` are null because Islington is in England and not a ceremonial
#: county: a real null, not a lookup failure.
EC1A1BB = {
    "postcode": "EC1A 1BB", "quality": 1, "eastings": 531073, "northings": 182317,
    "country": "England", "nhs_ha": "London", "longitude": -0.112017, "latitude": 51.524567,
    "european_electoral_region": "London", "primary_care_trust": "Islington",
    "region": "London", "lsoa": "Islington 022F", "msoa": "Islington 022",
    "incode": "1BB", "outcode": "EC1A",
    "parliamentary_constituency": "Islington South and Finsbury",
    "parliamentary_constituency_2024": "Islington South and Finsbury",
    "senedd_constituency": None, "senedd_constituency_no": None,
    "admin_district": "Islington", "parish": "Islington, unparished area",
    "admin_county": None, "date_of_introduction": "198410", "date_of_termination": None,
    "index_of_multiple_deprivation": 11070, "admin_ward": "Clerkenwell", "ced": None,
    "ccg": "NHS West and North London", "nuts": "Islington", "pfa": "Metropolitan Police",
    "nhs_region": "London", "ttwa": "London", "national_park": "England (non-National Park)",
    "bua": "Islington",
    "icb": "NHS West and North London Integrated Care Board",
    "cancer_alliance": "North Central London",
    "codes": {"admin_district": "E09000019", "admin_ward": "E05013702",
              "parliamentary_constituency": "E14001306", "ccg": "E38000240",
              "nuts": "TLI43", "lsoa": "E01002726", "icb": "E54000071"},
}

#: A withdrawn postcode: quality 5, terminated 1996-02-01. Reading quality as a
#: score would call this a perfectly good postcode.
WITHDRAWN = {
    "postcode": "E1 0AA", "quality": 5, "country": "England",
    "admin_district": "Tower Hamlets", "admin_ward": None,
    "nhs_region": "London", "icb": None, "region": "London",
    "parliamentary_constituency": "Bethnal and Stepney",
    "date_of_termination": "19960201", "latitude": 51.5172, "longitude": -0.0355,
    "codes": {},
}

#: `/outcodes/LS1` carries no quality: a district is not a deliverable postcode.
LS1_OUTCODE = {
    "outcode": "LS1", "longitude": -1.55126, "latitude": 53.79762596197708,
    "northings": 447000, "eastings": 430000, "admin_district": ["Leeds"],
    "parish": ["Leeds, unparished area"], "admin_county": ["West Yorkshire"],
    "country": "England",
    "parliamentary_constituency": "Leeds Central and Headingley, Leeds South",
}

#: `postcodes?lon=&lat=&radius=1000` returns rows ordered by proximity and
#: publishes NO distance, so every distance is computed. The last row is in a
#: different district, which is the cross-boundary case.
NEAREST = [
    {"postcode": "EC1A 1BB", "admin_district": "Islington", "admin_ward": "Clerkenwell",
     "nhs_region": "London", "icb": "NHS West and North London ICB",
     "parliamentary_constituency": "Islington South and Finsbury", "country": "England",
     "quality": 1, "latitude": 51.524567, "longitude": -0.112017},
    {"postcode": "EC1V 9NR", "admin_district": "Islington", "admin_ward": "Clerkenwell",
     "nhs_region": "London", "icb": "NHS West and North London ICB",
     "parliamentary_constituency": "Islington South and Finsbury", "country": "England",
     "quality": 1, "latitude": 51.5255, "longitude": -0.1030},
    #: A row with no coordinates: it cannot be placed, so it must be dropped.
    {"postcode": "EC1R 0XX", "admin_district": "Islington", "admin_ward": "Clerkenwell",
     "nhs_region": "London", "icb": None, "parliamentary_constituency": None,
     "country": "England", "quality": 1, "latitude": None, "longitude": None},
    {"postcode": "EC1N 1RA", "admin_district": "Camden", "admin_ward": "Bloomsbury",
     "nhs_region": "London", "icb": "NHS North Central London ICB",
     "parliamentary_constituency": "Holborn and St Pancras", "country": "England",
     "quality": 1, "latitude": 51.5255, "longitude": -0.1180},
]


class FakeFeeds:
    def __init__(self, postcode=None, outcode=None, nearest=None, fail=False, error=False):
        self.calls: list[str] = []
        self.params: list[dict] = []
        self.postcode = EC1A1BB if postcode is None else postcode
        self.outcode = LS1_OUTCODE if outcode is None else outcode
        self.nearest = NEAREST if nearest is None else nearest
        self.fail = fail
        self.error = error

    def __call__(self, url: str, params: dict | None = None):
        self.calls.append(url)
        self.params.append(dict(params or {}))
        if self.fail:
            raise PostcodeError("postcodes.io answered HTTP 500")
        if self.error:
            return json.dumps({"status": 404, "error": "Postcode not found"})
        if "outcodes/" in url:
            return json.dumps({"status": 200, "result": self.outcode})
        if url.rstrip("/").endswith("postcodes"):
            return json.dumps({"status": 200, "result": self.nearest})
        return json.dumps({"status": 200, "result": self.postcode})


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return PostcodeData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_postcode_is_found_with_or_without_its_space(self):
        self.assertEqual(postcode_from_text("where is SW1A 1AA?"), "SW1A 1AA")
        self.assertEqual(postcode_from_text("postcode ec1a1bb"), "EC1A 1BB")
        #: A district is not a postcode, so it does not match here.
        self.assertIsNone(postcode_from_text("what is in SW1A?"))
        self.assertIsNone(postcode_from_text("where is the beach?"))

    def test_an_outcode_is_found_on_its_own(self):
        self.assertEqual(outcode_from_text("what is in SW1A?"), "SW1A")
        self.assertEqual(outcode_from_text("LS1"), "LS1")
        self.assertEqual(outcode_from_text("region E20"), "E20")
        self.assertIsNone(outcode_from_text("where is SW1A 1AA?"))
        self.assertIsNone(outcode_from_text("tell me a joke"))

    def test_normalising(self):
        self.assertEqual(normalise("  sw1a  1aa "), "SW1A 1AA")
        self.assertEqual(normalise("ec1a1bb"), "EC1A1BB")

    def test_a_distance_and_a_bearing(self):
        #: Islington to central Paris: the great-circle distance is about 344.6 km.
        self.assertAlmostEqual(great_circle_km(51.524567, -0.112017, 48.8566, 2.3522),
                               344.6, places=1)
        self.assertAlmostEqual(bearing_deg(51.524567, -0.112017, 48.8566, 2.3522),
                               148.1, places=0)
        self.assertEqual(compass_point(0), "N")
        self.assertEqual(compass_point(180), "S")
        self.assertEqual(compass_point(None), "not reported")


class ReadTests(unittest.TestCase):
    def test_a_postcode_record(self):
        data, feed = make_data()
        record = data.postcode("EC1A1BB")
        self.assertEqual(record["postcode"], "EC1A 1BB")
        self.assertEqual(record["admin_district"], "Islington")
        self.assertEqual(record["admin_ward"], "Clerkenwell")
        self.assertEqual(record["quality"], 1)
        self.assertAlmostEqual(record["latitude"], 51.524567)
        self.assertIn("postcodes/EC1A1BB", feed.calls[-1])

    def test_null_authority_fields_are_kept_as_null(self):
        data, _feed = make_data(postcode=WITHDRAWN)
        record = data.postcode("E1 0AA")
        #: A null is a fact about that postcode, not a failed lookup.
        self.assertIsNone(record["admin_ward"])
        self.assertIsNone(record["icb"])
        self.assertEqual(record["quality"], 5)
        self.assertEqual(record["date_of_termination"], "19960201")

    def test_an_outcode_is_flattened(self):
        data, feed = make_data()
        record = data.outcode("LS1")
        self.assertEqual(record["outcode"], "LS1")
        self.assertEqual(record["admin_district"], "Leeds")
        self.assertEqual(record["admin_districts"], ["Leeds"])
        self.assertEqual(record["parishes"], ["Leeds, unparished area"])
        self.assertIn("outcodes/LS1", feed.calls[-1])

    def test_the_nearest_query_sends_a_radius_because_it_needs_one(self):
        data, feed = make_data()
        rows = data.nearest(51.524567, -0.112017, limit=10)
        #: Without a radius the directory answers with the single postcode that
        #: owns that exact point, so the radius is part of the request.
        self.assertEqual(feed.params[-1]["radius"], "1000")
        self.assertEqual(feed.params[-1]["limit"], "10")
        #: The row with no coordinates cannot be placed, so it is dropped.
        self.assertEqual([row["postcode"] for row in rows],
                         ["EC1A 1BB", "EC1N 1RA", "EC1V 9NR"])

    def test_a_distance_is_computed_because_the_directory_publishes_none(self):
        data, _feed = make_data()
        rows = data.nearest(51.524567, -0.112017, limit=10)
        self.assertEqual(rows[0]["distance_km"], 0.0)
        self.assertGreater(rows[1]["distance_km"], 0.0)
        self.assertAlmostEqual(rows[0]["distance_miles"], 0.0)
        self.assertGreater(rows[2]["distance_miles"], rows[1]["distance_miles"])

    def test_an_unknown_postcode(self):
        data, _feed = make_data(error=True)
        with self.assertRaises(PostcodeNotFound):
            data.postcode("ZZ1 1ZZ")
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.postcode("   ")
        with self.assertRaises(ValueError):
            data.outcode("")

    def test_a_dead_api(self):
        data, _feed = make_data(fail=True)
        with self.assertRaises(PostcodeError):
            data.postcode("EC1A 1BB")


class RouteTests(unittest.TestCase):
    def test_a_plain_lookup(self):
        self.assertEqual(route("where is SW1A 1AA?"), ("uk-postcode", {"postcode": "SW1A 1AA"}))
        self.assertEqual(route("EC1A1BB")[0], "uk-postcode")

    def test_the_health_question(self):
        self.assertEqual(route("which NHS region is EC1A 1BB in?"),
                         ("uk-health", {"postcode": "EC1A 1BB"}))
        self.assertEqual(route("what integrated care board covers M1 1AE?")[0], "uk-health")
        self.assertEqual(route("which GP does SW1A 1AA have?")[0], "uk-health")

    def test_the_governance_question(self):
        self.assertEqual(route("who is the MP for M1 1AE?"),
                         ("uk-governance", {"postcode": "M1 1AE"}))
        self.assertEqual(route("which council ward is EC1A 1BB in?")[0], "uk-governance")

    def test_health_wins_over_governance_when_both_are_asked(self):
        skill, _ = route("which NHS region and which constituency is EC1A 1BB in?")
        self.assertEqual(skill, "uk-health")

    def test_the_district(self):
        self.assertEqual(route("what is in the postcode district LS1?"),
                         ("uk-outcode", {"outcode": "LS1"}))

    def test_the_neighbourhood(self):
        skill, params = route("which postcodes are near EC1A 1BB?")
        self.assertEqual(skill, "uk-nearby")
        self.assertEqual(params["postcode"], "EC1A 1BB")
        self.assertEqual(route("what postcodes are within 2 km of EC1A 1BB?")[1]["radius_km"], 2.0)
        #: A distance written in miles is converted, and the answer says which.
        self.assertAlmostEqual(route("how far are the postcodes from EC1A 1BB, 3 miles?")[1]
                               ["radius_km"], 4.828, places=3)

    def test_help_and_nonsense(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("tell me a joke")[0], "help")
        self.assertEqual(route("where is the beach?")[0], "help")


class QueueReader:
    def __init__(self):
        self._items: queue.Queue = queue.Queue()

    def push(self, text):
        self._items.put(text)

    def close(self):
        self._items.put(None)

    def __iter__(self):
        return self

    def __next__(self):
        item = self._items.get()
        if item is None:
            raise StopIteration
        return item


class WiredWriter:
    def __init__(self, reader):
        self.reader = reader

    def write(self, text):
        self.reader.push(text)

    def flush(self):
        pass

    def close(self):
        self.reader.close()


def connected_pair():
    to_agent, to_client = QueueReader(), QueueReader()
    return (
        Connection(to_agent, WiredWriter(to_client), name="agent"),
        Connection(to_client, WiredWriter(to_agent), name="client"),
    )


class TurnTests(unittest.TestCase):
    def turn(self, text: str, permission: str = "allow-once", **kw):
        from agent import UkPostcodeAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = UkPostcodeAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_postcode_answer(self):
        result, client, _ = self.turn("where is EC1A 1BB?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("EC1A 1BB", result["text"])
        self.assertIn("quality 1: live", result["text"])
        self.assertIn("admin district: Islington", result["text"])
        self.assertIn("admin ward: Clerkenwell", result["text"])
        self.assertIn("grid reference: E 531073 N 182317", result["text"])
        self.assertIn("index of multiple deprivation: 11070", result["text"])
        self.assertIn("ONS codes: admin_district E09000019", result["text"])

    def test_a_withdrawn_postcode_says_so(self):
        result, _, _ = self.turn("where is E1 0AA?", postcode=WITHDRAWN)
        self.assertIn("quality 5:", result["text"])
        self.assertIn("withdrawn on 1996-02-01", result["text"])
        self.assertIn("terminated: 19960201", result["text"])

    def test_a_health_answer(self):
        result, _, _ = self.turn("which NHS region is EC1A 1BB in?")
        self.assertIn("health for EC1A 1BB (Islington)", result["text"])
        self.assertIn("nhs_region: London", result["text"])
        self.assertIn("icb: NHS West and North London Integrated Care Board", result["text"])
        self.assertIn("ccg: NHS West and North London", result["text"])
        self.assertIn("primary_care_trust: Islington", result["text"])

    def test_a_governance_answer(self):
        result, _, _ = self.turn("who is the MP for EC1A 1BB?")
        self.assertIn("who governs EC1A 1BB (Islington)", result["text"])
        self.assertIn("parliamentary_constituency: Islington South and Finsbury", result["text"])
        self.assertIn("admin_ward: Clerkenwell", result["text"])
        self.assertIn("pfa: Metropolitan Police", result["text"])

    def test_a_district_answer(self):
        result, _, _ = self.turn("what is in the postcode district LS1?")
        self.assertIn("postcode district LS1", result["text"])
        self.assertIn("admin district: Leeds", result["text"])
        self.assertIn("1 parish(es): Leeds, unparished area", result["text"])
        self.assertIn("publishes no quality for a district", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("where is SW1A 1AA?", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("where is EC1A 1BB?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_an_unknown_postcode(self):
        result, _, _ = self.turn("where is EC1A 1BB?", error=True)
        self.assertIn("I could not read the Postcodes Directory", result["text"])
        self.assertIn("Postcode not found", result["text"])


# ---------------------------------------------------------------------------
# The premium skill: uk-nearby
#
# No network: the licence check and the work both happen on the gateway, and the
# gateway's own JSON-RPC answers are injected into the real GatewayClient.
# ---------------------------------------------------------------------------

#: What `uk_postcode_nearby` answers for EC1A 1BB at 2 km: 100 postcodes, all in
#: Islington, and the coverage line says plainly that the cap, not the radius,
#: is what stopped the search.
NEARBY_DATA = {
    "postcode": "EC1A 1BB",
    "admin_district": "Islington",
    "nhs_region": "London",
    "icb": "NHS West and North London Integrated Care Board",
    "parliamentary_constituency": "Islington South and Finsbury",
    "coordinates": {"latitude": 51.524567, "longitude": -0.112017},
    "radius_km": 2,
    "requested": 100,
    "found": 100,
    "truncated": True,
    "furthest_km": 0.226,
    "coverage": "the directory returns at most 100 rows, so this is the nearest 100 inside "
                "the 2 km radius and not everything in it",
    "nearest": [
        {"postcode": "EC1A 1BB", "admin_district": "Islington", "admin_ward": "Clerkenwell",
         "nhs_region": "London", "icb": "NHS West and North London ICB",
         "parliamentary_constituency": "Islington South and Finsbury", "country": "England",
         "quality": 1, "latitude": 51.524567, "longitude": -0.112017, "distance_km": 0.0,
         "distance_miles": 0.0, "bearing_deg": 0.0, "bearing": "0 degrees", "compass": "N",
         "same_district": True, "same_nhs_region": True},
        {"postcode": "EC1N 1RA", "admin_district": "Camden", "admin_ward": "Bloomsbury",
         "nhs_region": "London", "icb": "NHS North Central London ICB",
         "parliamentary_constituency": "Holborn and St Pancras", "country": "England",
         "quality": 1, "latitude": 51.5255, "longitude": -0.118, "distance_km": 0.407,
         "distance_miles": 0.253, "bearing_deg": 281.4, "bearing": "281 degrees",
         "compass": "W", "same_district": False, "same_nhs_region": True},
    ],
    "district_mix": {"Islington": 99, "Camden": 1},
    "nhs_mix": {"London": 100},
    "crosses_district": {
        "from": "Islington", "found": 100, "inside": 99, "outside": 1,
        "nearest_outside": {"postcode": "EC1N 1RA", "admin_district": "Camden",
                            "distance_km": 0.407},
        "note": "a postcode is counted here by its own district, which is a point, not the shape "
                "a district boundary actually takes",
    },
    "unit": "km and miles, straight line between published centroids",
    "accuracy": "distances are straight lines between the directory centroids, not walking distances",
    "source": "postcodes.io (ONS Postcodes Directory)",
}

#: The exact refusal the gateway sends for a key it will not accept.
GATEWAY_DENIAL = ("`uk_postcode_nearby` is a premium tool, but that licence key was rejected. "
                  "Check MCP_LICENSE_KEY, or get a key at https://polar.sh/mrfentmen")


def gateway_answer(text, is_error=False, structured=None):
    """A fake transport that answers every premium call with one JSON-RPC reply."""
    def fetch(url, payload, headers):
        fetch.calls.append({"url": url, "payload": payload, "headers": headers})
        result = {"content": [{"type": "text", "text": text}]}
        if is_error:
            result["isError"] = True
        if structured is not None:
            result["structuredContent"] = structured
        return {"jsonrpc": "2.0", "id": payload.get("id", 1), "result": result}

    fetch.calls = []
    return fetch


class PremiumTests(unittest.TestCase):
    """No key, a bad key and a good key, plus the routing that gets there."""

    NEAR_QUESTION = "which postcodes are near EC1A 1BB?"

    def turn(self, text: str, fetch, key: str):
        from agent import UkPostcodeAgent

        agent_conn, client_conn = connected_pair()
        data, _feed = make_data()
        gateway = GatewayClient(fetch=fetch, key=key, url="https://gateway.test/mcp")
        agent = UkPostcodeAgent(agent_conn, data, gateway=gateway)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission="allow-once")
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client
        finally:
            client.stop()

    def test_no_key_answers_with_the_missing_key_wording(self):
        fetch = gateway_answer("")
        result, client = self.turn(self.NEAR_QUESTION, fetch, "")
        #: An answer, not a crash, and not a failed lookup either.
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("premium skill", result["text"])
        self.assertIn("MCP_LICENSE_KEY", result["text"])
        self.assertIn("no licence key is set", result["text"])
        self.assertEqual(len(client.permission_requests), 1)
        #: Nothing was spent on a call the gate was never going to let through.
        self.assertEqual(fetch.calls, [])

    def test_a_bad_key_returns_the_gateways_own_wording(self):
        fetch = gateway_answer(GATEWAY_DENIAL, is_error=True,
                               structured={"licenceRefusal": True, "reason": "denied"})
        result, _ = self.turn(self.NEAR_QUESTION, fetch, "not-a-real-key")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn(GATEWAY_DENIAL, result["text"])
        self.assertIn("premium", result["text"])
        self.assertEqual(len(fetch.calls), 1)
        self.assertEqual(fetch.calls[0]["payload"]["params"]["name"], "uk_postcode_nearby")
        self.assertEqual(fetch.calls[0]["payload"]["params"]["arguments"],
                         {"postcode": "EC1A 1BB"})

    def test_a_good_key_returns_the_neighbourhood(self):
        fetch = gateway_answer(json.dumps(NEARBY_DATA))
        result, _ = self.turn(self.NEAR_QUESTION, fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("what is near EC1A 1BB (Islington)", result["text"])
        self.assertIn("searched a 2 km radius", result["text"])
        self.assertIn("not everything in it", result["text"])
        self.assertIn("EC1N 1RA: 0.407 km / 0.253 mi", result["text"])
        self.assertIn("admin districts covered by the 100 returned", result["text"])
        self.assertIn("99 of 100 returned postcode(s) are in it and 1 are not", result["text"])
        self.assertIn("not a walking distance", result["text"])
        #: The licence key travels in a header and is never echoed back.
        self.assertEqual(fetch.calls[0]["headers"]["Authorization"], "Bearer k_paid")
        self.assertNotIn("k_paid", result["text"])

    def test_a_good_key_sends_the_radius_it_was_asked_for(self):
        fetch = gateway_answer(json.dumps(NEARBY_DATA))
        self.turn("what postcodes are within 2 km of EC1A 1BB?", fetch, "k_paid")
        arguments = fetch.calls[0]["payload"]["params"]["arguments"]
        self.assertEqual(arguments, {"postcode": "EC1A 1BB", "radius_km": 2.0})

    def test_a_mile_radius_is_converted_to_km(self):
        fetch = gateway_answer(json.dumps(NEARBY_DATA))
        self.turn("how far are the postcodes from EC1A 1BB, 3 miles?", fetch, "k_paid")
        arguments = fetch.calls[0]["payload"]["params"]["arguments"]
        self.assertAlmostEqual(arguments["radius_km"], 4.83, places=2)

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def fetch(url, payload, headers):
            raise OSError("connection refused")

        result, _ = self.turn(self.NEAR_QUESTION, fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read the Postcodes Directory", result["text"])

    def test_a_free_question_never_touches_the_gateway(self):
        fetch = gateway_answer(json.dumps(NEARBY_DATA))
        result, _ = self.turn("where is EC1A 1BB?", fetch, "k_paid")
        self.assertIn("admin district: Islington", result["text"])
        self.assertEqual(fetch.calls, [])

    def test_the_routing_is_narrow(self):
        premium = [
            "which postcodes are near EC1A 1BB?",
            "what is around SW1A 1AA?",
            "what postcodes are within 2 km of M1 1AE?",
            "which postcodes are closest to LS1 1UR?",
        ]
        for text in premium:
            self.assertEqual(route(text)[0], "uk-nearby", text)

        free = [
            ("where is SW1A 1AA?", "uk-postcode"),
            ("EC1A1BB", "uk-postcode"),
            ("which NHS region is EC1A 1BB in?", "uk-health"),
            ("who is the MP for M1 1AE?", "uk-governance"),
            ("which council ward is EC1A 1BB in?", "uk-governance"),
            ("what is in the postcode district LS1?", "uk-outcode"),
            ("what can you do?", "help"),
            ("", "help"),
        ]
        for text, expected in free:
            self.assertEqual(route(text)[0], expected, text)

    def test_the_premium_skill_id_is_published(self):
        from agent import SKILLS

        self.assertIn("uk-nearby", SKILLS)
        self.assertIn("uk-postcode", SKILLS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
