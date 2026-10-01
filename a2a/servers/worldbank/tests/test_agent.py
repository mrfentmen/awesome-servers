"""Tests for the World Bank Indicators server.

    python3 servers/worldbank/tests/test_agent.py
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
    DEFAULT_YEARS,
    SKILL_INDICATOR_TREND,
    WorldBankAgent,
    countries_from_text,
    country_name_from_text,
    parse,
)
from data import (  # noqa: E402
    COUNTRY_DATASET,
    DATASET,
    INDICATOR_DATASET,
    WorldBankClient,
)

GDP_PC = "NY.GDP.PCAP.CD"
LIFE = "SP.DYN.LE00.IN"


def row(country, iso3, year, value, indicator_id=GDP_PC, name="GDP per capita (current US$)"):
    return {"indicator": {"id": indicator_id, "value": name},
            "country": {"id": iso3, "value": country}, "countryiso3code": iso3,
            "date": year, "value": value, "unit": "", "obs_status": "", "decimal": 2}


def page(rows, sourceid=2, lastupdated="2026-07-13", total=None):
    return [{"page": 1, "pages": 1, "per_page": 100, "total": total if total is not None else len(rows),
             "sourceid": sourceid, "lastupdated": lastupdated}, rows]


NORWAY = [row("Norway", "NOR", "2024", 89889.0), row("Norway", "NOR", "2023", 90984.2),
          row("Norway", "NOR", "2022", 113122.0), row("Norway", "NOR", "2021", 96443.0)]
COMPARE = [row("Ireland", "IRL", "2015", 64250.0), row("Ireland", "IRL", "2024", 112895.0),
           row("Japan", "JPN", "2015", 35665.0), row("Japan", "JPN", "2024", 33797.0),
           row("Nigeria", "NGA", "2015", 2586.0), row("Nigeria", "NGA", "2024", 1084.0),
           row("Ireland", "IRL", "2020", None), row("Japan", "JPN", "2020", None)]
COUNTRIES = [
    {"id": "NGA", "iso2Code": "NG", "name": "Nigeria", "region": {"value": "Sub-Saharan Africa "},
     "incomeLevel": {"value": "Lower middle income"}, "lendingType": {"value": "IDA Blended"},
     "capitalCity": "Abuja", "longitude": "7.466", "latitude": "9.083"},
    {"id": "NOR", "iso2Code": "NO", "name": "Norway", "region": {"value": "Europe & Central Asia"},
     "incomeLevel": {"value": "High income"}, "lendingType": {"value": "Not classified"},
     "capitalCity": "Oslo", "longitude": "10.746", "latitude": "60.472"},
    {"id": "IRL", "iso2Code": "IE", "name": "Ireland", "region": {"value": "Europe & Central Asia"},
     "incomeLevel": {"value": "High income"}, "lendingType": {"value": "Not classified"},
     "capitalCity": "Dublin", "longitude": "-8.623", "latitude": "53.143"},
    {"id": "GUI", "iso2Code": "GN", "name": "Guinea", "region": {"value": "Sub-Saharan Africa "},
     "incomeLevel": {"value": "Lower middle income"}, "lendingType": {"value": "IDA Blended"},
     "capitalCity": "Conakry", "longitude": "-13.7", "latitude": "9.95"},
    {"id": "GNB", "iso2Code": "GW", "name": "Guinea-Bissau", "region": {"value": "Sub-Saharan Africa "},
     "incomeLevel": {"value": "Low income"}, "lendingType": {"value": "IDA Blended"},
     "capitalCity": "Bissau", "longitude": "-15.6", "latitude": "11.85"},
    {"id": "GNQ", "iso2Code": "GQ", "name": "Equatorial Guinea", "region": {"value": "Sub-Saharan Africa "},
     "incomeLevel": {"value": "Upper middle income"}, "lendingType": {"value": "IDA Blended"},
     "capitalCity": "Malabo", "longitude": "8.78", "latitude": "3.75"},
    {"id": "PNG", "iso2Code": "PG", "name": "Papua New Guinea", "region": {"value": "East Asia & Pacific"},
     "incomeLevel": {"value": "Lower middle income"}, "lendingType": {"value": "IDA Blended"},
     "capitalCity": "Port Moresby", "longitude": "147.18", "latitude": "-9.44"},
    {"id": "WLD", "iso2Code": "1W", "name": "World", "region": {"value": "Aggregates"},
     "incomeLevel": {"value": "Aggregates"}, "lendingType": {"value": "Aggregates"},
     "capitalCity": "", "longitude": "", "latitude": ""},
]
INDICATOR_ROWS = [
    {"id": "SP.DYN.LE00.IN", "name": "Life expectancy at birth, total (years)", "unit": "",
     "source": {"id": "2", "value": "World Development Indicators"},
     "sourceNote": "The average number of years a newborn would live.",
     "sourceOrganization": "World Bank", "topics": [{"id": "8", "value": "Health"}]},
    {"id": "AG.CON.FERT.ZS", "name": "Fertilizer consumption (kilograms per hectare)", "unit": "",
     "source": {"id": "2", "value": "World Development Indicators"},
     "sourceNote": "Fertilizer use per unit of arable land.",
     "sourceOrganization": "World Bank", "topics": [{"id": "1", "value": "Agriculture"}]},
    {"id": "SH.POV.DDAY", "name": "Poverty headcount ratio at $2.15 a day (2017 PPP)", "unit": "",
     "source": {"id": "2", "value": "World Development Indicators"},
     "sourceNote": "The poverty measure published by the Bank.",
     "sourceOrganization": "World Bank", "topics": [{"id": "11", "value": "Poverty"}]},
]


def _no_network(*args, **kwargs):
    raise AssertionError("FakeWorldBank must not touch the network")


class FakeWorldBank(WorldBankClient):
    """Same interface as WorldBankClient, no network. Derived helpers stay real."""

    def __init__(self, rows=NORWAY, countries=COUNTRIES, indicators=INDICATOR_ROWS) -> None:
        super().__init__(fetch=_no_network)
        self.rows = list(rows)
        self.countries = list(countries)
        self.indicators = list(indicators)
        self.reads = []

    def indicator_values(self, countries, indicator, years=DEFAULT_YEARS, limit=20, source=2):
        self.reads.append(("indicator_values", countries, indicator, years, limit))
        codes = (countries.split(";") if isinstance(countries, str)
                 else [str(one) for one in countries])
        wanted = {row_value["countryiso3code"] for row_value in self.rows}
        keep = [row_value for row_value in self.rows if row_value["countryiso3code"] in wanted
                and (not codes or row_value["countryiso3code"] in codes)]
        keep = [row_value for row_value in keep
                if row_value["value"] is not None][:limit]
        return {"indicator_code": indicator,
                "indicator_name": (self.rows[0]["indicator"]["value"] if self.rows else indicator),
                "indicator_unit": None, "countries": codes, "years": years, "source_id": source,
                "last_updated": "2026-07-13", "total_hits": len(keep),
                "observations": [self._observation(row_value, indicator) for row_value in keep]}

    def country_info(self, code):
        self.reads.append(("country_info", code))
        for row_value in self.countries:
            if row_value["id"] == str(code).upper() or row_value["iso2Code"] == str(code).upper():
                return self.pick({**row_value, "iso3": row_value["id"],
                                  "iso2": row_value["iso2Code"],
                                  "name": row_value["name"],
                                  "region": (row_value.get("region") or {}).get("value"),
                                  "income_level": (row_value.get("incomeLevel") or {}).get("value"),
                                  "lending_type": (row_value.get("lendingType") or {}).get("value"),
                                  "capital_city": row_value.get("capitalCity")},
                                 ("iso3", "iso2", "name", "region", "income_level", "lending_type",
                                  "capital_city"), COUNTRY_DATASET)
        return None

    def country_list(self):
        self.reads.append(("country_list",))
        return [self.pick({**row_value, "iso3": row_value["id"], "iso2": row_value["iso2Code"],
                           "name": row_value["name"],
                           "region": (row_value.get("region") or {}).get("value"),
                           "income_level": (row_value.get("incomeLevel") or {}).get("value")},
                          ("iso3", "iso2", "name", "region", "income_level"), COUNTRY_DATASET)
                for row_value in self.countries]

    def indicator_catalogue(self):
        self.reads.append(("indicator_catalogue",))
        return [self._catalogue_entry(row_value) for row_value in self.indicators]


def fetch_from(indicator_rows=None, countries=COUNTRIES, indicator_rows_for_search=None, calls=None):
    """A JsonApiClient `fetch` so data.py runs for real against a World Bank page."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        if url.endswith("/v2/country"):
            return page(countries)
        if "/indicator/" in url and url.count("/") > 4:
            return page(indicator_rows if indicator_rows is not None else [])
        if url.rstrip("/").endswith("/indicator"):
            return page(indicator_rows_for_search if indicator_rows_for_search is not None else [])
        if "/country/" in url:
            iso3 = url.split("/country/")[1].split("/")[0].upper()
            # The real endpoint answers a 2-letter code as readily as a 3-letter one.
            match = [row_value for row_value in countries
                     if iso3 in (row_value["id"], row_value["iso2Code"])]
            return [{"page": 1}, match]
        raise AssertionError(f"unexpected url {url}")

    return fetch


