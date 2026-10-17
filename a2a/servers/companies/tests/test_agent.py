"""Tests for the GLEIF companies server.

    python3 servers/companies/tests/test_agent.py
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
    BBC_LEI,
    CARD_SKILLS,
    SKILL_GROUP_ROLLUP,
    GleifAgent,
    name_from_text,
    parse,
)
from data import (  # noqa: E402
    DATASET,
    GleifClient,
)

JPMORGAN_LEI = "8I5DZWZKVSZI1NUHU748"


def record(lei: str, name: str, status: str = "ACTIVE", jurisdiction: str = "US-DE",
           country: str = "US", registered_as: str = "691011", registration: dict | None = None,
           other_names: list[str] | None = None) -> dict:
    """One GLEIF record in the shape the API actually returns."""
    attributes = {
        "lei": lei,
        "entity": {
            "legalName": {"name": name, "language": "en"},
            "status": status,
            "legalForm": {"id": "XTIQ", "other": None},
            "jurisdiction": jurisdiction,
            "category": "GENERAL",
            "subCategory": None,
            "registeredAs": registered_as,
            "otherNames": [{"name": other, "language": "en"} for other in (other_names or [])],
            "legalAddress": {
                "language": "en",
                "addressLines": ["CORPORATION TRUST CENTER", "1209 ORANGE ST"],
                "city": "WILMINGTON",
                "region": "US-DE",
                "country": country,
                "postalCode": "19801",
            },
            "creationDate": "1968-10-28T00:00:00Z",
            "expiration": {"date": None, "reason": None},
        },
    }
    if registration is not None:
        attributes["registration"] = registration
    return {"type": "lei-records", "id": lei, "attributes": attributes,
            "relationships": {}, "links": {"self": f"https://api.gleif.org/api/v1/lei-records/{lei}"}}


JPMORGAN = record(
    JPMORGAN_LEI, "JPMORGAN CHASE & CO.",
    registration={
        "status": "ISSUED", "initialRegistrationDate": "2012-06-06T15:53:00Z",
        "lastUpdateDate": "2026-01-12T10:41:29Z", "nextRenewalDate": "2027-01-22T16:26:28Z",
        "managingLou": "529900T8BM49AURSDO55", "corroborationLevel": "FULLY_CORROBORATED",
    },
    other_names=["JPMorgan Chase"],
)
BBC = record(BBC_LEI, "BRITISH BROADCASTING CORPORATION", jurisdiction="GB", country="GB",
             registered_as="RC000057")
BBC_HOLDINGS = record("724500584P2MZ4WC3858", "BBC WORLDWIDE HOLDINGS B.V.", jurisdiction="NL",
                      country="NL", registered_as="34236454")
BBC_INDIA = record("549300KEOBR46CEH1256", "BBC GLOBAL NEWS INDIA PRIVATE LIMITED",
                   jurisdiction="IN", country="IN", registered_as="U70109DL1998FTC096699")
BBC_SINGAPORE = record("5493006Z6YQV4IOHDY06", "BBC GLOBAL NEWS SINGAPORE PTE. LTD.",
                       jurisdiction="SG", country="SG", registered_as="199805877R")
SINGAPORE_ENTITY = record("9845004B7F5AE2D77E87", "VERDARA CAPITAL SUB-FUND I", "INACTIVE",
                          jurisdiction="SG", country="SG", registered_as="200912345K")


def _no_network(*args, **kwargs):
    raise AssertionError("FakeGleif must not touch the network")


class FakeGleif(GleifClient):
    """Same interface as GleifClient, no network. Derived helpers stay real."""

    def __init__(self, by_name_rows=(JPMORGAN,), by_lei_rows=(JPMORGAN,),
                 children=(BBC_HOLDINGS, BBC_INDIA, BBC_SINGAPORE), country_rows=(SINGAPORE_ENTITY,),
                 total=None) -> None:
        super().__init__(fetch=_no_network)
        self.name_rows = list(by_name_rows)
        self.lei_rows = list(by_lei_rows)
        self.child_rows = list(children)
        self.country_rows = list(country_rows)
        self.total = total
        self.reads = []

    def records(self, filters, limit=10):
        self.reads.append(("records", dict(filters), limit))
        if "filter[ultimateParent.lei]" in filters:
            rows, key = self.child_rows, "children"
        elif "filter[entity.legalAddress.country]" in filters:
            rows, key = self.country_rows, "country"
        elif "filter[lei]" in filters:
            rows = [row for row in self.lei_rows
                    if row["attributes"]["lei"] == filters["filter[lei]"]]
            key = "lei"
        elif "filter[entity.legalName]" in filters:
            # GLEIF matches legal names exactly, which is the whole point of the retry.
            wanted = filters["filter[entity.legalName]"]
            rows = [row for row in self.name_rows
                    if row["attributes"]["entity"]["legalName"]["name"] == wanted]
            key = "name"
        else:
            rows, key = self.name_rows, "name"
        return {"filters": dict(filters),
                "total": self.total if self.total is not None else len(rows),
                "page_size": len(rows),
                "records": [self._summarise(row) for row in rows[:limit]],
                "key": key}

    def by_lei(self, lei):
        self.reads.append(("by_lei", lei))
        for row in self.lei_rows:
            if row["attributes"]["lei"] == lei:
                return self._summarise(row)
        return None

    def children_of(self, lei, limit=100):
        found = self.records({"filter[ultimateParent.lei]": lei}, limit)
        found["ultimate_parent"] = lei
        return found


def fetch_from(rows, total=None, calls=None):
    """A JsonApiClient `fetch` so data.py runs for real against a GLEIF-shaped page."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        if "filter[ultimateParent.lei]" in params:
            page = [row for row in rows if row["attributes"]["lei"] in CHILD_LEIS]
        elif "filter[lei]" in params:
            page = [row for row in rows if row["attributes"]["lei"] == params["filter[lei]"]]
        elif "filter[entity.legalName]" in params:
            wanted = params["filter[entity.legalName]"]
            page = [row for row in rows
                    if row["attributes"]["entity"]["legalName"]["name"] == wanted]
        else:
            page = list(rows)
        return {"meta": {"pagination": {"total": total if total is not None else len(page)}},
                "data": page}

    return fetch


