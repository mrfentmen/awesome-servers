"""Tests for the satellites agent: element sets, geometry, routing and turns.

    python3 agents/satellites/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(stations group = 22 objects; ISS (ZARYA) cat 25544, epoch 2026-09-28T11:09:16.121952,
mean motion 15.48680135 rev/day, inclination 51.6312 deg, bstar 0.00011847787).
"""

from __future__ import annotations

import datetime
import json
import math
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
from data import (EARTH_MU, SatelliteData, SatelliteError, SatelliteNotFound,  # noqa: E402
                  altitude_km, epoch_age_hours, object_id_from_text, parse_epoch,
                  period_minutes, semi_major_axis_km)

ISS = {"OBJECT_NAME": "ISS (ZARYA)", "NORAD_CAT_ID": 25544, "OBJECT_ID": "1998-067A",
       "EPOCH": "2026-09-28T11:09:16.121952", "MEAN_MOTION": 15.48680135,
       "ECCENTRICITY": 0.00071596, "INCLINATION": 51.6312, "RA_OF_ASC_NODE": 148.9632,
       "ARG_OF_PERICENTER": 198.226, "MEAN_ANOMALY": 161.8473, "BSTAR": 0.00011847787,
       "MEAN_MOTION_DOT": 6.013e-05, "MEAN_MOTION_DDOT": 0, "EPHEMERIS_TYPE": 0,
       "CLASSIFICATION_TYPE": "U", "ELEMENT_SET_NO": 999, "REV_AT_EPOCH": 58776}

ISS_MODULE = {"OBJECT_NAME": "ISS (UNITY)", "NORAD_CAT_ID": 25551, "OBJECT_ID": "1998-067B",
              "EPOCH": "2026-09-28T11:09:10.000000", "MEAN_MOTION": 15.48701002,
              "ECCENTRICITY": 0.00082110, "INCLINATION": 51.6316, "RA_OF_ASC_NODE": 148.9640,
              "ARG_OF_PERICENTER": 198.3000, "MEAN_ANOMALY": 161.8000, "BSTAR": 0.00012000000,
              "MEAN_MOTION_DOT": 6.013e-05, "MEAN_MOTION_DDOT": 0}

#: A dead object: its last element set is months old, which is why age is always reported.
DEAD = {"OBJECT_NAME": "SATCOM (DEAD)", "NORAD_CAT_ID": 12345, "OBJECT_ID": "2001-001A",
        "EPOCH": "2001-02-03T00:00:00.000000", "MEAN_MOTION": 14.90000000,
        "ECCENTRICITY": 0.00120000, "INCLINATION": 92.4000, "RA_OF_ASC_NODE": 10.0,
        "ARG_OF_PERICENTER": 20.0, "MEAN_ANOMALY": 30.0, "BSTAR": 0.00040000,
        "MEAN_MOTION_DOT": 0, "MEAN_MOTION_DDOT": 0}

#: A row with no mean motion at all - Celestrak does not send one for some objects.
NO_MOTION = {"OBJECT_NAME": "NO MOTION", "NORAD_CAT_ID": 99999, "EPOCH": "2026-09-28T11:00:00",
             "MEAN_MOTION": "", "ECCENTRICITY": 0.0001, "INCLINATION": 50.0}

STATIONS = [ISS, ISS_MODULE, DEAD, NO_MOTION]

TLE_TEXT = ("ISS (ZARYA)              \n"
            "1 25544U 98067A   26271.46476993  .00006013  00000+0  11848-3 0  9990\n"
            "2 25544  51.6312 148.9632 0007159 198.2260 161.8473 15.48680135587767")


class FakeCelestrak:
    def __init__(self, stations=None, empty=False, fail=False, message=None, tle=TLE_TEXT):
        self.calls: list[dict] = []
        self.stations = STATIONS if stations is None else stations
        self.empty = empty
        self.fail = fail
        self.message = message
        self.tle = tle

    def __call__(self, url: str, params: dict):
        self.calls.append(dict(params or {}))
        if self.fail:
            raise SatelliteError("Celestrak is unreachable")
        if self.message is not None:
            return json.dumps(self.message)
        if params.get("FORMAT") == "tle":
            return self.tle
        if self.empty:
            return json.dumps([])
        if "CATNR" in params or "INTDES" in params:
            wanted = params.get("CATNR") or params.get("INTDES")
            return json.dumps([row for row in self.stations
                               if str(row["NORAD_CAT_ID"]) == str(wanted)
                               or row.get("OBJECT_ID") == wanted])
        if "NAME" in params:
            wanted = str(params["NAME"]).upper()
            return json.dumps([row for row in self.stations
                               if wanted in row["OBJECT_NAME"].upper()])
        return json.dumps(self.stations)