class ValidationTests(unittest.TestCase):
    def test_check_country(self):
        self.assertEqual(WorldBankClient.check_country("us"), "US")
        self.assertEqual(WorldBankClient.check_country("nor"), "NOR")
        self.assertEqual(WorldBankClient.check_country(["US", "gb ", "us"]), "US;GB")
        self.assertEqual(WorldBankClient.check_country("WLD"), "WLD")
        for bad in ("", None, "9", "ABCDE"):
            with self.assertRaises(ValueError):
                WorldBankClient.check_country(bad)
        with self.assertRaises(ValueError):
            WorldBankClient.check_country(["A", "B", "C", "D", "E", "F", "G", "H", "I"])

    def test_check_indicator(self):
        self.assertEqual(WorldBankClient.check_indicator(" ny.gdp.pcap.cd "), "ny.gdp.pcap.cd")
        for bad in ("", None, "N Y", "X" * 70):
            with self.assertRaises(ValueError):
                WorldBankClient.check_indicator(bad)

    def test_check_years(self):
        self.assertEqual(WorldBankClient.check_years(None), "2015:2024")
        self.assertEqual(WorldBankClient.check_years("2020"), "2020")
        self.assertEqual(WorldBankClient.check_years("2015 : 2024"), "2015:2024")
        for bad in ("19:20", "abcd", "2024:2015", "2000:2065"):
            with self.assertRaises(ValueError):
                WorldBankClient.check_years(bad)

    def test_check_limit(self):
        self.assertEqual(WorldBankClient.check_limit("5"), 5)
        for bad in ("0", "21", "many"):
            with self.assertRaises(ValueError):
                WorldBankClient.check_limit(bad)

    def test_check_unit_kind(self):
        self.assertIsNone(WorldBankClient.check_unit_kind(None))
        self.assertEqual(WorldBankClient.check_unit_kind("PER-CAPITA"), "per-capita")
        with self.assertRaises(ValueError):
            WorldBankClient.check_unit_kind("furlongs")


