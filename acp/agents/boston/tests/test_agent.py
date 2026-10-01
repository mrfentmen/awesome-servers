"""Tests for the boston agent: arrivals, alerts, the timetable, routing and turns.

    python3 agents/boston/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(predictions at place-pktrm, the Red Line's 22 stations from
`/stops?filter[route]=Red`, and a 486-row published timetable).
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
from data import (RED_LINE_STOPS, BostonData, BostonError,  # noqa: E402
                  BostonNotFound, destination_for, headway_minutes, station_from_text)

PARK_STREET = "place-pktrm"

#: `/stops?filter[route]=Red` answers with `place-*` ids only, and this is the
#: 22-row page read on 2026-09-28.
STOPS_PAGE = {"data": [{"type": "stop", "id": stop_id,
                       "attributes": {"name": name, "municipality": "Boston"}}
                      for stop_id, name in RED_LINE_STOPS]}

STOP_RECORD = {"data": {"type": "stop", "id": PARK_STREET, "attributes": {
    "name": "Park Street", "municipality": "Boston",
    "address": "Tremont St and Winter St, Boston, MA 02108",
    "latitude": 42.3563946, "longitude": -71.0624242,
    "wheelchair_boarding": 1}}}

PREDICTIONS = {"data": [
    {"type": "prediction", "id": "prediction-78545559-70075-70-Red", "attributes": {
        "arrival_time": "2026-09-28T23:09:37-04:00", "direction_id": 0, "status": None,
        "arrival_uncertainty": "60", "last_trip": False},
     "relationships": {"trip": {"data": {"id": "78545559"}}}},
    {"type": "prediction", "id": "prediction-78545545-70076-150-Red", "attributes": {
        "arrival_time": "2026-09-28T23:02:20-04:00", "direction_id": 1, "status": 1,
        "arrival_uncertainty": "300", "last_trip": False},
     "relationships": {"trip": {"data": {"id": "78545545"}}}},
    #: A row with no arrival and no departure at all: a dropped trip.
    {"type": "prediction", "id": "prediction-dropped", "attributes": {
        "arrival_time": None, "departure_time": None, "direction_id": 0},
     "relationships": {"trip": {"data": {"id": "dropped"}}}},
]}

ALERTS = {"data": [{
    "type": "alert", "id": "1033333", "attributes": {
        "cause": "MAINTENANCE", "effect": "SUSPENSION", "severity": 7,
        "header": "Green Line: No trains between North Station & Babcock St",
        "short_header": "No trains North Station & Babcock",
        "description": "Scope of Work:\r\nThis is to allow for work on critical signal "
                       "upgrades.\r\nUse buses instead.",
        "active_period": [{"start": "2026-09-26T03:00:00-04:00",
                           "end": "2026-10-05T03:00:00-04:00"}],
        "url": "https://www.mbta.com/alerts/1033333"}}]}

#: 486 rows is what one published week at Park Street is: 28 departures an hour in
#: the peaks, 11 at 05:00 and 20 at 23:00.
_TIMES = (["05:%02d" % minute for minute in (15, 24, 33, 42, 51)]
          + ["08:%02d" % minute for minute in range(0, 60, 2)]
          + ["08:00", "23:57"])

SCHEDULES = {"data": [
    {"type": "schedule", "id": f"schedule-{index}", "attributes": {
        "departure_time": f"2026-09-28T{value}:00-04:00", "direction_id": 0,
        "stop_sequence": 70}} for index, value in enumerate(_TIMES)]}


class FakeFeeds:
    def __init__(self, predictions=None, alerts=None, schedules=None, stops=None,
                 empty=False, fail=False):
        self.calls: list[str] = []
        self.params: list[dict] = []
        self.predictions = PREDICTIONS if predictions is None else predictions
        self.alerts = ALERTS if alerts is None else alerts
        self.schedules = SCHEDULES if schedules is None else schedules
        self.stops = STOPS_PAGE if stops is None else stops
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str, params: dict):
        self.calls.append(url)
        self.params.append(dict(params or {}))
        if self.fail:
            raise BostonError("MBTA is rate-limiting this client (HTTP 429)")
        if self.empty:
            return json.dumps({"data": []})
        if "/stops/" in url:
            return json.dumps(STOP_RECORD)
        if "predictions" in url:
            return json.dumps(self.predictions)
        if "alerts" in url:
            return json.dumps(self.alerts)
        if "schedules" in url:
            return json.dumps(self.schedules)
        return json.dumps(self.stops)


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return BostonData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_station_is_matched_on_its_whole_name(self):
        self.assertEqual(station_from_text("next Red Line train from Park Street?"),
                         (PARK_STREET, "Park Street"))
        self.assertEqual(station_from_text("anything at South Station"),
                         ("place-sstat", "South Station"))
        #: Longest first, so Quincy Center is not read as Quincy Adams.
        self.assertEqual(station_from_text("how long is the wait at Quincy Center?")[1],
                         "Quincy Center")
        self.assertEqual(station_from_text("departures from JFK/UMass")[1], "JFK/UMass")
        #: An unknown name is None, not a near miss on a station that is not there.
        self.assertIsNone(station_from_text("next train from Riverside"))
        self.assertIsNone(station_from_text("next train from Quinc"))
        self.assertIsNone(station_from_text(""))

    def test_a_raw_stop_id_is_accepted(self):
        self.assertEqual(station_from_text("predictions for place-alfcl")[0], "place-alfcl")

    def test_the_destination_comes_from_the_stops_position_on_the_line(self):
        #: direction_id 0 heads toward the south end: Ashmont from inside the
        #: trunk, Braintree from past Ashmont. 1 always heads to Alewife.
        self.assertEqual(destination_for(PARK_STREET, 0), "Ashmont")
        self.assertEqual(destination_for("place-qnctr", 0), "Braintree")
        self.assertEqual(destination_for("place-qnctr", 1), "Alewife")
        self.assertEqual(destination_for("place-brntn", 1), "not reported")
        self.assertEqual(destination_for("place-nowhere", 0), "not reported")

    def test_a_headway_is_the_median_gap(self):
        self.assertEqual(headway_minutes(["05:15", "05:24", "05:33"]), 9.0)
        #: A zero gap is two rows for one departure, so it is dropped, not counted.
        self.assertEqual(headway_minutes(["05:15", "05:15", "05:30"]), 15.0)
        self.assertIsNone(headway_minutes(["05:15"]))
        self.assertIsNone(headway_minutes([]))


class ReadTests(unittest.TestCase):
    def test_next_arrivals_are_sorted_and_carry_their_destination(self):
        data, feed = make_data()
        rows = data.predictions(PARK_STREET, limit=3)
        #: Fed newest-first on purpose: the reader has to sort.
        self.assertEqual([row["arrival_time"] for row in rows],
                         ["2026-09-28T23:02:20-04:00", "2026-09-28T23:09:37-04:00"])
        self.assertEqual(rows[0]["destination"], "Alewife")
        self.assertEqual(rows[1]["destination"], "Ashmont")
        self.assertEqual(feed.params[-1]["filter[stop]"], PARK_STREET)
        self.assertEqual(feed.params[-1]["filter[route]"], "Red")

    def test_status_and_uncertainty_are_read_as_mbta_publishes_them(self):
        data, _feed = make_data()
        rows = data.predictions(PARK_STREET)
        self.assertEqual(rows[0]["status"], 1)
        self.assertEqual(rows[0]["arrival_uncertainty_min"], 5)
        self.assertEqual(rows[1]["status"], None)
        self.assertEqual(rows[1]["arrival_uncertainty_min"], 1)

    def test_a_stop_that_is_not_red_line_is_a_value_error(self):
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.predictions("place-dwnxg".replace("dwnxg", "boston"))
        with self.assertRaises(ValueError):
            data.stop("node-1")

    def test_a_station_record(self):
        data, _feed = make_data()
        station = data.stop(PARK_STREET)
        self.assertEqual(station["name"], "Park Street")
        self.assertEqual(station["municipality"], "Boston")
        self.assertAlmostEqual(station["latitude"], 42.3563946)
        self.assertEqual(station["wheelchair_boarding"], 1)

    def test_an_alert_keeps_its_period_and_collapses_its_paragraphs(self):
        data, _feed = make_data()
        rows = data.alerts(PARK_STREET)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["effect"], "SUSPENSION")
        self.assertEqual(rows[0]["severity"], 7)
        self.assertEqual(rows[0]["active_from"], "2026-09-26T03:00:00-04:00")
        self.assertNotIn("\r", rows[0]["description"])
        self.assertIn("Scope of Work", rows[0]["description"])

    def test_the_timetable_is_grouped_by_local_clock_hour(self):
        data, feed = make_data()
        table = data.timetable(PARK_STREET, trips=1000)
        hours = table["departures_by_hour"]
        #: 08:00 appears twice in the fixture, and a duplicate is a real row, not
        #: a gap, so the count has to include it.
        self.assertEqual(hours["05"], 5)
        self.assertEqual(hours["08"], 31)
        self.assertEqual(table["rows"], len(_TIMES))
        self.assertFalse(table["truncated"])
        self.assertEqual(table["earliest"], "05:15")
        self.assertEqual(table["latest"], "23:57")
        self.assertEqual(feed.params[-1]["filter[stop]"], PARK_STREET)

    def test_the_station_list_costs_no_call(self):
        data, feed = make_data()
        rows = data.stations()
        self.assertEqual(len(rows), 22)
        self.assertEqual(rows[0]["name"], "Alewife")
        self.assertEqual(rows[-1]["name"], "Braintree")
        self.assertTrue(rows[0]["terminal"])
        self.assertEqual(feed.calls, [])

    def test_a_dead_or_empty_feed(self):
        data, _feed = make_data(empty=True)
        with self.assertRaises(BostonNotFound):
            data.predictions(PARK_STREET)
        with self.assertRaises(BostonNotFound):
            data.timetable(PARK_STREET)
        data, _feed = make_data(fail=True)
        with self.assertRaises(BostonError):
            data.predictions(PARK_STREET)
        data, _feed = make_data(predictions={"errors": [{"detail": "bad filter"}]})
        with self.assertRaises(BostonError):
            data.predictions(PARK_STREET)


class RouteTests(unittest.TestCase):
    def test_the_next_train(self):
        self.assertEqual(route("when is the next Red Line train from Park Street?"),
                         ("boston-next", {"stop_id": PARK_STREET}))
        self.assertEqual(route("any Red Line arrivals at South Station?"),
                         ("boston-next", {"stop_id": "place-sstat"}))

    def test_alerts_and_station_records(self):
        self.assertEqual(route("any alerts at Park Street?"),
                         ("boston-alerts", {"stop_id": PARK_STREET}))
        self.assertEqual(route("what is Alewife's station record?")[0], "boston-station")
        self.assertEqual(route("where is Kendall/MIT located?")[0], "boston-station")

    def test_the_station_list(self):
        self.assertEqual(route("which stations are on the Red Line?"),
                         ("boston-stations", {}))
        self.assertEqual(route("list the Red Line stations")[0], "boston-stations")

    def test_a_count_of_trains_is_the_free_timetable_not_the_wait(self):
        self.assertEqual(route("how many trains leave South Station each hour of the day?"),
                         ("boston-timetable", {"stop_id": "place-sstat"}))
        self.assertEqual(route("departures from Park Street by hour")[0], "boston-timetable")

    def test_the_wait_skill(self):
        for text in ("how long do I wait at Park Street at 8am?",
                     "what is the worst gap between Red Line trains at South Station?",
                     "how often do trains run from Alewife?",
                     "how crowded is Park Street at rush hour?"):
            skill, params = route(text)
            self.assertEqual(skill, "boston-wait", text)
            self.assertIn("stop_id", params)

    def test_help_and_nonsense(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("how long is the wait?")[0], "help")
        self.assertEqual(route("tell me a joke")[0], "help")


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
        from agent import BostonAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = BostonAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_next_train_answer(self):
        result, client, _ = self.turn("when is the next Red Line train from Park Street?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("next Red Line trains at Park Street", result["text"])
        self.assertIn("23:02 to Alewife (direction 1)", result["text"])
        self.assertIn("+/-5 min", result["text"])
        self.assertIn("[MBTA says LATE]", result["text"])
        self.assertIn("arrival_uncertainty", result["text"])

    def test_an_alert_answer(self):
        result, _, _ = self.turn("any alerts at Park Street?")
        self.assertIn("MBTA alerts on Park Street (1)", result["text"])
        self.assertIn("[SUSPENSION severity 7]", result["text"])
        self.assertIn("https://www.mbta.com/alerts/1033333", result["text"])

    def test_no_alerts_is_the_good_answer(self):
        result, _, _ = self.turn("any alerts at Park Street?", alerts={"data": []})
        self.assertIn("no service alert on Park Street", result["text"])
        self.assertIn("means no published disruption", result["text"])

    def test_the_timetable_answer(self):
        result, _, _ = self.turn("how many trains leave Park Street each hour of the day?")
        self.assertIn("published Red Line departures from Park Street", result["text"])
        self.assertIn("busiest hour: 08:00 with 31 departure(s)", result["text"])
        self.assertIn("quietest hour: 23:00 with 1 departure(s)", result["text"])

    def test_the_station_list_costs_nothing(self):
        result, client, feed = self.turn("which stations are on the Red Line?")
        self.assertIn("01. Alewife (place-alfcl) (terminus)", result["text"])
        self.assertIn("22. Braintree (place-brntn) (terminus)", result["text"])
        self.assertEqual(feed.calls, [])

    def test_a_station_record(self):
        result, _, _ = self.turn("what is Park Street's station record?")
        self.assertIn("Park Street (place-pktrm)", result["text"])
        self.assertIn("wheelchair boarding: yes", result["text"])
        self.assertIn("Red Line: stop 8 of 22", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("next Red Line train from Park Street", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("when is the next Red Line train from Park Street?",
                                 permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_api(self):
        result, _, _ = self.turn("when is the next Red Line train from Park Street?", fail=True)
        self.assertIn("I could not read the MBTA's public data", result["text"])

    def test_an_empty_board_is_not_a_read_failure(self):
        #: The Red Line does not run overnight, so MBTA answers HTTP 200 with an empty
        #: prediction list in the small hours - confirmed against the live API on
        #: 2026-09-29 (200, `data: []`, no errors). That is the truth about the service,
        #: not an outage, and it must not be reported as one.
        result, _, _ = self.turn("when is the next Red Line train from Park Street?",
                                 empty=True)
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("The MBTA answered, but published nothing", result["text"])
        self.assertNotIn("I could not read", result["text"])

    def test_no_station_named(self):
        result, _, _ = self.turn("next train?")
        self.assertIn("name a Red Line station", result["text"])


# ---------------------------------------------------------------------------
# The premium skill: boston-wait
#
# No network: the licence check and the work both happen on the gateway, and the
# gateway's own JSON-RPC answers are injected into the real GatewayClient.
# ---------------------------------------------------------------------------

#: What `boston_wait_profile` answers for Park Street: 28 departures an hour in
#: the peak, 11 at 05:00, and a 14 minute gap at 02:00 while the line is thin.
WAIT_DATA = {
    "stop_id": PARK_STREET,
    "station": "Park Street",
    "rows_used": 486,
    "rows_requested": 1000,
    "truncated": False,
    "days_covered": "one published week",
    "peak_hour": {"hour": "08", "departures": 28, "median_gap_min": 2.1},
    "quiet_hour": {"hour": "05", "departures": 11, "median_gap_min": 9.0},
    "tightest_headway_hour": {"hour": "08", "departures": 28, "median_gap_min": 2.1},
    "worst_gap": {"hour": "02", "minutes": 14.0, "clock_time": "14:00"},
    "median_headway_min": {"02": 14.0, "05": 9.0, "08": 2.1, "23": 7.0},
    "right_now": {
        "local_time_now": "23:05",
        "next_arrival": "23:09",
        "next_destination": "Ashmont",
        "minutes_until_next": 4.0,
        "next_gap_min": 3.0,
        "note": "the gap between the next two live arrivals",
    },
    "alerts": [{"effect": "SUSPENSION", "cause": "MAINTENANCE",
                "short_header": "No trains North Station & Babcock",
                "active_from": "2026-09-26T03:00:00-04:00",
                "active_until": "2026-10-05T03:00:00-04:00"}],
    "unit": "minutes between published departures, local clock hours",
    "accuracy": "a timetable figure, not a crowd count: MBTA publishes no passenger load",
    "source": "MBTA API v3 schedules + predictions + alerts (api-v3.mbta.com)",
}

#: The exact refusal the gateway sends for a key it will not accept.
GATEWAY_DENIAL = ("`boston_wait_profile` is a premium tool, but that licence key was rejected. "
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

    WAIT_QUESTION = "how long do I wait at Park Street at 8am?"

    def turn(self, text: str, fetch, key: str):
        from agent import BostonAgent

        agent_conn, client_conn = connected_pair()
        data, _feed = make_data()
        gateway = GatewayClient(fetch=fetch, key=key, url="https://gateway.test/mcp")
        agent = BostonAgent(agent_conn, data, gateway=gateway)
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
        result, client = self.turn(self.WAIT_QUESTION, fetch, "")
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
        result, _ = self.turn(self.WAIT_QUESTION, fetch, "not-a-real-key")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn(GATEWAY_DENIAL, result["text"])
        self.assertIn("premium", result["text"])
        self.assertEqual(len(fetch.calls), 1)
        self.assertEqual(fetch.calls[0]["payload"]["params"]["name"], "boston_wait_profile")
        self.assertEqual(fetch.calls[0]["payload"]["params"]["arguments"],
                         {"stop_id": PARK_STREET})

    def test_a_good_key_returns_the_wait_profile(self):
        fetch = gateway_answer(json.dumps(WAIT_DATA))
        result, _ = self.turn(self.WAIT_QUESTION, fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("busiest hour: 08:00, median wait 2.1 min", result["text"])
        self.assertIn("worst single gap: 14 min at 02:00", result["text"])
        self.assertIn("quietest hour: 05:00, median wait 9 min", result["text"])
        self.assertIn("next train at 23:09", result["text"])
        self.assertIn("service alerts touching this station right now: 1", result["text"])
        self.assertIn("not a crowd count", result["text"])
        self.assertIn("MBTA API v3", result["text"])
        #: The licence key travels in a header and is never echoed back.
        self.assertEqual(fetch.calls[0]["headers"]["Authorization"], "Bearer k_paid")
        self.assertNotIn("k_paid", result["text"])

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def fetch(url, payload, headers):
            raise OSError("connection refused")

        result, _ = self.turn(self.WAIT_QUESTION, fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read the MBTA's public data", result["text"])

    def test_a_free_question_never_touches_the_gateway(self):
        fetch = gateway_answer(json.dumps(WAIT_DATA))
        result, _ = self.turn("when is the next Red Line train from Park Street?", fetch,
                              "k_paid")
        self.assertIn("23:02 to Alewife", result["text"])
        self.assertEqual(fetch.calls, [])

    def test_the_routing_is_narrow(self):
        premium = [
            "how long do I wait at Park Street?",
            "what is the worst gap between trains at South Station?",
            "how often do trains run from Alewife?",
            "how crowded is Park Street at rush hour?",
            "what is the headway at Downtown Crossing?",
        ]
        for text in premium:
            skill, params = route(text)
            self.assertEqual(skill, "boston-wait", text)
            self.assertTrue(params["stop_id"].startswith("place-"), text)

        free = [
            ("when is the next Red Line train from Park Street?", "boston-next"),
            ("next train at South Station", "boston-next"),
            ("any alerts at Park Street?", "boston-alerts"),
            ("is the Red Line suspended?", "boston-alerts"),
            ("what is Alewife's station record?", "boston-station"),
            ("where is Park Street?", "boston-station"),
            ("which stations are on the Red Line?", "boston-stations"),
            ("how many trains leave Park Street each hour?", "boston-timetable"),
            ("departures from South Station by hour", "boston-timetable"),
            ("what can you do?", "help"),
            ("", "help"),
        ]
        for text, expected in free:
            self.assertEqual(route(text)[0], expected, text)

    def test_the_premium_skill_id_is_published(self):
        from agent import SKILLS

        self.assertIn("boston-wait", SKILLS)
        self.assertIn("boston-next", SKILLS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
