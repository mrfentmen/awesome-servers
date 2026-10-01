"""Tests for the worldbank agent: a value, a comparison, a series, an indicator search,
routing, and the one premium skill.

    python3 agents/worldbank/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(Nigeria GDP current US$ 2025 = 290794361542.112, Nigeria GDP per capita 2025 =
1224.25410237743, the WDI catalogue is 1498 rows and SP.DYN.LE00.IN is 'Life expectancy at
birth, total (years)', meta.lastupdated 2026-07-13).
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

from agent import countries_from_text, route  # noqa: E402
from data import (GDP_PER_CAPITA, GDP_TOTAL, WorldBankData, WorldBankError,  # noqa: E402
                  WorldBankNotFound, indicator_default_for, indicator_from_text,
                  subject_from_text)

COUNTRIES = [
    {"page": 1, "pages": 1, "per_page": 500, "total": 217, "sourceid": "2",
     "lastupdated": "2026-07-13"},
    [
        {"id": "NGA", "iso2Code": "NG", "name": "Nigeria", "capitalCity": "Abuja",
         "longitude": "8.68", "latitude": "9.08",
         "region": {"value": "Sub-Saharan Africa "}, "incomeLevel": {"value": "Lower middle income"}},
        {"id": "KEN", "iso2Code": "KE", "name": "Kenya", "capitalCity": "Nairobi",
         "longitude": "37.87", "latitude": "-0.02",
         "region": {"value": "Sub-Saharan Africa "}, "incomeLevel": {"value": "Lower middle income"}},
        {"id": "GHA", "iso2Code": "GH", "name": "Ghana", "capitalCity": "Accra",
         "longitude": "-0.19", "latitude": "5.56",
         "region": {"value": "Sub-Saharan Africa "}, "incomeLevel": {"value": "Lower middle income"}},
        {"id": "NZL", "iso2Code": "NZ", "name": "New Zealand", "capitalCity": "Wellington",
         "longitude": "174.78", "latitude": "-41.29",
         "region": {"value": "East Asia & Pacific"}, "incomeLevel": {"value": "High income"}},
        {"id": "AFE", "iso2Code": "ZH", "name": "Africa Eastern and Southern",
         "capitalCity": "", "longitude": "", "latitude": "",
         "region": {"value": "Aggregates"}, "incomeLevel": {"value": "Aggregates"}},
    ],
]

GDP_ROW = [{"page": 1, "pages": 1, "per_page": 50, "total": 1, "sourceid": "2",
            "lastupdated": "2026-07-13"},
           [{"indicator": {"id": "NY.GDP.MKTP.CD", "value": "GDP (current US$)"},
             "country": {"id": "NG", "value": "Nigeria"}, "countryiso3code": "NGA",
             "date": "2025", "value": 290794361542.112, "obs_status": "", "decimal": 0}]]

PCAP_ROWS = [{"page": 1, "pages": 1, "per_page": 50, "total": 4, "sourceid": "2",
              "lastupdated": "2026-07-13"},
             [{"indicator": {"id": "NY.GDP.PCAP.CD", "value": "GDP per capita (current US$)"},
               "country": {"id": "NG", "value": "Nigeria"}, "countryiso3code": "NGA",
               "date": year, "value": value, "obs_status": "", "decimal": 1}
              for year, value in (("2025", 1224.25410237743), ("2024", None),
                                  ("2023", 2138.76383718757), ("2022", 2899.16047469267))]]

POP_ROWS = [{"page": 1, "pages": 1, "per_page": 50, "total": 3, "sourceid": "2",
             "lastupdated": "2026-07-13"},
            [{"indicator": {"id": "SP.POP.TOTL", "value": "Population, total"},
              "country": {"id": "NZ", "value": "New Zealand"}, "countryiso3code": "NZL",
              "date": year, "value": value, "obs_status": "", "decimal": 0}
             for year, value in (("2026", 5241000), ("2025", 5215000), ("2024", 5190000))]]

CATALOGUE = [{"page": 1, "pages": 1, "per_page": 5000, "total": 1498, "sourceid": "2",
              "lastupdated": "2026-07-13"},
             [{"id": "SP.DYN.LE00.IN", "name": "Life expectancy at birth, total (years)",
               "unit": "", "source": {"id": "2", "value": "World Development Indicators"},
               "sourceNote": "Life expectancy at birth indicates the number of years a newborn "
                             "infant would live.", "sourceOrganization": "World Bank",
               "topics": []},
              {"id": "SP.DYN.LE00.MA.IN", "name": "Life expectancy at birth, male (years)",
               "unit": "", "source": {"id": "2", "value": "World Development Indicators"},
               "sourceNote": "", "sourceOrganization": "World Bank", "topics": []},
              {"id": "SP.POP.TOTL", "name": "Population, total", "unit": "",
               "source": {"id": "2", "value": "World Development Indicators"},
               "sourceNote": "", "sourceOrganization": "World Bank", "topics": []},
              {"id": "SP.RUR.TOTL", "name": "Rural population", "unit": "",
               "source": {"id": "2", "value": "World Development Indicators"},
               "sourceNote": "", "sourceOrganization": "World Bank", "topics": []},
              {"id": "NY.GDP.PCAP.CN", "name": "GDP per capita (current LCU)", "unit": "",
               "source": {"id": "2", "value": "World Development Indicators"},
               "sourceNote": "", "sourceOrganization": "World Bank", "topics": []},
              {"id": "NY.GDP.PCAP.CD", "name": "GDP per capita (current US$)", "unit": "",
               "source": {"id": "2", "value": "World Development Indicators"},
               "sourceNote": "", "sourceOrganization": "World Bank", "topics": []},
              {"id": "1.0.HCount.1.90usd", "name": "Poverty Headcount ($1.90 a day)",
               "unit": "", "source": {"id": "6", "value": "LAC Equity Lab"},
               "sourceNote": "", "sourceOrganization": "", "topics": []}]]


class FakeFeeds:
    def __init__(self, value=None, series=None, catalogue=None, empty=False, fail=False):
        self.calls: list[str] = []
        self.params: list[dict] = []
        self.value = GDP_ROW if value is None else value
        self.series = PCAP_ROWS if series is None else series
        self.catalogue = CATALOGUE if catalogue is None else catalogue
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str, params: dict):
        self.calls.append(url)
        self.params.append(dict(params or {}))
        if self.fail:
            raise WorldBankError("the World Bank is unreachable")
        if self.empty:
            return json.dumps([{"page": 1, "total": 0}, []])
        if url.endswith("country"):
            return json.dumps(COUNTRIES)
        if url.endswith("indicator"):
            return json.dumps(self.catalogue)
        if "/indicator/" in url and "/country/" not in url:
            for row in self.catalogue[1]:
                if row["id"] in url:
                    return json.dumps([{"page": 1, "total": 1}, [row]])
            raise WorldBankNotFound("the World Bank answered HTTP 404")
        if url.endswith("/SP.POP.TOTL"):
            return json.dumps(POP_ROWS)
        if url.endswith("/" + GDP_PER_CAPITA):
            #: Each country gets its own figure, so a comparison test can prove the sort.
            for code, name, value in (("/KEN/", "Kenya", 2362.9), ("/GHA/", "Ghana", 3257.2)):
                if code in url:
                    rows = json.loads(json.dumps(PCAP_ROWS))
                    for row in rows[1]:
                        row["country"] = {"id": code.strip("/"), "value": name}
                        row["value"] = value
                    return json.dumps(rows)
            return json.dumps(PCAP_ROWS)
        if "mrnev" in dict(params or {}):
            return json.dumps(self.value)
        if self.calls and self.calls[-1].endswith("/SP.POP.TOTL"):
            return json.dumps(self.series)
        return json.dumps(self.series)


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return WorldBankData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_an_indicator_id_is_recognised(self):
        self.assertEqual(indicator_from_text("what is NY.GDP.PCAP.CD for Kenya?"),
                         "NY.GDP.PCAP.CD")
        self.assertIsNone(indicator_from_text("what is Nigeria's GDP?"))

    def test_gdp_wording_picks_the_right_one_of_the_two(self):
        self.assertEqual(indicator_default_for("what is Nigeria's GDP?"), GDP_TOTAL)
        self.assertEqual(indicator_default_for("what is Kenya's GDP per capita?"), GDP_PER_CAPITA)
        self.assertIsNone(indicator_default_for("population of New Zealand"))

    def test_the_subject_is_what_is_left_after_where_and_when(self):
        self.assertEqual(subject_from_text("show me New Zealand population over the last 3 years",
                                           ["New Zealand"]), "population")
        self.assertEqual(subject_from_text("life expectancy in Japan", ["Japan"]),
                         "life expectancy")
        self.assertIsNone(subject_from_text("what is Kenya's GDP per capita?", ["Kenya"]))

    def test_a_possessive_is_not_part_of_a_country_name(self):
        self.assertEqual(countries_from_text("what is Nigeria's GDP?"), ["Nigeria"])
        self.assertEqual(countries_from_text("compare GDP per capita in Kenya, Ghana and Nigeria"),
                         ["Kenya", "Ghana", "Nigeria"])
        #: Aggregates are not countries, and an indicator id is not a place.
        self.assertNotIn("GDP", countries_from_text("what is Nigeria's GDP?"))


class ReadTests(unittest.TestCase):
    def test_a_value_is_the_newest_year_that_has_one(self):
        data, feed = make_data()
        found = data.value("Nigeria", GDP_TOTAL)
        self.assertEqual(found["year"], "2025")
        self.assertEqual(found["value"], 290794361542.112)
        self.assertEqual(found["indicator"]["id"], "NY.GDP.MKTP.CD")
        self.assertEqual(found["country"]["iso3"], "NGA")
        self.assertEqual(found["country"]["region"], "Sub-Saharan Africa")
        self.assertEqual(found["source_updated"], "2026-07-13")
        #: mrnev=1 is the newest non-empty value, which is the one worth quoting.
        self.assertEqual(feed.params[-1]["mrnev"], 1)

    def test_a_2024_row_with_no_value_is_skipped(self):
        data, _feed = make_data(value=PCAP_ROWS)
        found = data.value("Nigeria", GDP_PER_CAPITA)
        self.assertEqual(found["year"], "2025")

    def test_a_series_is_oldest_first_and_drops_empty_years(self):
        data, feed = make_data()
        series = data.series("Nigeria", GDP_PER_CAPITA, years=4)
        self.assertEqual([row["year"] for row in series["values"]], ["2022", "2023", "2025"])
        self.assertTrue(series["missing_years"])
        import datetime
        this_year = datetime.date.today().year
        self.assertEqual(feed.params[-1]["date"], f"{this_year - 3}:{this_year}")

    def test_a_comparison_is_sorted_biggest_first(self):
        data, _feed = make_data()
        found = data.compare(["Nigeria", "Kenya", "Ghana"], GDP_PER_CAPITA)
        self.assertEqual(found["indicator_id"], GDP_PER_CAPITA)
        self.assertEqual(len(found["rows"]), 3)
        #: Biggest first: Ghana 3257.2, Kenya 2362.9, Nigeria 1224.25.
        self.assertEqual([row["country"]["name"] for row in found["rows"]],
                         ["Ghana", "Kenya", "Nigeria"])
        self.assertEqual(found["not_reported"], [])

    def test_aggregates_are_not_countries(self):
        data, _feed = make_data()
        self.assertEqual(len(data.countries()), 4)
        with self.assertRaises(WorldBankNotFound):
            data.country("Africa Eastern and Southern")

    def test_a_country_is_found_by_name_or_code(self):
        data, _feed = make_data()
        self.assertEqual(data.country("Nigeria")["iso3"], "NGA")
        self.assertEqual(data.country("NGA")["name"], "Nigeria")
        self.assertEqual(data.country("kenya")["iso2"], "KE")

    def test_the_indicator_catalogue_is_ranked_here(self):
        data, feed = make_data()
        found = data.search_indicators("life expectancy", limit=2)
        #: The total outranks the male series, and the API's own searchTerm is never sent
        #: because it ignores the term.
        self.assertEqual(found["indicators"][0]["id"], "SP.DYN.LE00.IN")
        self.assertNotIn("searchTerm", feed.params[-1])
        self.assertEqual(feed.params[-1]["source"], "2")
        #: The catalogue meta says 1498; the fixture itself carries 7 rows.
        self.assertEqual(found["total"], 1498)
        self.assertEqual(found["read"], 7)
        self.assertEqual(found["matched"], 2)

    def test_a_total_beats_a_sub_breakdown(self):
        data, _feed = make_data()
        self.assertEqual(data.search_indicators("population", limit=1)["indicators"][0]["id"],
                         "SP.POP.TOTL")

    def test_a_dollar_figure_beats_a_local_currency_one(self):
        data, _feed = make_data()
        self.assertEqual(data.search_indicators("GDP per capita", limit=1)["indicators"][0]["id"],
                         "NY.GDP.PCAP.CD")

    def test_one_indicator_by_id(self):
        data, _feed = make_data()
        entry = data.indicator("SP.DYN.LE00.IN")
        self.assertEqual(entry["name"], "Life expectancy at birth, total (years)")
        self.assertEqual(entry["source"], "World Development Indicators")

    def test_an_indicator_nobody_asked_for(self):
        data, _feed = make_data()
        self.assertEqual(data.search_indicators("internet users")["indicators"], [])

    def test_a_dead_api_and_bad_arguments(self):
        data, _feed = make_data(fail=True)
        with self.assertRaises(WorldBankError):
            data.value("Nigeria", GDP_TOTAL)
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.value("", GDP_TOTAL)
        with self.assertRaises(ValueError):
            data.value("Nigeria", "")
        with self.assertRaises(ValueError):
            data.compare(["Nigeria", "Kenya"], "")


class RouteTests(unittest.TestCase):
    def test_a_value_question(self):
        self.assertEqual(route("what is Nigeria's GDP?"),
                         ("worldbank-value", {"country": "Nigeria", "indicator": GDP_TOTAL}))
        self.assertEqual(route("what is Kenya's GDP per capita?")[1]["indicator"],
                         GDP_PER_CAPITA)

    def test_a_comparison(self):
        skill, params = route("compare GDP per capita in Kenya versus Ghana")
        self.assertEqual(skill, "worldbank-compare")
        self.assertEqual(params["countries"], ["Kenya", "Ghana"])
        self.assertEqual(params["indicator"], GDP_PER_CAPITA)

    def test_a_series(self):
        self.assertEqual(route("show me New Zealand population over the last 20 years"),
                         ("worldbank-series", {"country": "New Zealand", "indicator": None,
                                               "years": 20}))

    def test_an_indicator_search(self):
        self.assertEqual(route("which indicator measures life expectancy at birth?"),
                         ("worldbank-indicators", {"term": "life expectancy at birth"}))

    def test_the_growth_question_is_the_premium_one(self):
        skill, params = route("how fast is Nigeria's GDP per capita growing, and where does it rank?")
        self.assertEqual(skill, "worldbank-growth")
        self.assertEqual(params["country"], "Nigeria")
        self.assertEqual(params["indicator"], GDP_PER_CAPITA)
        self.assertEqual(params["years"], 10)

    def test_a_question_that_is_not_about_country_data(self):
        for text in ("tell me a joke", "how deep is the water table in Kansas?", ""):
            self.assertEqual(route(text), ("help", {}), text)


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
        from agent import WorldBankAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = WorldBankAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_free_answer_reports_a_real_figure(self):
        result, client, _ = self.turn("what is Nigeria's GDP?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("GDP (current US$) in Nigeria", result["text"])
        self.assertIn("2025: 290,794,361,542.11", result["text"])
        self.assertIn("indicator id: NY.GDP.MKTP.CD", result["text"])
        self.assertIn("region: Sub-Saharan Africa", result["text"])
        self.assertIn("not the same as a zero", result["text"])

    def test_a_big_number_is_never_scientific_notation(self):
        result, _, _ = self.turn("what is Nigeria's GDP?")
        self.assertNotIn("e+", result["text"])

    def test_a_comparison_answer(self):
        result, _, _ = self.turn("compare GDP per capita in Kenya versus Ghana")
        self.assertIn("GDP per capita (current US$) (NY.GDP.PCAP.CD)", result["text"])
        self.assertIn("Ghana: 3,257.20 in 2025", result["text"])
        self.assertIn("Kenya: 2,362.90 in 2025", result["text"])
        self.assertLess(result["text"].index("Ghana"), result["text"].index("Kenya"))

    def test_a_subject_with_no_indicator_id_is_looked_up(self):
        result, _, feed = self.turn("show me New Zealand population over the last 3 years")
        #: "population" is resolved against the real catalogue, not guessed at.
        self.assertIn("Population, total", result["text"])
        self.assertIn("2026: 5241000", result["text"].replace(",", ""))
        self.assertTrue(any("SP.POP.TOTL" in url for url in feed.calls))

    def test_an_indicator_search_answer(self):
        result, _, _ = self.turn("which indicator measures life expectancy at birth?")
        self.assertIn("World Development Indicators whose name contains 'life expectancy at birth'",
                      result["text"])
        self.assertIn("SP.DYN.LE00.IN - Life expectancy at birth, total (years)", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("World Bank", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("what is Nigeria's GDP?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_api(self):
        result, _, _ = self.turn("what is Nigeria's GDP?", fail=True)
        self.assertIn("I could not read the World Bank's data", result["text"])


# ---------------------------------------------------------------------------
# The premium skill: worldbank-growth
#
# No network: the licence check and the work both happen on the gateway, and the
# gateway's own JSON-RPC answers are injected into the real GatewayClient.
# ---------------------------------------------------------------------------

#: What `worldbank_growth` answers for a 10-year window.
GROWTH_DATA = {
    "country": "Nigeria",
    "country_iso3": "NGA",
    "indicator_id": "NY.GDP.PCAP.CD",
    "indicator_name": "GDP per capita (current US$)",
    "window": {"from": 2016, "to": 2025},
    "years_used": 10,
    "first_year": "2016",
    "first_value": 2648.0,
    "last_year": "2025",
    "last_value": 1224.25410237743,
    "absolute_change": -1423.74589762257,
    "percent_change": -53.77,
    "cagr_pct": -8.17,
    "average_annual_pct": -6.9,
    "volatility_pct": 7.42,
    "peak": {"year": "2019", "value": 2434.0},
    "trough": {"year": "2024", "value": 1084.16041805058},
    "rank": 3,
    "ranked_count": 3,
    "peers": [
        {"country": "Kenya", "cagr_pct": 2.4, "last_value": 2362.9, "last_year": "2025"},
        {"country": "Ghana", "cagr_pct": 4.1, "last_value": 3257.2, "last_year": "2025"},
    ],
    "note": "the compound rate is arithmetic on the first and last values of the window, so a "
            "year the Bank skipped changes the rate",
    "source": "World Bank Open Data (api.worldbank.org)",
}

#: The exact refusal the gateway sends for a key it will not accept.
GATEWAY_DENIAL = ("`worldbank_growth` is a premium tool, but that licence key was rejected. "
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

    def turn(self, text: str, fetch, key: str):
        from agent import WorldBankAgent

        agent_conn, client_conn = connected_pair()
        data, _feed = make_data()
        gateway = GatewayClient(fetch=fetch, key=key, url="https://gateway.test/mcp")
        agent = WorldBankAgent(agent_conn, data, gateway=gateway)
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
        result, client = self.turn("how fast is Nigeria's GDP per capita growing?", fetch, "")
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
        result, _ = self.turn("how fast is Nigeria's GDP per capita growing?", fetch, "bad-key")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn(GATEWAY_DENIAL, result["text"])
        self.assertIn("premium", result["text"])
        self.assertEqual(len(fetch.calls), 1)
        self.assertEqual(fetch.calls[0]["payload"]["params"]["name"], "worldbank_growth")

    def test_a_good_key_returns_the_growth(self):
        fetch = gateway_answer(json.dumps(GROWTH_DATA))
        result, _ = self.turn("how fast is Nigeria's GDP per capita growing?", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("GDP per capita (current US$) in Nigeria (NY.GDP.PCAP.CD)", result["text"])
        self.assertIn("window: 2016 to 2025 (10 year(s) with a value)", result["text"])
        self.assertIn("compound annual growth rate: -8.17% a year", result["text"])
        self.assertIn("change: -1,423.75 (-53.77% over the window)", result["text"])
        self.assertIn("rank among the countries compared: 3 of 3", result["text"])
        self.assertIn("Kenya: 2.4% a year", result["text"])
        self.assertIn("arithmetic on the first and last values", result["text"])
        #: The licence key travels in a header and is never echoed back.
        self.assertEqual(fetch.calls[0]["headers"]["Authorization"], "Bearer k_paid")
        self.assertNotIn("k_paid", result["text"])

    def test_a_good_key_sends_what_it_was_asked_for(self):
        fetch = gateway_answer(json.dumps(GROWTH_DATA))
        self.turn("how fast is Nigeria's GDP per capita growing over the last 20 years?", fetch,
                  "k_paid")
        self.assertEqual(fetch.calls[0]["payload"]["params"]["arguments"],
                         {"country": "Nigeria", "indicator": GDP_PER_CAPITA, "years": 20})

    def test_an_empty_gateway_answer_is_not_a_crash(self):
        fetch = gateway_answer(json.dumps({"country": "Nigeria", "years_used": 0}))
        result, _ = self.turn("how fast is Nigeria's GDP per capita growing?", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("did not send back a growth rate", result["text"])

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def fetch(url, payload, headers):
            raise OSError("connection refused")

        result, _ = self.turn("how fast is Nigeria's GDP per capita growing?", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read the World Bank's data", result["text"])

    def test_the_routing_is_narrow(self):
        for text in ("how fast is Nigeria's GDP per capita growing?",
                     "what is the growth rate of Nigeria's GDP?",
                     "rank Nigeria's GDP per capita against Kenya and Ghana",
                     "how much has Nigeria's GDP per capita changed per year?"):
            self.assertEqual(route(text)[0], "worldbank-growth", text)

        free = [
            ("what is Nigeria's GDP?", "worldbank-value"),
            ("compare GDP per capita in Kenya versus Ghana", "worldbank-compare"),
            ("show me New Zealand population over the last 20 years", "worldbank-series"),
            ("which indicator measures life expectancy at birth?", "worldbank-indicators"),
            ("what can you do?", "help"),
        ]
        for text, expected in free:
            self.assertEqual(route(text)[0], expected, text)

    def test_the_premium_skill_id_is_published(self):
        from agent import SKILLS

        self.assertIn("worldbank-growth", SKILLS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