class ReaderTests(unittest.TestCase):
    def test_a_null_value_is_not_a_row(self):
        client = WorldBankClient(fetch=fetch_from(COMPARE))
        result = client.indicator_values("IRL;JPN;NGA", GDP_PC, years="2015:2024", limit=20)
        years = [row_value["year"] for row_value in result["observations"]]
        self.assertNotIn("2020", years, "a year the Bank has no value for is not a zero")
        self.assertEqual(result["observations"][0]["indicator_id"], GDP_PC)
        self.assertEqual(result["observations"][0]["country"], "Ireland")
        self.assertEqual(result["indicator_name"], "GDP per capita (current US$)")

    def test_several_countries_are_one_request(self):
        calls = []
        client = WorldBankClient(fetch=fetch_from(NORWAY, calls=calls))
        client.indicator_values("IRL;JPN;NGA", GDP_PC, years="2015:2024")
        url, params = calls[0]
        self.assertIn("/country/IRL;JPN;NGA/indicator/NY.GDP.PCAP.CD", url)
        self.assertEqual(params["date"], "2015:2024")
        self.assertEqual(params["format"], "json")
        self.assertEqual(len(calls), 1, "a comparison is one request, not one per country")

    def test_a_metadata_only_payload_is_an_upstream_error(self):
        from a2a_kit import UpstreamError

        client = WorldBankClient(fetch=lambda url, params, headers: [{"message": [{"id": "120"}]}])
        with self.assertRaises(UpstreamError):
            client.indicator_values("IE", "NY.NOPE.CD")

    def test_country_lookup_by_name_and_code(self):
        client = WorldBankClient(fetch=fetch_from())
        self.assertEqual(client.country_info("NG")["name"], "Nigeria")
        self.assertEqual(client.country_info("NGA")["income_level"], "Lower middle income")
        self.assertIsNone(client.country_info("ZZZ"))
        self.assertEqual([row_value["iso3"] for row_value in client.find_countries(needle="guinea")],
                         ["GUI", "GNB", "GNQ", "PNG"])

    def test_the_catalogue_is_searched_ranked(self):
        client = WorldBankClient(fetch=fetch_from(indicator_rows_for_search=INDICATOR_ROWS))
        found = client.search_indicators("poverty", limit=5)
        self.assertEqual(found["catalogue_size"], 3)
        self.assertEqual(found["indicators"][0]["id"], "SH.POV.DDAY")
        self.assertEqual(found["indicators"][0]["match_rank"], 0)
        # "life expectancy" is in a name, "arable" only in a note, "health" only in a topic.
        self.assertEqual(client.search_indicators("life expectancy")["name_hits"], 1)
        self.assertEqual(client.search_indicators("arable")["indicators"][0]["match_rank"], 3)
        self.assertEqual(client.search_indicators("health")["indicators"][0]["match_rank"], 2)
        self.assertEqual(client.search_indicators("zzzznothing")["indicators"], [])