def make_data(**kw):
    feed = FakeCelestrak(**kw)
    return SatelliteData(fetch=feed), feed


class GeometryTests(unittest.TestCase):
    def test_altitude_from_mean_motion(self):
        #: 15.4868 rev/day is the ISS, and its mean altitude is about 427 km. Getting
        #: this right is the whole point of converting rev/day to rad/s first.
        axis = semi_major_axis_km(15.48680135)
        self.assertAlmostEqual(axis, 6798.72, delta=0.1)
        self.assertAlmostEqual(altitude_km(15.48680135), 427.72, delta=0.1)
        self.assertAlmostEqual(period_minutes(15.48680135), 92.982, delta=0.01)

    def test_kepler_holds_for_a_wider_orbit(self):
        #: 1.0 rev/day is a geostationary orbit, one day long and 35870 km up. The
        #: textbook figure of 35786 km is a mean solar day against a sidereal one, and
        #: the published mean motion is rounded, so the two differ by tens of km; what
        #: matters here is that the formula is applied to the units the feed uses.
        self.assertAlmostEqual(period_minutes(1.0), 1440.0, places=3)
        self.assertAlmostEqual(altitude_km(1.0), 35870.1, delta=1.0)
        #: A circular orbit's period must satisfy n^2 a^3 = mu, by definition. The
        #: brackets matter: `**` is right-associative, so a ** (1/3) ** 3 would be
        #: a ** ((1/3) ** 3) and quietly test nothing.
        rads = 1.0 * 2.0 * math.pi / 86400.0
        axis = (EARTH_MU / (rads * rads)) ** (1.0 / 3.0)
        self.assertAlmostEqual((axis ** 3) * rads * rads, EARTH_MU, places=3)
        self.assertAlmostEqual(axis, 42241.1, delta=0.5)

    def test_a_missing_or_impossible_mean_motion_is_not_a_number(self):
        self.assertIsNone(altitude_km(None))
        self.assertIsNone(altitude_km(""))
        self.assertIsNone(altitude_km(0))
        self.assertIsNone(period_minutes(-1))
        #: Celestrak publishes some fields as strings; both are accepted.
        self.assertAlmostEqual(altitude_km("15.48680135"), 427.72, delta=0.1)

    def test_an_epoch_is_a_moment_and_its_age_is_reported(self):
        moment = datetime.datetime(2026, 9, 28, 20, 0, tzinfo=datetime.timezone.utc)
        self.assertAlmostEqual(epoch_age_hours("2026-09-28T11:09:16.121952", moment), 8.847, places=2)
        self.assertIsNone(epoch_age_hours("rubbish"))
        self.assertIsNone(parse_epoch(None))
        self.assertIsNotNone(parse_epoch("2026-09-28T11:09:16Z"))

    def test_an_id_is_a_cat_number_or_a_designator(self):
        self.assertEqual(object_id_from_text("cat id 25544"), "25544")
        self.assertEqual(object_id_from_text("NORAD 25544 please"), "25544")
        self.assertEqual(object_id_from_text("what about 1998-067A?"), "1998-067A")
        self.assertIsNone(object_id_from_text("what satellites are overhead?"))


