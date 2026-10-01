"""Tests for the BART server.

    python3 servers/bart/tests/test_agent.py
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
    SKILL_LAST_DEPARTURE,
    BartAgent,
    parse,
    station_from_text,
)
from data import (  # noqa: E402
    DATASET,
    DEMO_KEY,
    MAX_DEPARTURES,
    BartClient,
    flag,
    matches_direction,
)

STATIONS = [
    {"name": "Embarcadero", "abbr": "EMBR", "address": "298 Market St", "city": "San Francisco",
     "county": "san francisco", "state": "CA", "zipcode": "94105",
     "gtfs_latitude": "37.792481", "gtfs_longitude": "-122.396777"},
    {"name": "Pittsburg/Bay Point", "abbr": "PITT", "address": "1400 Civic Dr", "city": "Pittsburg",
     "county": "contra costa", "state": "CA", "zipcode": "94565",
     "gtfs_latitude": "38.018368", "gtfs_longitude": "-121.883716"},
    {"name": "Pittsburg Center", "abbr": "PCTR", "address": "2301 Railroad St", "city": "Pittsburg",
     "county": "contra costa", "state": "CA", "zipcode": "94565",
     "gtfs_latitude": "38.011271", "gtfs_longitude": "-121.890913"},
    {"name": "Downtown Berkeley", "abbr": "DBRK", "address": "2005 Center St", "city": "Berkeley",
     "county": "alameda", "state": "CA", "zipcode": "94704",
     "gtfs_latitude": "37.869780", "gtfs_longitude": "-122.268159"},
    {"name": "North Berkeley", "abbr": "NBRK", "address": "2200 University Ave", "city": "Berkeley",
     "county": "alameda", "state": "CA", "zipcode": "94704",
     "gtfs_latitude": "37.867908", "gtfs_longitude": "-122.272742"},
    {"name": "South San Francisco", "abbr": "SSAN", "address": "1333 El Camino Real",
     "city": "South San Francisco", "county": "san mateo", "state": "CA", "zipcode": "94080",
     "gtfs_latitude": "37.654700", "gtfs_longitude": "-122.407127"},
    {"name": "San Francisco International Airport", "abbr": "SFIA", "address": "780 S Airport Blvd",
     "city": "San Francisco Int'l Airport", "county": "san mateo", "state": "CA", "zipcode": "94028",
     "gtfs_latitude": "37.621312", "gtfs_longitude": "-122.378955"},
    {"name": "12th St. Oakland City Center", "abbr": "12TH", "address": "1150 Broadway",
     "city": "Oakland", "county": "alameda", "state": "CA", "zipcode": "94607",
     "gtfs_latitude": "37.803370", "gtfs_longitude": "-122.270830"},
    {"name": "19th St. Oakland", "abbr": "19TH", "address": "1901 Broadway",
     "city": "Oakland", "county": "alameda", "state": "CA", "zipcode": "94612",
     "gtfs_latitude": "37.808100", "gtfs_longitude": "-122.268550"},
    {"name": "Oakland International Airport", "abbr": "OAKL", "address": "1 Airport Dr",
     "city": "Oakland", "county": "alameda", "state": "CA", "zipcode": "94621",
     "gtfs_latitude": "37.712560", "gtfs_longitude": "-122.219720"},
    {"name": "West Oakland", "abbr": "WOAK", "address": "1401 7th St",
     "city": "Oakland", "county": "alameda", "state": "CA", "zipcode": "94607",
     "gtfs_latitude": "37.804500", "gtfs_longitude": "-122.294840"},
]


def estimate(minutes, platform="2", direction="North", colour="YELLOW", length="9",
             bike="1", cancel="0", dynamic="0"):
    return {"minutes": str(minutes), "platform": platform, "direction": direction,
            "length": length, "color": colour, "hexcolor": "#ffff33", "bikeflag": bike,
            "delay": "0", "cancelflag": cancel, "dynamicflag": dynamic}


def etd(destination, abbreviation, estimates, limited="0"):
    return {"destination": destination, "abbreviation": abbreviation, "limited": limited,
            "estimate": estimates}


EMBARCADERO_BOARD = {
    "date": "09/28/2026",
    "time": "08:33:17 PM PDT",
    "station": [{
        "name": "Embarcadero", "abbr": "EMBR",
        "etd": [
            etd("SFO/Millbrae", "MLBR", [estimate(8, "1", "South"), estimate(28, "1", "South")]),
            etd("Antioch", "ANTC", [estimate(9, "2", "North"), estimate(27, "2", "North")]),
            etd("Dublin/Pleasanton", "DUBL",
                [estimate(14, "2", "North", "BLUE", "6"), estimate(34, "2", "North", "BLUE", "6")]),
            etd("Richmond", "RICH", [estimate(15, "2", "North", "RED", "5", "0")], limited="1"),
        ],
    }],
}

DISRUPTED_BOARD = {
    "date": "09/28/2026", "time": "08:33:17 PM PDT",
    "station": [{
        "name": "Pittsburg/Bay Point", "abbr": "PITT",
        "etd": [
            etd("Antioch", "ANTC", [estimate(29, "1", "North"), estimate(45, "1", "North")]),
            etd("SFO/Millbrae", "MLBR",
                [estimate(31, "1", "South", cancel="1"), estimate(50, "1", "South", dynamic="1")],
                limited="1"),
        ],
    }],
}


def _no_network(*args, **kwargs):
    raise AssertionError("FakeBart must not touch the network")


class FakeBart(BartClient):
    """Same interface as BartClient, no network. Derived helpers stay real."""

    def __init__(self, board=None, stations=None, empty_board=False) -> None:
        super().__init__(fetch=_no_network)
        self.the_board = EMBARCADERO_BOARD if board is None else board
        self.station_rows = list(STATIONS if stations is None else stations)
        self.empty_board = empty_board
        self.reads = []

    def board(self, station, direction=None):
        self.reads.append(("board", station, direction))
        if self.empty_board:
            return {"station": station, "name": None, "clock": {"date": None, "time": None},
                    "departures": [], "destinations": []}
        root = self.the_board
        raw = (root.get("station") or [{}])[0]
        departures = []
        for row in raw.get("etd") or []:
            departure = self._departure(row)
            if departure and (not direction or matches_direction(departure, direction)):
                departures.append(departure)
        departures.sort(key=lambda departure: departure["estimates"][0]["minutes"])
        return {
            "station": raw.get("abbr", station),
            "name": raw.get("name"),
            "clock": {"date": root.get("date"), "time": root.get("time")},
            "departures": departures,
            "destinations": sorted({departure["destination"] for departure in departures}),
        }

    def board_rows(self, station, direction=None):
        rows = []
        for departure in self.board(station, direction=direction)["departures"]:
            for row in departure["estimates"]:
                rows.append({"destination": departure["destination"],
                             "abbreviation": departure["abbreviation"],
                             "limited": departure["limited"], **row})
        rows.sort(key=lambda row: row["minutes"])
        return rows

    def station_list(self):
        return [dict(row) for row in self.station_rows]


def fetch_from(payloads, calls=None):
    """A JsonApiClient `fetch` that dispatches on path, so data.py runs for real."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        if "etd" in url:
            return {"?xml": {"@version": "1.0"}, "root": payloads["etd"]}
        if "stn" in url:
            return {"?xml": {"@version": "1.0"},
                    "root": {"stations": {"station": payloads["stns"]}, "message": ""}}
        raise AssertionError(f"unexpected url {url}")

    return fetch