class ParseTests(unittest.TestCase):
    def test_a_default_is_an_indicator_value(self):
        request = parse({"parts": [{"kind": "text", "text": f"what is {GDP_PC} in Norway for 2023?"}]})
        self.assertEqual(request["skill"], "indicator-value")
        self.assertEqual(request["params"]["indicator"], GDP_PC)
        self.assertEqual(request["params"]["country_name"], "Norway")
        self.assertEqual(request["params"]["years"], "2023")

    def test_a_compare_routes_to_country_compare(self):
        request = parse({"parts": [{"kind": "text",
                                    "text": f"compare {GDP_PC} for US, GB and DE in 2023"}]})
        self.assertEqual(request["skill"], "country-compare")
        self.assertEqual(request["params"]["countries"], ["US", "GB", "DE"])

    def test_a_currency_is_not_a_country(self):
        request = parse({"parts": [{"kind": "text", "text": "GDP (current US$) for Germany 2019 to 2024"}]})
        self.assertNotIn("countries", request["params"], '"US$" is a currency, not a country code')
        self.assertEqual(request["params"]["country_name"], "Germany")
        self.assertEqual(request["params"]["years"], "2019:2024")

    def test_an_indicator_search_routes_to_the_catalogue(self):
        for text in ("which indicator measures life expectancy?",
                     "find an indicator about poverty",
                     "is there an indicator for fertility?"):
            request = parse({"parts": [{"kind": "text", "text": text}]})
            self.assertEqual(request["skill"], "indicator-search", text)
            self.assertTrue(request["params"]["term"], text)

    def test_a_country_question_routes_to_country_info(self):
        for text in ("what region is Kenya in?", "find the country code for Germany",
                     "list the countries in Sub-Saharan Africa"):
            request = parse({"parts": [{"kind": "text", "text": text}]})
            self.assertEqual(request["skill"], "country-info", text)
            self.assertNotIn("indicator", request["params"], text)

    def test_a_trend_question_routes_to_the_premium_skill(self):
        for text in (f"what is the trend in {GDP_PC} in Ireland since 2015?",
                     f"how has {LIFE} trended in WLD and JPN over the last decade?",
                     f"{GDP_PC} growth for IE over time"):
            parsed = parse({"parts": [{"kind": "text", "text": text}]})
            self.assertEqual(parsed["skill"], SKILL_INDICATOR_TREND, text)
            self.assertTrue(parsed["explicit"], text)
        self.assertEqual(
            parse({"parts": [{"kind": "text", "text": "GDP per capita growth for IE"}]})["params"]["years"],
            DEFAULT_YEARS)

    def test_country_extraction_helpers(self):
        self.assertEqual(countries_from_text("compare for US, GB and DE"), ["US", "GB", "DE"])
        self.assertIsNone(countries_from_text("GDP per capita in Norway"))
        self.assertEqual(country_name_from_text("what is GDP in Norway for 2023?"), "Norway")
        self.assertIsNone(country_name_from_text("What region is in question"))
        self.assertIsNone(country_name_from_text("GDP and PPP are big"))

    def test_help_and_empty(self):
        self.assertEqual(parse({"parts": [{"kind": "text", "text": ""}]})["skill"], "help")
        self.assertEqual(parse({"parts": [{"kind": "text", "text": "what can you do?"}]})["skill"], "help")

    def test_an_explicit_skill_id_is_honoured(self):
        request = parse({"parts": [{"kind": "data", "data": {
            "skill": "country-compare", "countries": ["US", "CA"], "indicator": GDP_PC,
            "years": "2020:2023"}}]})
        self.assertEqual(request["skill"], "country-compare")
        self.assertEqual(request["params"]["countries"], ["US", "CA"])
        self.assertTrue(request["explicit"])


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, client=None, **params):
        agent = WorldBankAgent(client=client or FakeWorldBank())
        request = {"skill": skill, "params": params, "missing": agent.missing(skill, params)}
        return agent.run(request)

    def test_indicator_value_returns_shaped_rows(self):
        result = self.run_skill("indicator-value", country_name="Norway", indicator=GDP_PC,
                                years="2021:2024", limit=5)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("GDP per capita (current US$)", result["message"])
        self.assertIn("Norway", result["message"])
        self.assertIn("89,889", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertIn("last updated 2026-07-13", result["message"])
        self.assertIn("left out", result["message"])
        self.assertEqual(result["artifact"]["indicator_code"], GDP_PC)
        self.assertEqual(result["artifact"]["observations"][0]["country_iso3"], "NOR")

    def test_indicator_value_with_no_published_year_says_so(self):
        result = self.run_skill("indicator-value", client=FakeWorldBank(rows=[]), country="IE",
                                indicator=GDP_PC, years="1960:1961")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("publishes no value", result["message"])
        self.assertEqual(result["artifact"]["observations"], [])

    def test_an_unknown_country_name_asks_for_the_code(self):
        result = self.run_skill("indicator-value", country_name="Atlantis", indicator=GDP_PC)
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("no country called", result["message"])
        self.assertIn("ISO", result["message"])

    def test_an_ambiguous_country_name_asks_which_one(self):
        result = self.run_skill("indicator-value", country_name="Guinea", indicator=GDP_PC)
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("matches more than one country", result["message"])
        for iso3 in ("GUI", "GNB", "GNQ", "PNG"):
            self.assertIn(iso3, result["message"], iso3)

    def test_country_compare_ranks_on_the_latest_year(self):
        result = self.run_skill("country-compare", client=FakeWorldBank(rows=COMPARE),
                                countries=["IRL", "JPN", "NGA"], indicator=GDP_PC,
                                years="2015:2024", limit=20)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("latest year 2024", result["message"])
        lines = [line for line in result["message"].splitlines() if line.startswith("  ")]
        self.assertIn("Ireland", lines[0], "the highest 2024 value ranks first")
        self.assertEqual(result["artifact"]["countries"], ["IRL", "JPN", "NGA"])

    def test_country_compare_needs_two_countries(self):
        result = self.run_skill("country-compare", countries=["US"], indicator=GDP_PC)
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("two or more", result["message"])

    def test_indicator_search_ranks_named_indicators_first(self):
        result = self.run_skill("indicator-search", term="poverty", limit=5)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("SH.POV.DDAY", result["message"])
        self.assertIn("1 indicator(s)", result["message"])
        self.assertIn(INDICATOR_DATASET, result["message"])
        self.assertEqual(result["artifact"]["dataset"], INDICATOR_DATASET)

    def test_indicator_search_with_no_hit_says_so(self):
        result = self.run_skill("indicator-search", term="zzzznothing")
        self.assertIn("No indicator in the World Development Indicators catalogue", result["message"])
        self.assertIn("holds 3 indicators", result["message"])

    def test_country_info_reports_the_full_record_for_a_code(self):
        result = self.run_skill("country-info", country="NO")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Norway (NOR, NO)", result["message"])
        self.assertIn("High income", result["message"])
        self.assertIn("Oslo", result["message"])
        self.assertEqual(result["artifact"]["dataset"], COUNTRY_DATASET)

    def test_country_info_searches_when_a_name_is_given(self):
        result = self.run_skill("country-info", country_name="Norway")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn('match “Norway”', result["message"])
        self.assertIn("NOR / NO", result["message"])
        self.assertEqual(result["artifact"]["needle"], "Norway")

    def test_country_info_lists_every_match_for_an_ambiguous_name(self):
        result = self.run_skill("country-info", country_name="Guinea")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("4 World Bank country/countries", result["message"])
        for iso3 in ("GUI", "GNB", "GNQ", "PNG"):
            self.assertIn(iso3, result["message"], iso3)

    def test_country_info_with_no_match_says_so(self):
        result = self.run_skill("country-info", country_name="Atlantis")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("No World Bank country matches", result["message"])
        self.assertIn("WLD", result["message"])

    def test_every_skill_needs_its_own_parameters(self):
        agent = WorldBankAgent(client=FakeWorldBank())
        self.assertEqual(agent.missing("indicator-value", {}), ["country", "indicator"])
        self.assertEqual(agent.missing("indicator-value", {"countries": ["US"]}), ["indicator"])
        self.assertEqual(agent.missing("indicator-search", {}), ["term"])
        self.assertEqual(agent.missing("country-info", {}), ["country"])
        self.assertEqual(agent.missing("country-info", {"country_name": "Kenya"}), [])
        self.assertEqual(agent.missing("indicator-value", {"country": "US", "indicator": GDP_PC}), [])
        result = agent.run({"skill": "indicator-value", "params": {}, "missing": ["country", "indicator"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("ISO", result["message"])
        self.assertIn("World Bank code", agent.input_prompt("indicator-value", ["indicator"]))
        self.assertIn("ISO", agent.input_prompt("indicator-value", ["country"]))
        self.assertIn("subject", agent.input_prompt("indicator-search", ["term"]))

    def test_a_bad_argument_is_a_question_not_a_crash(self):
        client = WorldBankClient(fetch=fetch_from(NORWAY))
        result = self.run_skill("indicator-value", client=client, country="IE", indicator="not a code")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("indicator code looks like", result["message"])
        result = self.run_skill("indicator-value", client=client, country="IE", indicator=GDP_PC,
                                years="20x0")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("years must be", result["message"])

    def test_help_does_not_touch_the_feed(self):
        result = self.run_skill("help")
        self.assertIn("World Bank", result["message"])
        self.assertIn("never fill a missing year with zero", result["message"])
        self.assertIsNone(result["artifact"])

    def test_card_lists_four_free_skills_and_one_premium(self):
        ids = [skill["id"] for skill in CARD_SKILLS]
        self.assertEqual(ids, ["indicator-value", "country-compare", "indicator-search",
                               "country-info", "indicator-trend"])
        premium = [skill for skill in CARD_SKILLS if "premium" in skill["tags"]]
        self.assertEqual([skill["id"] for skill in premium], ["indicator-trend"])
        for skill in CARD_SKILLS[:-1]:
            self.assertNotIn("premium", skill["tags"], skill["id"])

    def test_agent_metadata(self):
        agent = WorldBankAgent(client=FakeWorldBank())
        self.assertEqual(agent.env_prefix, "WORLDBANK")
        self.assertEqual(agent.datasets, (DATASET, COUNTRY_DATASET, INDICATOR_DATASET))
        self.assertEqual(agent.watch_kinds, ())


#: Shape copied from a live gateway `worldbank_indicator_trend` answer.
TREND_PAYLOAD = {
    "indicator": GDP_PC,
    "indicatorName": "GDP per capita (current US$)",
    "countries": ["IRL", "JPN", "NGA"],
    "years": "2015:2024",
    "sourceId": 2,
    "lastUpdated": "2026-07-13",
    "totalHits": 30,
    "series": [
        {"country": "Ireland", "observations": 10, "firstYear": "2015", "firstValue": 64250.14,
         "lastYear": "2024", "lastValue": 112894.95, "yearsSpanned": 9, "change": 48644.81,
         "changePercent": 75.7142, "perYearPercent": 6.4625, "direction": "up",
         "risingYears": 8, "fallingYears": 1, "observedYears": 9,
         "best": {"year": "2024", "value": 112894.95}, "worst": {"year": "2016", "value": 61864.0}},
        {"country": "Nigeria", "observations": 10, "firstYear": "2015", "firstValue": 2585.73,
         "lastYear": "2024", "lastValue": 1084.16, "yearsSpanned": 9, "change": -1501.57,
         "changePercent": -58.0776, "perYearPercent": -9.2083, "direction": "down",
         "risingYears": 3, "fallingYears": 6, "observedYears": 9,
         "best": {"year": "2019", "value": 2167.4}, "worst": {"year": "2024", "value": 1084.16}},
    ],
    "gapFirst": {"year": "2015", "high": "Ireland", "value": 64250.14, "low": "Nigeria",
                 "lowValue": 2585.73},
    "gapLast": {"year": "2024", "high": "Ireland", "value": 112894.95, "low": "Nigeria",
                "lowValue": 1084.16},
    "note": "Years the World Bank published no value for are skipped.",
}

DENIED_TEXT = ("`worldbank_indicator_trend` is a premium tool, but that license key is not valid. "
               "Get a key at https://buy.polar.sh/polar_cl_example")
TOOL_ERROR_TEXT = "`worldbank_indicator_trend` failed: upstream returned HTTP 500"


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


class TrendSkillTests(unittest.TestCase):
    """The premium skill: parsing stays local, the arithmetic comes from the gateway."""

    def run_trend(self, gateway, client=None, **params):
        payload = {"countries": ["IRL", "JPN", "NGA"], "indicator": GDP_PC,
                   "years": "2015:2024", **params}
        return WorldBankAgent(client or FakeWorldBank(), gateway=gateway).run(
            {"skill": SKILL_INDICATOR_TREND, "params": payload, "missing": []})

    def test_the_trend_question_routes_to_the_premium_skill(self):
        for text in ("what is the trend in NY.GDP.PCAP.CD in Ireland since 2015?",
                     "how has SP.DYN.LE00.IN trended in WLD and JPN over the last decade?",
                     "NY.GDP.PCAP.CD growth for IE over time"):
            parsed = parse(_message(text))
            self.assertEqual(parsed["skill"], SKILL_INDICATOR_TREND, text)
            self.assertTrue(parsed["explicit"], text)

    def test_the_free_skills_keep_their_own_questions(self):
        for text, skill in ((f"what is {GDP_PC} in Norway for 2023?", "indicator-value"),
                            (f"compare {GDP_PC} for US, GB and DE in 2023", "country-compare"),
                            ("which indicator measures life expectancy?", "indicator-search"),
                            ("what region is Kenya in?", "country-info")):
            self.assertEqual(parse(_message(text))["skill"], skill, text)

    def test_since_2015_runs_from_2015_to_now(self):
        # "since" names the start of the window, and only the wording says so.
        parsed = parse(_message("what is the trend in NY.GDP.PCAP.CD in Ireland since 2015?"))
        self.assertRegex(parsed["params"]["years"], r"^2015:\d{4}$")

    def test_a_bare_year_sent_to_the_trend_becomes_a_ten_year_window(self):
        gateway, calls = fake_gateway(TREND_PAYLOAD)
        result = WorldBankAgent(FakeWorldBank(), gateway=gateway).run(
            {"skill": SKILL_INDICATOR_TREND,
             "params": {"country_name": "Ireland", "indicator": GDP_PC, "years": "2015"},
             "missing": []})
        self.assertEqual(result["final_state"], "completed")
        sent = calls[0]["payload"]["params"]["arguments"]
        self.assertEqual(sent["countries"], "IRL")
        self.assertRegex(sent["years"], r"^2006:\d{4}$",
                         "a bare year is read as the end of a ten-year window")

    def test_the_message_reports_the_gateways_trend(self):
        gateway, calls = fake_gateway(TREND_PAYLOAD)
        result = self.run_trend(gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("GDP per capita (current US$)", result["message"])
        self.assertIn("2015 64,250 -> 2024 112,895", result["message"])
        self.assertIn("+75.71% over 9 year(s)", result["message"])
        self.assertIn("direction up, 8 up and 1 down", result["message"])
        self.assertIn("best 2024", result["message"])
        self.assertIn("Nigeria", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertTrue(result["artifact"]["premium"])
        self.assertEqual(len(result["artifact"]["series"]), 2)

        # The World Bank was read behind the gate, not here.
        self.assertEqual(len(calls), 1)
        sent = calls[0]["payload"]["params"]
        self.assertEqual(sent["name"], "worldbank_indicator_trend")
        self.assertEqual(sent["arguments"]["indicator"], GDP_PC)
        self.assertEqual(sent["arguments"]["countries"], "IRL;JPN;NGA")
        self.assertEqual(sent["arguments"]["years"], "2015:2024")

    def test_without_a_licence_the_caller_is_told_how_to_get_one(self):
        gateway, calls = fake_gateway(key="")
        result = self.run_trend(gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("MCP_LICENSE_KEY", result["message"])
        self.assertEqual(result["artifact"]["reason"], "missing_key")
        self.assertNotIn("series", result["artifact"])
        self.assertEqual(calls, [], "a keyless caller must not reach the gateway")

    def test_a_licence_refusal_keeps_the_gateways_wording(self):
        gateway, _ = fake_gateway()  # nothing but a refusal
        result = self.run_trend(gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["message"], DENIED_TEXT)
        self.assertEqual(result["artifact"]["reason"], "denied")

    def test_a_dead_gateway_fails_instead_of_inventing_a_trend(self):
        gateway, _ = fake_gateway(error=OSError("connection refused"))
        result = self.run_trend(gateway)
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("could not be reached", result["message"])
        self.assertIsNone(result["artifact"].get("series"))

    def test_a_tool_error_is_not_sold_as_a_licence_problem(self):
        gateway, _ = fake_gateway(tool_error=TOOL_ERROR_TEXT)
        result = self.run_trend(gateway)
        self.assertEqual(result["final_state"], "failed")
        self.assertNotIn("MCP_LICENSE_KEY", result["message"])
        self.assertIn("HTTP 500", result["message"])

    def test_a_bad_argument_never_reaches_the_gateway(self):
        gateway, calls = fake_gateway(TREND_PAYLOAD)
        result = self.run_trend(gateway, indicator="not a code")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("indicator code looks like", result["message"])
        result = self.run_trend(gateway, years="2024:2015")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("run forwards", result["message"])
        self.assertEqual(calls, [])

    def test_a_trend_over_no_published_years_reports_cleanly(self):
        payload = {**TREND_PAYLOAD, "series": [], "gapFirst": None, "gapLast": None}
        gateway, _ = fake_gateway(payload)
        result = self.run_trend(gateway)
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("without a trend", result["message"])

    def test_a_country_name_is_resolved_before_the_gateway_is_called(self):
        gateway, calls = fake_gateway(TREND_PAYLOAD)
        result = WorldBankAgent(FakeWorldBank(), gateway=gateway).run(
            {"skill": SKILL_INDICATOR_TREND,
             "params": {"country_name": "Guinea", "indicator": GDP_PC, "years": "2015:2024"},
             "missing": []})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("matches more than one country", result["message"])
        self.assertEqual(calls, [], "an ambiguous country never reaches the gateway")


if __name__ == "__main__":
    unittest.main()