class ReadTests(unittest.TestCase):
    def test_the_stations_group(self):
        data, feed = make_data()
        overview = data.stations()
        self.assertEqual(overview["group"], "stations")
        self.assertEqual(feed.calls[-1], {"GROUP": "stations", "FORMAT": "json"})
        #: A row with no mean motion is still a tracked object, so it stays in the list.
        self.assertEqual(overview["count"], 4)
        names = [row["name"] for row in overview["rows"]]
        self.assertEqual(names, sorted(names))
        self.assertIsNotNone(overview["newest_hours"])
        self.assertGreater(overview["oldest_hours"], overview["newest_hours"])

    def test_one_element_set(self):
        data, feed = make_data()
        row = data.lookup("25544")
        self.assertEqual(feed.calls[-1], {"CATNR": "25544", "FORMAT": "json"})
        self.assertEqual(row["name"], "ISS (ZARYA)")
        self.assertEqual(row["international_designator"], "1998-067A")
        self.assertAlmostEqual(row["inclination"], 51.6312)
        self.assertAlmostEqual(row["altitude_km"], 427.72, delta=0.1)
        self.assertEqual(row["element_set_no"], 999)

    def test_a_designator_is_looked_up_as_one(self):
        data, feed = make_data()
        row = data.lookup("1998-067A")
        self.assertEqual(feed.calls[-1], {"INTDES": "1998-067A", "FORMAT": "json"})
        self.assertEqual(row["cat_id"], 25544)

    def test_a_name_returns_the_whole_station_stack(self):
        data, _feed = make_data()
        found = data.by_name("ISS")
        self.assertEqual(found["count"], 2)
        self.assertEqual([row["name"] for row in found["rows"]],
                         ["ISS (UNITY)", "ISS (ZARYA)"])

    def test_two_lines_come_back_verbatim(self):
        data, feed = make_data()
        data.tle("25544")
        self.assertEqual(feed.calls[-1], {"CATNR": "25544", "FORMAT": "tle"})
        result = data.tle("25544")
        self.assertEqual(len(result["lines"]), 3)
        self.assertIn("1 25544U 98067A", result["lines"][1])
        self.assertIn("2 25544  51.6312", result["lines"][2])

    def test_a_tle_needs_a_number(self):
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.tle("1998-067A")
        with self.assertRaises(ValueError):
            data.tle("   ")

    def test_nothing_found_is_not_a_failure(self):
        data, _feed = make_data(empty=True)
        with self.assertRaises(SatelliteNotFound):
            data.stations()
        with self.assertRaises(SatelliteNotFound):
            data.lookup("25544")
        with self.assertRaises(SatelliteNotFound):
            data.by_name("ISS")
        data, _feed = make_data(message={"error": "Invalid query."})
        with self.assertRaises(SatelliteNotFound):
            data.stations()
        with self.assertRaises(ValueError):
            data.lookup("  ")

    def test_a_dead_celestrak(self):
        data, _feed = make_data(fail=True)
        with self.assertRaises(SatelliteError):
            data.stations()