CHILD_LEIS = {row["attributes"]["lei"] for row in (BBC_HOLDINGS, BBC_INDIA, BBC_SINGAPORE)}


class ValidationTests(unittest.TestCase):
    def test_check_lei(self):
        self.assertEqual(GleifClient.check_lei(" 8i5dzwzkvszi1nuhu748 "), JPMORGAN_LEI)
        self.assertEqual(GleifClient.check_lei("8I5DZWZKVSZI1NUHU74 8"), JPMORGAN_LEI)
        for bad in ("nope", "8I5DZWZKVSZI1NUHU74", "8I5DZWZKVSZI1NUHU7480", ""):
            with self.assertRaises(ValueError):
                GleifClient.check_lei(bad)

    def test_check_name_and_country(self):
        self.assertEqual(GleifClient.check_name("  JPMORGAN   CHASE  "), "JPMORGAN CHASE")
        for bad in ("", "   ", None):
            with self.assertRaises(ValueError):
                GleifClient.check_name(bad)
        self.assertEqual(GleifClient.check_country("us"), "US")
        self.assertIsNone(GleifClient.check_country(None))
        with self.assertRaises(ValueError):
            GleifClient.check_country("USA")

    def test_check_limit(self):
        self.assertEqual(GleifClient.check_limit("25"), 25)
        for bad in ("0", "101", "lots"):
            with self.assertRaises(ValueError):
                GleifClient.check_limit(bad)

    def test_name_variants_add_and_drop_only_the_trailing_period(self):
        self.assertEqual(GleifClient._name_variants("ACME CO"),
                         ["ACME CO", "ACME CO."])
        self.assertEqual(GleifClient._name_variants("ACME CO."),
                         ["ACME CO.", "ACME CO"])