class ValidationTests(unittest.TestCase):
    def test_check_abbr(self):
        self.assertEqual(BartClient.check_abbr("embr"), "EMBR")
        self.assertEqual(BartClient.check_abbr(" 12th "), "12TH")
        for bad in ("Embarcadero", "EMBRAVO", "", "EM B"):
            with self.assertRaises(ValueError):
                BartClient.check_abbr(bad)

    def test_check_direction_minutes_limit(self):
        self.assertEqual(BartClient.check_direction(" Antioch "), "Antioch")
        self.assertIsNone(BartClient.check_direction(None))
        with self.assertRaises(ValueError):
            BartClient.check_direction("x" * 61)
        self.assertEqual(BartClient.check_minutes("20"), 20)
        for bad in ("-1", "241", "soon"):
            with self.assertRaises(ValueError):
                BartClient.check_minutes(bad)
        self.assertEqual(BartClient.check_limit("5"), 5)
        with self.assertRaises(ValueError):
            BartClient.check_limit(str(MAX_DEPARTURES + 1))

    def test_flags_and_direction_matching(self):
        self.assertEqual(flag("1"), "yes")
        self.assertEqual(flag("0"), "no")
        self.assertEqual(flag(None), None)
        self.assertEqual(flag("weird"), "weird")
        departure = {"destination": "Antioch", "abbreviation": "ANTC",
                     "estimates": [{"direction": "North"}]}
        for wanted in ("Antioch", "antio", "ANTC", "North", "n", "north"):
            self.assertTrue(matches_direction(departure, wanted), wanted)
        for wanted in ("Daly City", "South", "s", "MLBR"):
            self.assertFalse(matches_direction(departure, wanted), wanted)
        self.assertTrue(matches_direction(departure, ""))

    def test_demo_key_is_the_default(self):
        self.assertEqual(BartClient().api_key, DEMO_KEY)
        self.assertTrue(DEMO_KEY)