class RouteTests(unittest.TestCase):
    def test_the_station_list(self):
        self.assertEqual(route("what satellites are overhead?"), ("satellites-stations", {"group": "stations"}))
        self.assertEqual(route("which satellites are in orbit?")[0], "satellites-stations")

    def test_one_satellite(self):
        self.assertEqual(route("cat id 25544"), ("satellites-lookup", {"object_id": "25544"}))
        self.assertEqual(route("1998-067A")[0], "satellites-lookup")
        self.assertEqual(route("tell me about the ISS"),
                         ("satellites-name", {"query": "ISS"}))

    def test_a_tle_request(self):
        self.assertEqual(route("give me the TLE for cat id 25544"),
                         ("satellites-tle", {"object_id": "25544"}))
        #: A TLE without a number cannot be fetched, so it is not pretended at.
        self.assertEqual(route("give me the TLE for the ISS")[0], "help")

    def test_help_and_nonsense(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("what is the weather in Kansas?")[0], "help")


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
        from agent import SatellitesAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = SatellitesAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_free_station_list(self):
        result, client, _ = self.turn("what satellites are overhead?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("'stations' group: 4 tracked object(s)", result["text"])
        self.assertIn("ISS (ZARYA)  [cat 25544]", result["text"])
        self.assertIn("element set", result["text"])
        self.assertIn("Source: Celestrak GP two-line elements", result["text"])

    def test_a_free_lookup_reports_the_period_and_the_age(self):
        result, _, _ = self.turn("cat id 25544")
        self.assertIn("ISS (ZARYA)  [cat 25544]", result["text"])
        self.assertIn("designator: 1998-067A", result["text"])
        self.assertIn("mean motion: 15.4868 rev/day", result["text"])
        self.assertIn("period: 92.98 min", result["text"])
        self.assertIn("inclination: 51.6312 deg", result["text"])

    def test_a_name_search_returns_the_whole_stack(self):
        result, _, _ = self.turn("tell me about the ISS")
        self.assertIn("2 element set(s) matching 'ISS'", result["text"])
        self.assertIn("ISS (UNITY)", result["text"])

    def test_a_tle_comes_back_verbatim(self):
        result, _, _ = self.turn("give me the TLE for cat id 25544")
        self.assertIn("Two-line element set for cat 25544", result["text"])
        self.assertIn("1 25544U 98067A", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("two-line orbital elements", result["text"])
        self.assertIn("SGP4", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("what satellites are overhead?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_celestrak(self):
        result, _, _ = self.turn("what satellites are overhead?", fail=True)
        self.assertIn("I could not read Celestrak's elements", result["text"])


# ---------------------------------------------------------------------------
# The premium skill: satellites-orbit-shell
#
# No network: the licence check and the work both happen on the gateway, and the
# gateway's own JSON-RPC answers are injected into the real GatewayClient.
# ---------------------------------------------------------------------------

#: What `satellites_orbit_shell_board` answers for the stations group.
SHELL_DATA = {
    "group": "stations",
    "objects_in_group": 22,
    "objects_read": 22,
    "newest_hours": 0.4,
    "oldest_hours": 9.1,
    "shells": [
        {"altitude_km": 427.7, "period_minutes": 92.98, "count": 9,
         "members": [{"name": "ISS (ZARYA)", "cat_id": 25544, "inclination": 51.6312,
                      "altitude_km": 427.7}]},
        {"altitude_km": 541.6, "period_minutes": 95.6, "count": 6, "members": []},
    ],
    "shell_leader": {"altitude_km": 427.7, "period_minutes": 92.98,
                     "count": 9, "share_count": 9, "within_km": 25.0,
                     "leader_name": "ISS (ZARYA)"},
    "inclination_min": 41.5,
    "inclination_max": 98.7,
    "source": "Celestrak GP two-line elements (celestrak.org)",
}

#: The exact refusal the gateway sends for a key it will not accept.
GATEWAY_DENIAL = ("`satellites_orbit_shell_board` is a premium tool, but that licence key was "
                  "rejected. Check MCP_LICENSE_KEY, or get a key at https://polar.sh/mrfentmen")


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

    def turn(self, text: str, fetch, key: str):
        from agent import SatellitesAgent

        agent_conn, client_conn = connected_pair()
        data, _feed = make_data()
        gateway = GatewayClient(fetch=fetch, key=key, url="https://gateway.test/mcp")
        agent = SatellitesAgent(agent_conn, data, gateway=gateway)
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
        result, client = self.turn("which orbital shell is the ISS in?", fetch, "")
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
        result, _ = self.turn("which orbital shell is the ISS in?", fetch, "not-a-real-key")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn(GATEWAY_DENIAL, result["text"])
        self.assertIn("premium", result["text"])
        self.assertEqual(len(fetch.calls), 1)
        self.assertEqual(fetch.calls[0]["payload"]["params"]["name"],
                         "satellites_orbit_shell_board")

    def test_a_good_key_returns_the_orbit_board(self):
        fetch = gateway_answer(json.dumps(SHELL_DATA))
        result, _ = self.turn("which orbital shell is the ISS in?", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("element sets read: 22 of 22 in the group", result["text"])
        self.assertIn("shell at 427.7 km, period 92.98 min: 9 object(s)", result["text"])
        self.assertIn("ISS (ZARYA)  [cat 25544]", result["text"])
        self.assertIn("the ISS shell is 427.7 km", result["text"])
        self.assertIn("9 of the group sit within 25 km of it", result["text"])
        self.assertIn("inclination spread: 41.5 to 98.7 deg", result["text"])
        self.assertIn("so it is a mean", result["text"])
        self.assertIn("altitude, not the height at any one moment", result["text"])
        #: The licence key travels in a header and is never echoed back.
        self.assertEqual(fetch.calls[0]["headers"]["Authorization"], "Bearer k_paid")
        self.assertNotIn("k_paid", result["text"])

    def test_a_group_asked_for_by_name_is_sent_to_the_gateway(self):
        fetch = gateway_answer(json.dumps(SHELL_DATA))
        self.turn("how high are the geostationary satellites?", fetch, "k_paid")
        arguments = fetch.calls[0]["payload"]["params"]["arguments"]
        self.assertEqual(arguments["group"], "geo")

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def fetch(url, payload, headers):
            raise OSError("connection refused")

        result, _ = self.turn("which orbital shell is the ISS in?", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read Celestrak's elements", result["text"])

    def test_the_routing_is_narrow(self):
        premium = [
            "which orbital shell is the ISS in?",
            "how high is the ISS?",
            "how many satellites share the ISS orbit?",
            "group the stations by orbit shell",
        ]
        for text in premium:
            self.assertEqual(route(text)[0], "satellites-orbit-shell", text)

        free = [
            ("what satellites are overhead?", "satellites-stations"),
            ("cat id 25544", "satellites-lookup"),
            ("1998-067A", "satellites-lookup"),
            ("tell me about the ISS", "satellites-name"),
            ("give me the TLE for cat id 25544", "satellites-tle"),
            ("what can you do?", "help"),
            ("", "help"),
        ]
        for text, expected in free:
            self.assertEqual(route(text)[0], expected, text)

    def test_the_premium_skill_id_is_published(self):
        from agent import SKILLS

        self.assertIn("satellites-orbit-shell", SKILLS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