class ReaderTests(unittest.TestCase):
    def test_records_send_the_bracket_filter(self):
        calls = []
        client = GleifClient(fetch=fetch_from([JPMORGAN], total=1, calls=calls))
        found = client.records({"filter[entity.legalName]": "JPMORGAN CHASE & CO."}, 5)
        url, params = calls[0]
        self.assertTrue(url.endswith("/lei-records"))
        self.assertEqual(params["filter[entity.legalName]"], "JPMORGAN CHASE & CO.")
        self.assertEqual(params["page[size]"], 5)
        self.assertEqual(found["total"], 1)
        self.assertEqual(found["records"][0]["lei"], JPMORGAN_LEI)
        self.assertEqual(found["records"][0]["registration"]["corroboration_level"],
                         "FULLY_CORROBORATED")

    def test_by_name_reports_the_name_gleif_files_not_the_one_filtered_on(self):
        # GLEIF's own filter is tolerant of case and of the trailing period, so the
        # name in the record is the truthful thing to report.
        client = GleifClient(fetch=fetch_from([JPMORGAN], total=1))
        found = client.by_name("JPMORGAN CHASE & CO")
        self.assertEqual(found["matched_name"], "JPMORGAN CHASE & CO.")
        self.assertEqual(found["query"], "JPMORGAN CHASE & CO")
        self.assertEqual(found["records"][0]["name"], "JPMORGAN CHASE & CO.")

    def test_by_name_reports_no_match_rather_than_guessing(self):
        client = GleifClient(fetch=fetch_from([], total=0))
        found = client.by_name("NOT A REAL ENTITY NAME")
        self.assertEqual(found["records"], [])
        self.assertIsNone(found["matched_name"])

    def test_by_lei_uses_the_filter_so_an_unknown_lei_is_not_an_error(self):
        calls = []
        client = GleifClient(fetch=fetch_from([JPMORGAN], total=1, calls=calls))
        self.assertEqual(client.by_lei(JPMORGAN_LEI)["name"], "JPMORGAN CHASE & CO.")
        self.assertIsNone(client.by_lei("8I5DZWZKVSZI1NUHU799"))
        self.assertEqual(calls[1][1]["filter[lei]"], "8I5DZWZKVSZI1NUHU799")

    def test_children_of_uses_the_ultimate_parent_filter(self):
        calls = []
        client = GleifClient(fetch=fetch_from([BBC, BBC_HOLDINGS, BBC_INDIA], total=3, calls=calls))
        found = client.children_of(BBC_LEI, limit=10)
        self.assertEqual(calls[0][1]["filter[ultimateParent.lei]"], BBC_LEI)
        self.assertEqual(found["ultimate_parent"], BBC_LEI)
        self.assertEqual([row["name"] for row in found["records"]],
                         ["BBC WORLDWIDE HOLDINGS B.V.", "BBC GLOBAL NEWS INDIA PRIVATE LIMITED"])

    def test_a_malformed_payload_is_an_upstream_error(self):
        from a2a_kit import UpstreamError

        client = GleifClient(fetch=lambda url, params, headers: {"meta": {}})
        with self.assertRaises(UpstreamError):
            client.records({"filter[lei]": JPMORGAN_LEI}, 1)

    def test_the_flat_address_keeps_its_own_order(self):
        client = GleifClient(fetch=_no_network)
        flat = client._flat(JPMORGAN["attributes"]["entity"])
        self.assertEqual(flat["address"],
                         "CORPORATION TRUST CENTER, 1209 ORANGE ST, WILMINGTON, US-DE, 19801, US")
        self.assertEqual(flat["country"], "US")
        self.assertEqual(flat["other_names"], ["JPMorgan Chase"])
        self.assertEqual(flat["expiration_date"], None)