class ReaderTests(unittest.TestCase):
    def test_board_unwraps_and_flattens(self):
        calls = []
        client = BartClient(fetch=fetch_from({"etd": EMBARCADERO_BOARD}, calls))
        board = client.board("EMBR")
        self.assertEqual(board["name"], "Embarcadero")
        self.assertEqual(board["clock"]["time"], "08:33:17 PM PDT")
        self.assertEqual(board["destinations"],
                         ["Antioch", "Daly City", "Dublin/Pleasanton", "Richmond", "SFO/Millbrae"]
                         if False else ["Antioch", "Dublin/Pleasanton", "Richmond", "SFO/Millbrae"])
        rows = client.board_rows("EMBR")
        self.assertEqual(rows[0]["minutes"], 8)
        self.assertEqual(rows[0]["platform"], "1")
        self.assertEqual(rows[0]["line_colour"], "YELLOW")
        self.assertEqual(rows[0]["bikes_allowed"], "yes")
        self.assertEqual(len(rows), 7)
        self.assertEqual(calls[0][1]["cmd"], "etd")
        self.assertEqual(calls[0][1]["orig"], "EMBR")
        self.assertEqual(calls[0][1]["key"], DEMO_KEY)
        self.assertNotIn("dir", calls[0][1], "the direction is applied here, not dropped upstream")

    def test_board_direction_filter(self):
        client = BartClient(fetch=fetch_from({"etd": EMBARCADERO_BOARD}))
        self.assertEqual([row["destination"] for row in client.board_rows("EMBR", direction="Antioch")],
                         ["Antioch", "Antioch"])
        self.assertEqual(client.board("EMBR", direction="South")["destinations"], ["SFO/Millbrae"])

    def test_empty_board(self):
        client = BartClient(fetch=fetch_from({"etd": {"date": "09/28/2026", "time": "01:00:00 AM PDT"}}))
        board = client.board("EMBR")
        self.assertEqual(board["departures"], [])
        self.assertEqual(client.board_rows("EMBR"), [])

    def test_error_message_body_becomes_an_upstream_error(self):
        from a2a_kit import UpstreamError

        body = {"root": {"message": {"error": {"text": "Invalid orig",
                                                "details": "The orig station ZZZZ is invalid."}}}}
        client = BartClient(fetch=lambda url, params, headers: body)
        with self.assertRaises(UpstreamError) as caught:
            client.board("EMBR")
        self.assertIn("The orig station ZZZZ is invalid.", str(caught.exception))

    def test_successful_board_keeps_the_empty_message(self):
        client = BartClient(fetch=lambda url, params, headers: {
            "?xml": {}, "root": {"date": "09/28/2026", "time": "12:00:00 AM PDT",
                                 "message": "", "station": [{"name": "Embarcadero", "abbr": "EMBR",
                                                              "etd": []}]}})
        self.assertEqual(client.board("EMBR")["departures"], [])

    def test_station_directory_and_lookup(self):
        calls = []
        client = BartClient(fetch=fetch_from({"stns": STATIONS}, calls))
        stations = client.station_list()
        self.assertEqual(len(stations), len(STATIONS))
        self.assertEqual(client.find_station("EMBR")["name"], "Embarcadero")
        self.assertEqual(client.find_station("Pittsburg Center")["abbr"], "PCTR")
        self.assertIsNone(client.find_station("Pleasanton"), "two stations share that word")
        self.assertIsNone(client.find_station("Nowhere"))
        self.assertEqual([row["abbr"] for row in client.find_stations(city="Berkeley")], ["DBRK", "NBRK"])
        # "San Francisco" reaches Embarcadero and the airport station, not South San Francisco.
        self.assertEqual([row["abbr"] for row in client.find_stations(city="San Francisco")],
                         ["EMBR", "SFIA"])
        self.assertEqual([row["abbr"] for row in client.find_stations(name="Pittsburg")],
                         ["PCTR", "PITT"])
        # The directory is fetched once and then served from cache.
        self.assertEqual(len(calls), 1)

    def test_clock_text(self):
        self.assertEqual(BartClient.clock_text({"clock": {"date": "09/28/2026", "time": "08:33 PM PDT"}}),
                         "09/28/2026 08:33 PM PDT BART time")
        self.assertEqual(BartClient.clock_text({"clock": {}}), "BART time not reported")


