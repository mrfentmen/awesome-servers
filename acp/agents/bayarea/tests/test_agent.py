"""Tests for the bayarea agent: the board, bikes, stations, routing and turns.

    python3 agents/bayarea/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(Embarcadero, 5 trains, `estimate[].minutes` = "Leaving" then numbers, `delay` in
seconds, and BART's 50-station list from `stn.aspx?cmd=stns`).
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

from acp_kit import AcpClient, Connection, STOP_END_TURN, STOP_REFUSAL

from agent import route  # noqa: E402
from data import (BART_STATIONS, BartData, BartError, BartNotFound,  # noqa: E402
                  all_stations, median, minutes_from_board, station_from_text)

EMBR = "EMBR"

#: `etd.aspx?cmd=etd&orig=EMBR`, read 2026-09-28: a train at the platform now, a
#: ten-minute-late Richmond train, and a punctual SFO train. The last train has
#: three estimates, which is how BART publishes a train that has slipped.
_BOARD = {"root": {
    "@id": "1",
    "date": "09/28/2026",
    "time": "08:18:33 PM PDT",
    "station": [{
        "name": "Embarcadero",
        "abbr": "EMBR",
        "etd": [
            {"destination": "Daly City", "abbreviation": "DALY", "limited": "0", "estimate": [
                {"minutes": "Leaving", "platform": "1", "direction": "South", "length": "6",
                 "color": "#ffffff", "bikeflag": "1", "delay": "93", "cancelflag": "0",
                 "dynamicflag": "0"},
                {"minutes": "2", "platform": "1", "direction": "South", "length": "6",
                 "color": "#ffffff", "bikeflag": "1", "delay": "0", "cancelflag": "0",
                 "dynamicflag": "0"}]},
            {"destination": "Richmond", "abbreviation": "RICH", "limited": "0", "estimate": [
                {"minutes": "2", "platform": "2", "direction": "North", "length": "5",
                 "color": "#ffff33", "bikeflag": "1", "delay": "608", "cancelflag": "0",
                 "dynamicflag": "0"}]},
            {"destination": "SFO/Millbrae", "abbreviation": "SFO/", "limited": "0", "estimate": [
                {"minutes": "3", "platform": "1", "direction": "South", "length": "9",
                 "color": "#ffffff", "bikeflag": "0", "delay": "0", "cancelflag": "0",
                 "dynamicflag": "0"}]},
            {"destination": "Dublin/Pleasanton", "abbreviation": "DUBL", "limited": "0",
             "estimate": [
                 {"minutes": "7", "platform": "2", "direction": "North", "length": "6",
                  "color": "#ffff33", "bikeflag": "1", "delay": "1155", "cancelflag": "0",
                  "dynamicflag": "0"}]},
            {"destination": "Antioch", "abbreviation": "ANTC", "limited": "0", "estimate": [
                {"minutes": "10", "platform": "2", "direction": "North", "length": "10",
                 "color": "#ffff33", "bikeflag": "1", "delay": "437", "cancelflag": "0",
                 "dynamicflag": "0"}]},
        ],
    }],
}}

#: A train BART published with no usable estimate at all.
_BOARD_NO_ESTIMATE = {"root": {
    "date": "09/28/2026", "time": "08:18:33 PM PDT",
    "station": [{"name": "Embarcadero", "abbr": "EMBR", "etd": [
        {"destination": "SFO/Millbrae", "abbreviation": "SFO/", "limited": "0", "estimate": []},
    ]}],
}}

#: BART answers HTTP 200 with an error object in the body, not a 4xx.
_ERROR = {"root": {"message": {"error": {
    "text": "Invalid orig",
    "details": "The orig station parameter NOWHERE is missing or invalid."}}}}

STATION_LIST = {"root": {"stations": {"station": [
    {"name": name, "abbr": abbr, "city": "Oakland", "state": "CA", "zipcode": "94612",
     "gtfs_latitude": "37.803768", "gtfs_longitude": "-122.271450"}
    for abbr, name in BART_STATIONS]}}}


class FakeFeeds:
    def __init__(self, board=None, stations=None, empty=False, fail=False):
        self.calls: list[str] = []
        self.params: list[dict] = []
        self.board = _BOARD if board is None else board
        self.stations = STATION_LIST if stations is None else stations
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str, params: dict):
        self.calls.append(url)
        self.params.append(dict(params or {}))
        if self.fail:
            raise BartError("BART answered HTTP 500; its station-list endpoint does return 500 "
                            "sometimes and then comes back")
        if "stn.aspx" in url:
            return json.dumps(self.stations)
        if self.empty:
            return json.dumps({"root": {"date": "09/28/2026", "time": "8:00 PM",
                                        "station": [{"name": "Embarcadero", "abbr": "EMBR",
                                                     "etd": []}]}})
        return json.dumps(self.board)


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return BartData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_station_is_matched_on_its_whole_name(self):
        self.assertEqual(station_from_text("next BART trains from Embarcadero"),
                         (EMBR, "Embarcadero"))
        self.assertEqual(station_from_text("the board at Montgomery St."),
                         ("MONT", "Montgomery St."))
        #: Longest first: Dublin/Pleasanton must not be read as Pleasant Hill.
        self.assertEqual(station_from_text("Dublin/Pleasanton")[1], "Dublin/Pleasanton")
        self.assertEqual(station_from_text("West Oakland")[1], "West Oakland")
        self.assertIsNone(station_from_text("next train from Riverside"))
        self.assertIsNone(station_from_text(""))

    def test_a_four_letter_code_is_accepted(self):
        self.assertEqual(station_from_text("what is on the board at MLPT?")[1], "Milpitas")

    def test_leaving_is_zero_minutes_not_a_parse_error(self):
        self.assertEqual(minutes_from_board("Leaving"), 0.0)
        self.assertEqual(minutes_from_board("leaving"), 0.0)
        self.assertEqual(minutes_from_board("13"), 13.0)
        self.assertIsNone(minutes_from_board(""))
        self.assertIsNone(minutes_from_board("soon"))

    def test_the_station_table_is_fifty_rows_and_costs_nothing(self):
        rows = all_stations()
        self.assertEqual(len(rows), 50)
        self.assertEqual(rows[0], {"abbr": "12TH", "name": "12th St. Oakland City Center",
                                   "position": 1})
        self.assertEqual(rows[19]["abbr"], "EMBR")

    def test_a_median(self):
        self.assertEqual(median([1, 2, 3]), 2)
        self.assertEqual(median([1, 2, 3, 4]), 2.5)
        self.assertIsNone(median([]))


class ReadTests(unittest.TestCase):
    def test_the_board_is_sorted_and_leading_is_zero_minutes(self):
        data, feed = make_data()
        board = data.board(EMBR)
        self.assertEqual(board["name"], "Embarcadero")
        self.assertEqual([train["minutes"] for train in board["trains"]],
                         [0.0, 2.0, 3.0, 7.0, 10.0])
        self.assertEqual(feed.params[-1]["orig"], EMBR)
        self.assertEqual(feed.params[-1]["cmd"], "etd")

    def test_direction_platform_and_cars_come_off_the_estimate(self):
        data, _feed = make_data()
        board = data.board(EMBR)
        richmond = [train for train in board["trains"] if train["destination"] == "Richmond"][0]
        self.assertEqual(richmond["direction"], "North")
        self.assertEqual(richmond["platform"], "2")
        self.assertEqual(richmond["cars"], 5)
        self.assertTrue(richmond["bikes_allowed"])

    def test_delay_is_signed_seconds_not_a_flag(self):
        data, _feed = make_data()
        board = data.board(EMBR)
        by_destination = {train["destination"]: train for train in board["trains"]}
        #: 608 seconds is over ten minutes late, and 0 is on time.
        self.assertEqual(by_destination["Richmond"]["delay_seconds"], 608)
        self.assertEqual(by_destination["SFO/Millbrae"]["delay_seconds"], 0)
        self.assertEqual(by_destination["Dublin/Pleasanton"]["delay_seconds"], 1155)

    def test_a_train_with_no_estimate_is_still_reported(self):
        data, _feed = make_data(board=_BOARD_NO_ESTIMATE)
        board = data.board(EMBR)
        self.assertEqual(len(board["trains"]), 1)
        self.assertIsNone(board["trains"][0]["minutes"])
        self.assertEqual(board["trains"][0]["destination"], "SFO/Millbrae")

    def test_bike_flag_is_read_per_estimate(self):
        data, _feed = make_data()
        board = data.board(EMBR)
        by_destination = {train["destination"]: train for train in board["trains"]}
        self.assertTrue(by_destination["Antioch"]["bikes_allowed"])
        self.assertFalse(by_destination["SFO/Millbrae"]["bikes_allowed"])

    def test_the_agency_station_list(self):
        data, feed = make_data()
        rows = data.station_list()
        self.assertEqual(len(rows), 50)
        self.assertEqual(rows[19]["abbr"], "EMBR")
        self.assertEqual(rows[19]["name"], "Embarcadero")
        self.assertEqual(rows[19]["state"], "CA")
        self.assertEqual(feed.params[-1]["cmd"], "stns")

    def test_bart_answers_200_with_an_error_in_the_body(self):
        data, _feed = make_data(board=_ERROR)
        with self.assertRaises(BartNotFound) as caught:
            data.board("EMBR")
        self.assertIn("Invalid orig", str(caught.exception))

    def test_a_dead_or_empty_feed(self):
        data, _feed = make_data(empty=True)
        with self.assertRaises(BartNotFound):
            data.board(EMBR)
        data, _feed = make_data(fail=True)
        with self.assertRaises(BartError):
            data.board(EMBR)
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.board("NOPE")


class RouteTests(unittest.TestCase):
    def test_the_board(self):
        self.assertEqual(route("next BART trains from Embarcadero"),
                         ("bayarea-board", {"abbr": EMBR, "name": "Embarcadero"}))
        self.assertEqual(route("what is on the board at Milpitas?")[0], "bayarea-board")

    def test_bikes_and_where(self):
        self.assertEqual(route("which BART trains from Milpitas take bikes?")[0],
                         "bayarea-bikes")
        self.assertEqual(route("how many cars on the next train from Daly City?")[0],
                         "bayarea-bikes")
        self.assertEqual(route("where is EMBR?")[0], "bayarea-where")
        self.assertEqual(route("which platform do northbound trains use at Montgomery St.?")[0],
                         "bayarea-where")

    def test_the_station_list(self):
        self.assertEqual(route("which BART stations are there?"), ("bayarea-stations", {}))
        self.assertEqual(route("list the stations")[0], "bayarea-stations")

    def test_the_plan_needs_a_station_a_budget_and_a_plan_word(self):
        skill, params = route("if I need to be somewhere in 25 minutes, which train should I get "
                              "on from Embarcadero?")
        self.assertEqual(skill, "bayarea-plan")
        self.assertEqual(params["abbr"], EMBR)
        self.assertEqual(params["minutes"], 25)
        self.assertEqual(route("can I make it to Berkeley in 1 hour from Embarcadero?")[1]
                         ["minutes"], 60)
        self.assertEqual(route("how long do I have from Embarcadero in 90 min?")[1]["minutes"], 90)

    def test_a_board_question_is_never_a_plan(self):
        self.assertEqual(route("next BART trains from Embarcadero")[0], "bayarea-board")
        self.assertEqual(route("list all trains at Embarcadero")[0], "bayarea-board")
        self.assertEqual(route("train times at Embarcadero in 20 minutes")[0], "bayarea-board")

    def test_help_and_nonsense(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("tell me a joke")[0], "help")
        #: A plan word with no station in it still reaches the board reader, which
        #: then says which station is missing instead of answering with help text.
        self.assertEqual(route("which train should I get on?")[0], "bayarea-board")


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
        from agent import BayAreaAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = BayAreaAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_board_answer(self):
        result, client, _ = self.turn("next BART trains from Embarcadero")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("next BART trains from Embarcadero", result["text"])
        self.assertIn("leaving now to Daly City (South, platform 1, 6 cars) - 2 min late",
                      result["text"])
        self.assertIn("in 2 min to Richmond (North, platform 2, 5 cars) - 10 min late",
                      result["text"])
        self.assertIn("in 3 min to SFO/Millbrae", result["text"])
        self.assertIn("on time", result["text"])
        self.assertIn("signed number of seconds", result["text"])

    def test_a_bikes_answer(self):
        result, _, _ = self.turn("which BART trains from Embarcadero take bikes?")
        self.assertIn("bikes and carriages on the next trains from Embarcadero", result["text"])
        self.assertIn("to SFO/Millbrae: bikes not allowed", result["text"])
        self.assertIn("to Antioch: bikes allowed, 10 cars", result["text"])

    def test_a_where_answer(self):
        result, _, _ = self.turn("where is EMBR?")
        self.assertIn("Embarcadero is BART station EMBR", result["text"])
        self.assertIn("North-bound trains leave from platform 2", result["text"])
        self.assertIn("not a standing fact", result["text"])

    def test_the_station_list_costs_nothing(self):
        result, client, feed = self.turn("which BART stations are there?")
        self.assertIn("BART's 50 stations", result["text"])
        self.assertIn("Embarcadero (EMBR)", result["text"])
        self.assertEqual(feed.calls, [])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("next BART trains from Embarcadero", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("next BART trains from Embarcadero", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_api(self):
        result, _, _ = self.turn("next BART trains from Embarcadero", fail=True)
        self.assertIn("I could not read BART's board", result["text"])

    def test_no_station_named(self):
        result, _, _ = self.turn("next train?")
        self.assertIn("name a BART station", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `bayarea_deadline_plan` answers for a 25 minute budget at Embarcadero:
#: the 10 minute Antioch train is the last one that fits, and the 7 minute
#: Dublin/Pleasanton train is wait, no - it fits too, and the board reaches 10.
PLAN_DATA = {
    "station": "Embarcadero",
    "abbr": "EMBR",
    "budget_minutes": 25,
    "board": {"published_date": "09/28/2026", "published_time": "08:18:33 PM PDT",
              "trains_on_board": 5, "reaches_minutes_in": 10.0},
    "last_catchable": {"minutes": 10.0, "destination": "Antioch", "destination_code": "ANTC",
                       "direction": "North", "platform": "2", "cars": 10, "bikes_allowed": True,
                       "delay_seconds": 437, "slack_minutes": 15.0},
    "first_miss": {"minutes": None,
                   "note": "every train on the board fits inside the budget"},
    "by_direction": {
        "North": {"trains": 3, "median_gap_min": 4.0, "max_gap_min": 5.0,
                  "first_in_min": 2.0, "last_in_min": 10.0},
        "South": {"trains": 2, "median_gap_min": 1.5, "max_gap_min": 3.0,
                  "first_in_min": 0.0, "last_in_min": 3.0},
    },
    "board_minutes": 10.0,
    "late_trains": [
        {"minutes": 2.0, "destination": "Richmond", "delay_seconds": 608},
        {"minutes": 7.0, "destination": "Dublin/Pleasanton", "delay_seconds": 1155},
        {"minutes": 10.0, "destination": "Antioch", "delay_seconds": 437},
    ],
    "trains": [{"minutes": 0.0, "destination": "Daly City", "direction": "South",
                "platform": "1", "cars": 6, "bikes_allowed": True, "delay_seconds": 93,
                "cancelled": False, "limited": False}],
    "accuracy": "a plan over the trains BART has on the board right now",
    "source": "BART public API real-time departure board (api.bart.gov)",
}

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