class ParseTests(unittest.TestCase):
    def test_a_name_routes_to_entity_lookup(self):
        request = parse({"parts": [{"kind": "text", "text": "look up JPMORGAN CHASE & CO."}]})
        self.assertEqual(request["skill"], "entity-lookup")
        self.assertEqual(request["params"]["name"], "JPMORGAN CHASE & CO")
        self.assertTrue(request["explicit"])

    def test_a_lei_question_routes_to_lei_lookup(self):
        for text in (f"what is LEI {JPMORGAN_LEI}?",
                     f"details for LEI {JPMORGAN_LEI}",
                     f"what is the registration and renewal for {JPMORGAN_LEI}"):
            request = parse({"parts": [{"kind": "text", "text": text}]})
            self.assertEqual(request["skill"], "lei-lookup", text)
            self.assertEqual(request["params"]["lei"], JPMORGAN_LEI, text)

    def test_a_parent_question_routes_to_ownership(self):
        for text in (f"who owns the entities under ultimate parent {BBC_LEI}?",
                     f"list the subsidiaries of LEI {BBC_LEI}"):
            request = parse({"parts": [{"kind": "text", "text": text}]})
            self.assertEqual(request["skill"], "ownership", text)
            self.assertEqual(request["params"]["lei"], BBC_LEI, text)

    def test_a_country_question_routes_to_the_country_skill(self):
        for text, code in (("which legal entities are registered in DE?", "DE"),
                           ("show me LEI entities registered in Japan", "JP"),
                           ("entities in the United Kingdom", "GB")):
            request = parse({"parts": [{"kind": "text", "text": text}]})
            self.assertEqual(request["skill"], "entities-in-country", text)
            self.assertEqual(request["params"]["country"], code, text)
            self.assertNotIn("name", request["params"], "a country question carries no company name")

    def test_a_country_word_never_becomes_a_name(self):
        request = parse({"parts": [{"kind": "text", "text": "look up APPLE INC"}]})
        self.assertEqual(request["params"]["name"], "APPLE INC")
        self.assertNotIn("country", request["params"])


    def test_a_quoted_name_is_used_verbatim(self):
        request = parse({"parts": [{"kind": "text", "text": 'look up "Volkswagen AG" please'}]})
        self.assertEqual(request["params"]["name"], "Volkswagen AG")
        self.assertIsNone(name_from_text("look up Siemens", "Siemens"))

    def test_help_and_empty(self):
        self.assertEqual(parse({"parts": [{"kind": "text", "text": ""}]})["skill"], "help")
        self.assertEqual(parse({"parts": [{"kind": "text", "text": "what can you do?"}]})["skill"], "help")

    def test_an_explicit_skill_id_is_honoured(self):
        request = parse({"parts": [{"kind": "data", "data": {
            "skill": "entity-lookup", "name": "SIEMENS AG", "limit": 3}}]})
        self.assertEqual(request["skill"], "entity-lookup")
        self.assertEqual(request["params"]["limit"], 3)
        self.assertTrue(request["explicit"])


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, client=None, **params):
        agent = GleifAgent(client=client or FakeGleif())
        request = {"skill": skill, "params": params, "missing": agent.missing(skill, params)}
        return agent.run(request)

    def test_entity_lookup_returns_the_record(self):
        result = self.run_skill("entity-lookup", name="JPMORGAN CHASE & CO", limit=5)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("JPMORGAN CHASE & CO.", result["message"])
        self.assertIn(JPMORGAN_LEI, result["message"])
        self.assertIn("ACTIVE", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertIn("filed identifying data", result["message"])
        self.assertEqual(result["artifact"]["matched_name"], "JPMORGAN CHASE & CO.")
        self.assertIn("which GLEIF files as", result["message"])
        self.assertEqual(result["artifact"]["records"][0]["country"], "US")

    def test_entity_lookup_with_no_match_says_so(self):
        result = self.run_skill("entity-lookup", client=FakeGleif(by_name_rows=()),
                                name="NOT A REAL ENTITY NAME")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("No legal entity in GLEIF files the exact name", result["message"])
        self.assertIn("exactly", result["message"])

    def test_lei_lookup_reports_registration_and_corroboration(self):
        result = self.run_skill("lei-lookup", lei=JPMORGAN_LEI)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("JPMORGAN CHASE & CO.", result["message"])
        self.assertIn("FULLY_CORROBORATED", result["message"])
        self.assertIn("2027-01-22", result["message"])
        self.assertIn("CORPORATION TRUST CENTER", result["message"])
        self.assertIn("JPMorgan Chase", result["message"])
        self.assertEqual(result["artifact"]["record"]["registration"]["managing_lou"],
                         "529900T8BM49AURSDO55")

    def test_lei_lookup_for_an_unknown_lei_says_so(self):
        result = self.run_skill("lei-lookup", client=FakeGleif(by_lei_rows=()),
                                lei="8I5DZWZKVSZI1NUHU799")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("holds no legal entity under LEI", result["message"])
        self.assertIsNone(result["artifact"]["record"])

    def test_ownership_lists_the_children(self):
        result = self.run_skill("ownership", lei=BBC_LEI, limit=3)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("3 legal entities", result["message"])
        self.assertIn(BBC_LEI, result["message"])
        self.assertIn("BBC WORLDWIDE HOLDINGS B.V.", result["message"])
        self.assertIn("parent link as a filter", result["message"])
        self.assertEqual(result["artifact"]["records"][0]["country"], "NL")

    def test_ownership_with_no_children_says_so(self):
        result = self.run_skill("ownership", client=FakeGleif(children=()), lei=BBC_LEI)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("no legal entity whose ultimate parent is", result["message"])
        self.assertIn("not proof the parent owns nothing", result["message"])

    def test_entities_in_country_uses_the_country_filter(self):
        client = FakeGleif()
        result = self.run_skill("entities-in-country", client=client, country="SG", limit=5)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("registered address in SG", result["message"])
        self.assertIn("VERDARA CAPITAL SUB-FUND I", result["message"])
        self.assertIn("INACTIVE", result["message"])
        self.assertEqual(client.reads[-1][1]["filter[entity.legalAddress.country]"], "SG")

    def test_entities_in_country_with_nothing_asks_for_a_code(self):
        agent = GleifAgent(client=FakeGleif())
        self.assertEqual(agent.missing("entities-in-country", {}), ["country"])
        self.assertIn("alpha-2", agent.input_prompt("entities-in-country", ["country"]))
        result = self.run_skill("entities-in-country", client=FakeGleif(country_rows=()), country="ZZ")
        self.assertIn("holds no legal entity whose registered address is in ZZ", result["message"])

    def test_every_skill_needs_its_own_parameter(self):
        agent = GleifAgent(client=FakeGleif())
        self.assertEqual(agent.missing("entity-lookup", {}), ["name"])
        self.assertEqual(agent.missing("lei-lookup", {}), ["lei"])
        self.assertEqual(agent.missing("ownership", {}), ["lei"])
        self.assertEqual(agent.missing("group-rollup", {}), ["lei"])
        self.assertEqual(agent.missing("lei-lookup", {"lei": BBC_LEI}), [])
        for skill, missing in (("entity-lookup", ["name"]), ("lei-lookup", ["lei"]),
                               ("group-rollup", ["lei"])):
            result = agent.run({"skill": skill, "params": {}, "missing": missing})
            self.assertEqual(result["final_state"], "input-required", skill)
            self.assertIsNone(result["artifact"], skill)
        self.assertIn(BBC_LEI, agent.input_prompt("group-rollup", ["lei"]))

    def test_a_bad_argument_is_a_question_not_a_crash(self):
        client = GleifClient(fetch=fetch_from([JPMORGAN], total=1))
        result = self.run_skill("lei-lookup", client=client, lei="not-an-lei")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("an LEI is 20 characters", result["message"])
        result = self.run_skill("entity-lookup", client=client, name="ACME", limit=500)
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("limit must be between", result["message"])

    def test_help_does_not_touch_the_feed(self):
        result = self.run_skill("help")
        self.assertIn("GLEIF", result["message"])
        self.assertIn("exact", result["message"])
        self.assertIsNone(result["artifact"])


    def test_agent_metadata(self):
        agent = GleifAgent(client=FakeGleif())
        self.assertEqual(agent.env_prefix, "COMPANIES")
        self.assertEqual(agent.datasets, (DATASET,))
        self.assertEqual(agent.watch_kinds, ())


#: Shape copied from a live gateway `companies_group_rollup` answer for the BBC.
ROLLUP_PAYLOAD = {
    "ultimateParent": BBC_LEI,
    "ultimateParentName": "BRITISH BROADCASTING CORPORATION",
    "total": 14,
    "read": 14,
    "detailRead": 14,
    "active": 13,
    "inactive": 1,
    "unknownStatus": 0,
    "countries": [{"name": "GB", "count": 10}, {"name": "IN", "count": 2}, {"name": "NL", "count": 1}],
    "jurisdictions": [{"name": "GB", "count": 10}, {"name": "IN", "count": 2}, {"name": "NL", "count": 1}],
    "soonestRenewal": {"lei": "5493006Z6YQV4IOHDY06", "name": "BBC GLOBAL NEWS SINGAPORE PTE. LTD.",
                       "nextRenewalDate": "2026-11-04T00:00:00Z"},
    "subsidiaries": [
        {"lei": "724500584P2MZ4WC3858", "name": "BBC WORLDWIDE HOLDINGS B.V.", "status": "ACTIVE",
         "jurisdiction": "NL", "country": "NL", "registeredAs": "34236454",
         "registrationStatus": "ISSUED", "nextRenewalDate": "2027-02-01T00:00:00Z",
         "corroborationLevel": "FULLY_CORROBORATED"},
        {"lei": "549300KEOBR46CEH1256", "name": "BBC GLOBAL NEWS INDIA PRIVATE LIMITED",
         "status": "INACTIVE", "jurisdiction": "IN", "country": "IN",
         "registeredAs": "U70109DL1998FTC096699", "registrationStatus": "LAPSED",
         "nextRenewalDate": "2026-11-04T00:00:00Z", "corroborationLevel": "ENTITY_SUPPLIED"},
    ],
    "note": "Statuses and countries come from the subsidiary list GLEIF returned.",
}

TOOL_ERROR_TEXT = "`companies_group_rollup` failed: upstream returned HTTP 500"


def _message(text, **extra):
    payload = {"kind": "message", "role": "user", "messageId": "test-message",
               "parts": [{"kind": "text", "text": text}]}
    payload.update(extra)
    return payload




class RollupSkillTests(unittest.TestCase):
    """The premium skill: parsing stays local, the roll-up comes from the gateway."""

    def run_rollup(self, gateway, client=None, **params):
        payload = {"lei": BBC_LEI, "limit": 100, **params}
        return GleifAgent(client or FakeGleif(), gateway=gateway).run(
            {"skill": SKILL_GROUP_ROLLUP, "params": payload, "missing": []})


    def test_the_free_skills_keep_their_own_questions(self):
        for text, skill in (("look up JPMORGAN CHASE & CO.", "entity-lookup"),
                            (f"what is LEI {JPMORGAN_LEI}?", "lei-lookup"),
                            (f"who owns the entities under ultimate parent {BBC_LEI}?", "ownership"),
                            ("which legal entities are registered in DE?", "entities-in-country")):
            self.assertEqual(parse(_message(text))["skill"], skill, text)

    def test_an_explicit_skill_id_is_honoured(self):
        parsed = parse(_message("anything at all", parts=[
            {"kind": "data", "data": {"skill": SKILL_GROUP_ROLLUP, "lei": BBC_LEI, "limit": 50}}]))
        self.assertEqual(parsed["skill"], SKILL_GROUP_ROLLUP)
        self.assertEqual(parsed["params"]["limit"], 50)









if __name__ == "__main__":
    unittest.main()