class ParseTests(unittest.TestCase):
    def message(self, text):
        return {"parts": [{"kind": "text", "text": text}]}

    def test_default_is_departures(self):
        self.assertEqual(parse(self.message("when is the next train from Embarcadero?"))["skill"],
                         "departures")

    def test_abbreviation_and_name(self):
        self.assertEqual(parse(self.message("departures at PITT"))["params"]["station"], "PITT")
        self.assertEqual(parse(self.message("when is the next train from Oakland?"))["params"]["station"],
                         "Oakland")

    def test_lines_skill(self):
        for text in ("what lines does Embarcadero serve?", "where can I go from MacArthur?",
                     "which destinations go from EMBR?"):
            request = parse(self.message(text))
            self.assertEqual(request["skill"], "lines", text)
            self.assertTrue(request["params"]["station"], text)

    def test_delays_skill(self):
        for text in ("any cancelled trains at PITT?", "is anything running limited at EMBR?",
                     "any delays at DUBL?"):
            self.assertEqual(parse(self.message(text))["skill"], "delays", text)

    def test_stations_skill(self):
        request = parse(self.message("which bart station is in Berkeley?"))
        self.assertEqual(request["skill"], "stations")
        self.assertEqual(request["params"]["city"], "Berkeley")
        self.assertNotIn("station", request["params"])
        self.assertEqual(parse(self.message("list the bart stations called Pittsburg"))["params"]["station"],
                         "Pittsburg")

    def test_last_train_questions_route_to_the_premium_skill(self):
        for text in ("if I leave in 20 minutes can I still get to Antioch from EMBR?",
                     "what is the last train from EMBR toward SFO?",
                     "can I still make a train from PITT?",
                     "not before 15 min, which train from EMBR can I catch?"):
            request = parse(self.message(text))
            self.assertEqual(request["skill"], SKILL_LAST_DEPARTURE, text)
            self.assertTrue(request["explicit"], text)
        request = parse(self.message("if I leave in 20 minutes can I still get to Antioch from EMBR?"))
        self.assertEqual(request["params"]["direction"], "Antioch")
        self.assertEqual(request["params"]["not_before_minutes"], "20")

    def test_free_skills_keep_their_own_questions(self):
        self.assertEqual(parse(self.message("when is the next train from Embarcadero?"))["skill"],
                         "departures")
        self.assertEqual(parse(self.message("what lines does Embarcadero serve?"))["skill"], "lines")
        self.assertEqual(parse(self.message("any cancelled trains at PITT?"))["skill"], "delays")
        self.assertEqual(parse(self.message("which bart station is in Berkeley?"))["skill"], "stations")

    def test_direction_on_a_free_question(self):
        request = parse(self.message("departures at PITT toward Antioch"))
        self.assertEqual(request["params"]["direction"], "Antioch")

    def test_explicit_json_wins(self):
        message = {"parts": [{"kind": "text", "text": "anything"},
                             {"kind": "data", "data": {"skill": SKILL_LAST_DEPARTURE,
                                                       "station": "EMBR", "direction": "Antioch",
                                                       "not_before_minutes": 30}}]}
        request = parse(message)
        self.assertEqual(request["skill"], SKILL_LAST_DEPARTURE)
        self.assertEqual(request["params"]["not_before_minutes"], 30)
        self.assertTrue(request["explicit"])

    def test_help_and_station_extraction(self):
        self.assertEqual(parse(self.message(""))["skill"], "help")
        self.assertEqual(parse(self.message("what can you do?"))["skill"], "help")
        self.assertEqual(station_from_text("departures at PITT"), "PITT")
        self.assertEqual(station_from_text("from Embarcadero please"), "Embarcadero")
        self.assertIsNone(station_from_text("what is the next train"))


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, client=None, **params):
        agent = BartAgent(client=client or FakeBart())
        return agent.run({"skill": skill, "params": params, "missing": agent.missing(skill, params)})

    def test_departures_list_the_board(self):
        result = self.run_skill("departures", client=FakeBart(), station="EMBR", limit=6)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Embarcadero (EMBR)", result["message"])
        self.assertIn("BART time", result["message"])
        self.assertIn("in 8 min", result["message"])
        self.assertIn("Antioch", result["message"])
        self.assertIn("platform 2", result["message"])
        self.assertIn(DATASET, result["message"])
        artifact = result["artifact"]
        self.assertEqual(artifact["station"], "EMBR")
        self.assertEqual(artifact["count"], 7)
        self.assertEqual(len(artifact["departures"]), 6)

    def test_departures_towards_one_destination(self):
        result = self.run_skill("departures", client=FakeBart(), station="EMBR", direction="Antioch")
        self.assertIn("Antioch", result["message"])
        self.assertNotIn("Richmond", result["message"])
        self.assertEqual(result["artifact"]["count"], 2)

    def test_departures_on_an_empty_board(self):
        result = self.run_skill("departures", client=FakeBart(empty_board=True), station="EMBR")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("no departure estimate", result["message"])

    def test_departures_needs_a_station(self):
        agent = BartAgent(client=FakeBart())
        self.assertEqual(agent.missing("departures", {}), ["station"])
        result = agent.run({"skill": "departures", "params": {}, "missing": ["station"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("EMBR", result["message"])

    def test_lines_summarise_the_destinations(self):
        result = self.run_skill("lines", client=FakeBart(), station="EMBR")
        self.assertIn("serves 4 destination(s)", result["message"])
        self.assertIn("Dublin/Pleasanton (DUBL)", result["message"])
        self.assertIn("limited", result["message"])
        lines = result["artifact"]["lines"]
        self.assertEqual(lines[0]["destination"], "SFO/Millbrae")
        self.assertEqual(lines[0]["platforms"], ["1"])
        self.assertEqual(lines[0]["trains_estimating"], 2)

    def test_lines_on_an_empty_board(self):
        result = self.run_skill("lines", client=FakeBart(empty_board=True), station="EMBR")
        self.assertIn("serves no directions", result["message"])

    def test_delays_list_only_the_flagged_trains(self):
        client = FakeBart(board=DISRUPTED_BOARD)
        result = self.run_skill("delays", client=client, station="PITT")
        self.assertIn("CANCELLED", result["message"])
        self.assertIn("limited stop", result["message"])
        self.assertIn("live estimate", result["message"])
        self.assertIn("1 cancelled", result["message"])
        self.assertEqual(result["artifact"]["trains_on_board"], 4)
        self.assertEqual(result["artifact"]["count"], 2)

    def test_delays_when_the_board_is_clean(self):
        clean = {
            "date": "09/28/2026", "time": "08:33:17 PM PDT",
            "station": [{"name": "Embarcadero", "abbr": "EMBR",
                         "etd": [etd("Antioch", "ANTC", [estimate(9, "2", "North")])]}],
        }
        result = self.run_skill("delays", client=FakeBart(board=clean), station="EMBR")
        self.assertIn("flagging nothing", result["message"])
        self.assertEqual(result["artifact"]["count"], 0)

    def test_stations_search(self):
        result = self.run_skill("stations", client=FakeBart(), city="Berkeley")
        self.assertIn("DBRK", result["message"])
        self.assertIn("NBRK", result["message"])
        self.assertEqual(result["artifact"]["count"], 2)

    def test_stations_city_match_does_not_reach_a_longer_city(self):
        result = self.run_skill("stations", client=FakeBart(), city="San Francisco")
        self.assertIn("SFIA", result["message"])
        self.assertNotIn("SSAN", result["message"])

    def test_stations_by_name(self):
        result = self.run_skill("stations", client=FakeBart(), name="Pittsburg")
        self.assertIn("PCTR", result["message"])
        self.assertIn("PITT", result["message"])
        self.assertEqual(result["artifact"]["count"], 2)

    def test_stations_needs_a_place(self):
        agent = BartAgent(client=FakeBart())
        self.assertEqual(agent.missing("stations", {}), ["place"])
        self.assertIn("Berkeley", agent.input_prompt("stations", ["place"]))

    def test_an_ambiguous_station_asks_which_one(self):
        result = self.run_skill("departures", client=FakeBart(), station="Oakland")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("matches more than one BART station", result["message"])
        self.assertIn("OAKL", result["message"])

    def test_an_unknown_station_is_reported_not_guessed(self):
        result = self.run_skill("departures", client=FakeBart(), station="Atlantis")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("No BART station matches", result["message"])

    def test_a_made_up_abbreviation_is_reported(self):
        result = self.run_skill("departures", client=FakeBart(), station="ZZZZ")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("no station with the abbreviation", result["message"])

    def test_a_typed_station_name_that_is_not_a_station_is_reported(self):
        result = self.run_skill("departures", client=FakeBart(), station="Embarcadero Station")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("No BART station matches", result["message"])

    def test_help_does_not_touch_the_board(self):
        client = FakeBart()
        result = self.run_skill("help", client=client)
        self.assertIn("BART", result["message"])
        self.assertIsNone(result["artifact"])
        self.assertEqual(client.reads, [])

    def test_card_and_upstream_failure(self):
        from a2a_kit import UpstreamError

        agent = BartAgent(client=FakeBart())
        self.assertEqual([skill["id"] for skill in CARD_SKILLS],
                         ["departures", "lines", "stations", "delays", "last-departure"])
        self.assertEqual(agent.env_prefix, "BART")
        self.assertEqual(agent.watch_kinds, ())

        class Broken(FakeBart):
            def board(self, *args, **kwargs):
                raise UpstreamError("BART refused that request: invalid key")

        result = BartAgent(client=Broken()).run(
            {"skill": "departures", "params": {"station": "EMBR"}, "missing": []})
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("invalid key", result["message"])


#: Shape copied from a live gateway `a2a_bart_last_departure` answer for EMBR.
LAST_DEPARTURE_PAYLOAD = {
    "dataset": "api.bart.gov",
    "product": "BART real-time departure estimates (ETD)",
    "source": "Bay Area Rapid Transit",
    "station": "EMBR",
    "station_name": "Embarcadero",
    "bart_clock": {"date": "09/28/2026", "time": "08:16:17 PM PDT"},
    "direction": "Antioch",
    "not_before_minutes": 20,
    "departures_read": 3,
    "departures": [
        {"destination": "Antioch", "abbreviation": "ANTC", "direction": "North", "platform": "2",
         "line_colour": "YELLOW", "line_hex": "#ffff33", "length": 9, "bikes_allowed": True,
         "limited": False, "cancelled": False, "delay_flag": False, "minutes": 25},
        {"destination": "Antioch", "abbreviation": "ANTC", "direction": "North", "platform": "2",
         "line_colour": "YELLOW", "line_hex": "#ffff33", "length": 9, "bikes_allowed": True,
         "limited": True, "cancelled": False, "delay_flag": False, "minutes": 45},
    ],
    "catchable_count": 2,
    "last_catchable": {
        "destination": "Antioch", "abbreviation": "ANTC", "direction": "North", "platform": "2",
        "line_colour": "YELLOW", "line_hex": "#ffff33", "length": 9, "bikes_allowed": True,
        "limited": True, "cancelled": False, "delay_flag": False, "minutes": 45,
    },
    "board_last_overall": {
        "destination": "SFO/Millbrae", "abbreviation": "MLBR", "direction": "South", "platform": "1",
        "line_colour": "YELLOW", "line_hex": "#ffff33", "length": 9, "bikes_allowed": True,
        "limited": False, "cancelled": False, "delay_flag": False, "minutes": 52,
    },
}

DENIED_TEXT = ("`a2a_bart_last_departure` is a premium tool, but that license key is not valid. "
               "Get a key at https://buy.polar.sh/polar_cl_example")
TOOL_ERROR_TEXT = "`a2a_bart_last_departure` failed: BART refused that request: invalid key"


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


class LastDepartureSkillTests(unittest.TestCase):
    """The premium skill: parsing and the station lookup stay local, the board comes from the gateway."""

    def last(self, client=None, gateway=None, **params):
        return BartAgent(client=client or FakeBart(), gateway=gateway).run(
            {"skill": SKILL_LAST_DEPARTURE, "params": params, "missing": []})

    def test_the_message_reports_the_gateways_trains(self):
        gateway, calls = fake_gateway(LAST_DEPARTURE_PAYLOAD)
        result = self.last(gateway=gateway, station="EMBR", direction="Antioch",
                           not_before_minutes=20)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("in 25 min", result["message"])
        self.assertIn("in 45 min", result["message"])
        self.assertIn("limited stop", result["message"])
        self.assertIn("the last one leaves in 45 min", result["message"])
        self.assertIn("2 train(s) still on the board", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertTrue(result["artifact"]["premium"])
        self.assertEqual(result["artifact"]["catchable_count"], 2)
        self.assertEqual(result["artifact"]["last_catchable"]["platform"], "2")

        # The board was read behind the gate, not here.
        self.assertEqual(len(calls), 1)
        sent = calls[0]["payload"]["params"]
        self.assertEqual(sent["name"], "a2a_bart_last_departure")
        self.assertEqual(sent["arguments"]["station"], "EMBR")
        self.assertEqual(sent["arguments"]["direction"], "Antioch")
        self.assertEqual(sent["arguments"]["not_before_minutes"], 20)

    def test_a_station_name_resolves_to_its_abbreviation(self):
        gateway, calls = fake_gateway(LAST_DEPARTURE_PAYLOAD)
        result = self.last(gateway=gateway, station="Embarcadero")
        self.assertEqual(result["artifact"]["station"], "EMBR")
        self.assertEqual(calls[0]["payload"]["params"]["arguments"]["station"], "EMBR")

    def test_without_a_licence_the_caller_is_told_how_to_get_one(self):
        gateway, calls = fake_gateway(key="")
        result = self.last(gateway=gateway, station="EMBR")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("MCP_LICENSE_KEY", result["message"])
        self.assertEqual(result["artifact"]["reason"], "missing_key")
        self.assertNotIn("catchable_count", result["artifact"])
        self.assertEqual(calls, [], "a keyless caller must not reach the gateway")

    def test_a_licence_refusal_keeps_the_gateways_wording(self):
        gateway, _ = fake_gateway()  # nothing but a refusal
        result = self.last(gateway=gateway, station="EMBR")
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["message"], DENIED_TEXT)
        self.assertEqual(result["artifact"]["reason"], "denied")

    def test_a_dead_gateway_fails_instead_of_inventing_a_train(self):
        gateway, _ = fake_gateway(error=OSError("connection refused"))
        result = self.last(gateway=gateway, station="EMBR")
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("could not be reached", result["message"])
        self.assertIsNone(result["artifact"].get("catchable_count"))

    def test_a_tool_error_is_not_sold_as_a_licence_problem(self):
        gateway, _ = fake_gateway(tool_error=TOOL_ERROR_TEXT)
        result = self.last(gateway=gateway, station="EMBR")
        self.assertEqual(result["final_state"], "failed")
        self.assertNotIn("MCP_LICENSE_KEY", result["message"])
        self.assertIn("BART refused", result["message"])

    def test_an_ambiguous_station_is_never_guessed_or_charged(self):
        gateway, calls = fake_gateway(LAST_DEPARTURE_PAYLOAD)
        result = self.last(gateway=gateway, station="Oakland")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("matches more than one BART station", result["message"])
        self.assertEqual(calls, [])

    def test_a_bad_argument_is_a_question_not_a_charge(self):
        gateway, calls = fake_gateway(LAST_DEPARTURE_PAYLOAD)
        result = self.last(gateway=gateway, station="EMBR", not_before_minutes=900)
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("between 0 and 240", result["message"])
        self.assertEqual(calls, [])

    def test_a_gateway_answer_without_departures_is_not_a_last_train(self):
        gateway, _ = fake_gateway({"station": "EMBR", "catchable_count": 0})
        result = self.last(gateway=gateway, station="EMBR")
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("without any BART departures", result["message"])


if __name__ == "__main__":
    unittest.main()
