"""Tests for the Senate lobbying server.

    python3 servers/lobbying/tests/test_agent.py
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
    SKILL_CLIENT_SPEND,
    LobbyingAgent,
    name_from_text,
    parse,
)
from data import (  # noqa: E402
    CLIENTS_DATASET,
    DATASET,
    LdaClient,
)

LOCKHEED_UUID = "9ad88323-8325-40eb-9036-eb5ea7c6827f"
GARSON_UUID = "7866327b-c892-4430-b9f0-1f0f679c58c6"


def filing(uuid, filing_type, period_display, expenses, issues, lobbyist="BRETT GARSON",
           client_name="LOCKHEED MARTIN CORPORATION", posted="2024-04-22T16:30:00-04:00",
           income=None, method="C"):
    """One filing in the shape LDA actually returns."""
    return {
        "filing_uuid": uuid,
        "filing_type": filing_type,
        "filing_type_display": f"{period_display.split(' (')[0]} - Report",
        "filing_year": 2024,
        "filing_period": filing_type.lower(),
        "filing_period_display": period_display,
        "dt_posted": posted,
        "expenses": expenses,
        "income": income,
        "expenses_method": method,
        "registrant": {"id": 23031, "name": "LOCKHEED MARTIN CORPORATION"},
        "client": {"id": 129850, "name": client_name},
        "registrant_state": "MD",
        "registrant_city": "Bethesda",
        "lobbying_activities": [
            {"general_issue_code": code, "general_issue_code_display": issue,
             "description": f"Work on {issue.lower()}.",
             "foreign_entity_issues": None,
             "lobbyists": [{"lobbyist": {"id": 38841, "first_name": lobbyist.split()[0],
                                         "last_name": lobbyist.split()[1]},
                            "covered_position": "Scheduler, Rep. Example", "new": True}],
             "government_entities": []}
            for code, issue in issues
        ],
        "filing_document_url": f"https://lda.gov/filings/public/filing/{uuid}/print/",
    }


Q1 = filing(LOCKHEED_UUID, "Q1", "1st Quarter (Jan 1 - Mar 31)", 3270000.0,
            [("BUD", "Budget/Appropriations"), ("DEF", "Defense")])
Q2 = filing("11111111-2222-4333-8444-555555555555", "Q2", "2nd Quarter (Apr 1 - June 30)", 3100000.0,
            [("DEF", "Defense"), ("TEC", "Telecommunications")], posted="2024-07-22T16:30:00-04:00")
REGISTRATION = filing(GARSON_UUID, "RR", "1st Quarter (Jan 1 - Mar 31)", None,
                      [("DIS", "Disaster Planning/Emergencies")], lobbyist="BRETT GARSON",
                      client_name="E-COM 9-1-1 DISPATCH CENTER", posted="2024-01-02T10:13:41-05:00",
                      method=None)

COUNTED = 12


def _no_network(*args, **kwargs):
    raise AssertionError("FakeLda must not touch the network")


class FakeLda(LdaClient):
    """Same interface as LdaClient, no network. Derived helpers stay real."""

    def __init__(self, filings=(Q1, Q2, REGISTRATION), detail=None, total=None) -> None:
        super().__init__(fetch=_no_network)
        self.rows = list(filings)
        self.detail_row = detail
        self.total = total if total is not None else len(self.rows)
        self.reads = []

    def filings(self, year=None, registrant=None, client=None, lobbyist=None,
                filing_type=None, limit=20):
        self.reads.append(("filings", year, registrant, client, lobbyist, filing_type, limit))
        rows = list(self.rows)
        if registrant:
            needle = registrant.lower()
            rows = [row for row in rows
                    if needle in (row["registrant"]["name"] or "").lower()
                    or needle in (row["client"]["name"] or "").lower()]
        if client:
            needle = client.lower()
            rows = [row for row in rows if needle in (row["client"]["name"] or "").lower()]
        if filing_type:
            rows = [row for row in rows if row["filing_type"] == filing_type]
        return {"filters": {k: v for k, v in (("filing_year", year),
                                              ("registrant_name", registrant),
                                              ("client_name", client),
                                              ("lobbyist_name", lobbyist),
                                              ("filing_type", filing_type)) if v},
                "total": self.total, "page_size": len(rows),
                "filings": [self.summarise(row) for row in rows[:limit]]}

    def filing_detail(self, uuid):
        self.reads.append(("filing_detail", uuid))
        if uuid == LOCKHEED_UUID:
            source = self.detail_row or self.rows[0]
        else:
            source = next((row for row in self.rows if row["filing_uuid"] == uuid), None)
        if source is None:
            return None
        record = self.summarise(source)
        record["activities"] = [self._activity(activity)
                                for activity in (source.get("lobbying_activities") or [])]
        record["affiliated_organizations"] = []
        record["foreign_entities"] = []
        record["conviction_disclosures"] = []
        return record


def fetch_from(rows, calls=None):
    """A JsonApiClient `fetch` so data.py runs for real against an LDA-shaped page."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        if url.rstrip("/").endswith("/filings"):
            return {"count": len(rows), "results": list(rows)}
        uuid = url.rstrip("/").split("/")[-1]
        match = [row for row in rows if row["filing_uuid"] == uuid]
        return match[0] if match else {}
        raise AssertionError(f"unexpected url {url}")

    return fetch


class ValidationTests(unittest.TestCase):
    def test_check_year(self):
        self.assertEqual(LdaClient.check_year("2024"), 2024)
        for bad in ("24", "abcd", "1899", "2200", None):
            with self.assertRaises(ValueError):
                LdaClient.check_year(bad)

    def test_check_name(self):
        self.assertEqual(LdaClient.check_name("  Lockheed   Martin "), "Lockheed Martin")
        for bad in ("", "   ", None, "x" * 95):
            with self.assertRaises(ValueError):
                LdaClient.check_name(bad, "registrant")

    def test_check_filing_type(self):
        self.assertEqual(LdaClient.check_filing_type("first quarter"), "Q1")
        self.assertEqual(LdaClient.check_filing_type("q3"), "Q3")
        self.assertEqual(LdaClient.check_filing_type("registration"), "RR")
        self.assertIsNone(LdaClient.check_filing_type(None))
        with self.assertRaises(ValueError):
            LdaClient.check_filing_type("fifth quarter")

    def test_check_uuid_and_limit(self):
        self.assertEqual(LdaClient.check_uuid(LOCKHEED_UUID.upper()), LOCKHEED_UUID)
        for bad in ("nope", LOCKHEED_UUID[:-1], ""):
            with self.assertRaises(ValueError):
                LdaClient.check_uuid(bad)
        self.assertEqual(LdaClient.check_limit("20"), 20)
        for bad in ("0", "101", "lots"):
            with self.assertRaises(ValueError):
                LdaClient.check_limit(bad)


class ReaderTests(unittest.TestCase):
    def test_only_the_filters_lda_honours_are_sent(self):
        calls = []
        client = LdaClient(fetch=fetch_from([Q1, Q2], calls=calls))
        result = client.filings(year=2024, registrant="lockheed martin", limit=10)
        url, params = calls[0]
        self.assertIn("/v1/filings/", url)
        self.assertEqual(params["filing_year"], 2024)
        self.assertEqual(params["registrant_name"], "lockheed martin",
                         "LDA is sent the name as given, not title-cased")
        self.assertEqual(params["page_size"], 10)
        # The filters LDA accepts and then ignores are never sent.
        for ignored in ("issue", "issue_specific", "search", "name", "general_issue_code"):
            self.assertNotIn(ignored, params, ignored)
        self.assertEqual(result["filings"][0]["client_name"], "LOCKHEED MARTIN CORPORATION")

    def test_a_null_amount_is_not_zero(self):
        client = LdaClient(fetch=fetch_from([Q1, REGISTRATION]))
        result = client.filings(year=2024, limit=10)
        amounts = {row["filing_type"]: row["expenses"] for row in result["filings"]}
        self.assertEqual(amounts["Q1"], 3270000.0)
        self.assertIsNone(amounts["RR"], "a registration reports no amount, which is not zero")
        self.assertIn("no amount reported", client.money_label(result["filings"][1]))

    def test_a_filing_summarises_its_issues_and_lobbyists(self):
        client = LdaClient(fetch=fetch_from([Q1]))
        record = client.filing_detail(LOCKHEED_UUID)
        self.assertEqual(record["filing_uuid"], LOCKHEED_UUID)
        self.assertEqual(record["lobbyist_count"], 1)
        self.assertEqual(record["issue_codes"], ["Budget/Appropriations", "Defense"])
        self.assertEqual(record["activities"][0]["issue_code"], "BUD")
        self.assertEqual(record["activities"][0]["lobbyists"][0]["name"], "BRETT GARSON")
        self.assertEqual(record["activities"][0]["lobbyists"][0]["covered_position"],
                         "Scheduler, Rep. Example")

    def test_a_malformed_payload_is_an_upstream_error(self):
        from a2a_kit import UpstreamError

        client = LdaClient(fetch=lambda url, params, headers: {"count": 1})
        with self.assertRaises(UpstreamError):
            client.filings(year=2024)

    def test_money_label_reports_income_only_when_filed(self):
        client = LdaClient(fetch=_no_network)
        self.assertEqual(client.money_label({"expenses": 100.0, "filing_type": "Q1"}),
                         "expenses $100 (1st Quarter)")
        self.assertEqual(client.money_label({"expenses": 100.0, "income": 250.0, "filing_type": "Q2"}),
                         "expenses $100 and income $250 (2nd Quarter)")
        self.assertEqual(client.money_label({"expenses": None, "income": None, "filing_type": "RR"}),
                         "no amount reported")


class ParseTests(unittest.TestCase):
    def test_a_registrant_question_routes_to_client_filings(self):
        request = parse({"parts": [{"kind": "text", "text":
                                    "which lobbying filings did Lockheed Martin make in 2024?"}]})
        self.assertEqual(request["skill"], "client-filings")
        self.assertEqual(request["params"]["registrant"], "Lockheed Martin")
        self.assertEqual(request["params"]["year"], "2024")

    def test_a_uuid_routes_to_filing_detail(self):
        request = parse({"parts": [{"kind": "text", "text": f"show me filing {LOCKHEED_UUID}"}]})
        self.assertEqual(request["skill"], "filing-detail")
        self.assertEqual(request["params"]["uuid"], LOCKHEED_UUID)
        self.assertTrue(request["explicit"])

    def test_a_lobbyist_question_routes_to_lobbyist_filings(self):
        for text, who in (("which filings is the lobbyist Smith on in 2024?", "Smith"),
                          ("filings naming the lobbyist SMITH GARSON", "SMITH GARSON")):
            request = parse({"parts": [{"kind": "text", "text": text}]})
            self.assertEqual(request["skill"], "lobbyist-filings", text)
            self.assertEqual(request["params"]["lobbyist"], who, text)
            self.assertNotIn("registrant", request["params"], text)

    def test_an_issue_question_routes_to_client_issues(self):
        request = parse({"parts": [{"kind": "text", "text":
                                    "what issues did Lockheed Martin lobby on in 2024?"}]})
        self.assertEqual(request["skill"], "client-issues")
        self.assertEqual(request["params"]["registrant"], "Lockheed Martin")


    def test_a_single_capitalised_word_is_a_name(self):
        self.assertEqual(name_from_text("total the expenses on Google filings in 2023", None), "Google")
        self.assertIsNone(name_from_text("which filings is the lobbyist on in 2024", None),
                          "a lone lowercase word is not a name")
        self.assertIsNone(name_from_text("anything", "Lockheed Martin"))

    def test_a_quarter_is_a_filter_not_part_of_the_name(self):
        request = parse({"parts": [{"kind": "text", "text":
                                    "Lockheed Martin filings 2023, first quarter only"}]})
        self.assertEqual(request["params"]["registrant"], "Lockheed Martin")
        self.assertEqual(request["params"]["filing_type"], "first quarter")

    def test_help_and_empty(self):
        self.assertEqual(parse({"parts": [{"kind": "text", "text": ""}]})["skill"], "help")
        self.assertEqual(parse({"parts": [{"kind": "text", "text": "what can you do?"}]})["skill"], "help")

    def test_an_explicit_skill_id_is_honoured(self):
        request = parse({"parts": [{"kind": "data", "data": {
            "skill": "client-filings", "registrant": "lockheed martin", "year": 2023, "limit": 5}}]})
        self.assertEqual(request["skill"], "client-filings")
        self.assertEqual(request["params"]["limit"], 5)
        self.assertTrue(request["explicit"])


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, client=None, **params):
        agent = LobbyingAgent(client=client or FakeLda())
        request = {"skill": skill, "params": params, "missing": agent.missing(skill, params)}
        return agent.run(request)

    def test_client_filings_lists_the_filings(self):
        result = self.run_skill("client-filings", registrant="Lockheed Martin", year=2024, limit=20)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("1st Quarter", result["message"])
        self.assertIn("expenses $3,270,000", result["message"])
        self.assertIn("2024-04-22", result["message"])
        self.assertIn("Lockheed Martin", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertIn("registrant is the lobbying firm", result["message"])
        self.assertEqual(result["artifact"]["filters"]["filing_year"], 2024)

    def test_client_filings_says_when_a_registration_reports_nothing(self):
        result = self.run_skill("client-filings", registrant="Lockheed Martin", year=2024, limit=20)
        self.assertIn("no amount reported", result["message"])

    def test_client_filings_with_no_hits_says_so(self):
        result = self.run_skill("client-filings", client=FakeLda(filings=()),
                                registrant="Atlantis Corp", year=2024)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("LDA holds no filing", result["message"])
        self.assertIn("1993", result["message"])

    def test_client_filings_can_be_narrowed_to_a_quarter(self):
        client = FakeLda()
        result = self.run_skill("client-filings", client=client, registrant="Lockheed Martin",
                                year=2024, filing_type="Q2", limit=20)
        self.assertIn("2nd Quarter", result["message"])
        self.assertNotIn("1st Quarter", result["message"])
        self.assertEqual(client.reads[-1][5], "Q2")

    def test_filing_detail_reports_issues_and_lobbyists(self):
        result = self.run_skill("filing-detail", uuid=LOCKHEED_UUID)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("LOCKHEED MARTIN CORPORATION", result["message"])
        self.assertIn("expenses $3,270,000", result["message"])
        self.assertIn("[BUD] Budget/Appropriations", result["message"])
        self.assertIn("BRETT GARSON", result["message"])
        self.assertIn("Scheduler, Rep. Example", result["message"])
        self.assertIn("issue filters are accepted and then ignored", result["message"])
        self.assertEqual(len(result["artifact"]["filing"]["activities"]), 2)

    def test_filing_detail_for_an_unknown_uuid_says_so(self):
        result = self.run_skill("filing-detail", uuid="00000000-0000-4000-8000-000000000000")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("LDA holds no filing under uuid", result["message"])
        self.assertIsNone(result["artifact"]["filing"])

    def test_lobbyist_filings_names_the_registrants(self):
        result = self.run_skill("lobbyist-filings", lobbyist="BRETT GARSON", year=2024, limit=20)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("registrant(s) on this page", result["message"])
        self.assertIn("LOCKHEED MARTIN CORPORATION", result["message"])
        self.assertIn("LDA's own lobbyist endpoint ignores every filter", result["message"])

    def test_lobbyist_filings_with_no_hits_says_so(self):
        result = self.run_skill("lobbyist-filings", client=FakeLda(filings=()),
                                lobbyist="NOBODY HERE", year=2024)
        self.assertIn("No filing in LDA names a lobbyist", result["message"])

    def test_client_issues_ranks_the_issue_areas(self):
        result = self.run_skill("client-issues", registrant="Lockheed Martin", year=2024, limit=20)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Defense — 2 of", result["message"])
        self.assertIn("Budget/Appropriations", result["message"])
        self.assertIn("4 issue area(s)", result["message"])
        self.assertIn("accepts an issue filter and then ignores it", result["message"])

    def test_every_skill_needs_its_own_parameter(self):
        agent = LobbyingAgent(client=FakeLda())
        self.assertEqual(agent.missing("client-filings", {}), ["registrant"])
        self.assertEqual(agent.missing("filing-detail", {}), ["uuid"])
        self.assertEqual(agent.missing("lobbyist-filings", {}), ["lobbyist"])
        self.assertEqual(agent.missing("client-issues", {}), ["registrant"])
        self.assertEqual(agent.missing("client-spend", {}), ["registrant"])
        self.assertEqual(agent.missing("client-spend", {"registrant": "Boeing"}), [])
        for skill, missing in (("client-filings", ["registrant"]), ("filing-detail", ["uuid"]),
                               ("lobbyist-filings", ["lobbyist"]), ("client-spend", ["registrant"])):
            result = agent.run({"skill": skill, "params": {}, "missing": missing})
            self.assertEqual(result["final_state"], "input-required", skill)
            self.assertIsNone(result["artifact"], skill)
        self.assertIn("Lockheed Martin", agent.input_prompt("client-spend", ["registrant"]))
        self.assertIn("uuid", agent.input_prompt("filing-detail", ["uuid"]))
        self.assertIn("SMITH GARSON", agent.input_prompt("lobbyist-filings", ["lobbyist"]))

    def test_a_bad_argument_is_a_question_not_a_crash(self):
        client = LdaClient(fetch=fetch_from([Q1]))
        result = self.run_skill("client-filings", client=client, registrant="Lockheed", year="24")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("filing year must be four digits", result["message"])
        result = self.run_skill("filing-detail", client=client, uuid="nope")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("filing id is its uuid", result["message"])

    def test_help_does_not_touch_the_feed(self):
        result = self.run_skill("help")
        self.assertIn("lobbying disclosure", result["message"])
        self.assertIn("never count it as zero", result["message"])
        self.assertIsNone(result["artifact"])


    def test_agent_metadata(self):
        agent = LobbyingAgent(client=FakeLda())
        self.assertEqual(agent.env_prefix, "LOBBYING")
        self.assertEqual(agent.datasets, (DATASET, CLIENTS_DATASET))
        self.assertEqual(agent.watch_kinds, ())


#: Shape copied from a live gateway `lobbying_client_spend` answer for Lockheed Martin.
SPEND_PAYLOAD = {
    "registrant": "LOCKHEED MARTIN CORPORATION",
    "filingYear": 2024,
    "total": 5,
    "filingsRead": 5,
    "filingsWithAmount": 4,
    "filingsWithoutAmount": 1,
    "totalExpenses": 12390000.0,
    "totalIncome": None,
    "byQuarter": [
        {"label": "1st Quarter (Jan 1 - Mar 31)", "expenses": 3270000.0, "income": 0, "filings": 1},
        {"label": "2nd Quarter (Apr 1 - June 30)", "expenses": 3100000.0, "income": 0, "filings": 1},
    ],
    "largestFiling": {
        "uuid": LOCKHEED_UUID, "expenses": 3270000.0,
        "label": "1st Quarter (Jan 1 - Mar 31)", "filedType": "Q1",
        "posted": "2024-04-22T16:30:44-04:00",
    },
    "expenseMethods": ["C"],
    "note": "Only what the filings reported is summed.",
}

TOOL_ERROR_TEXT = "`lobbying_client_spend` failed: upstream returned HTTP 500"


def _message(text, **extra):
    payload = {"kind": "message", "role": "user", "messageId": "test-message",
               "parts": [{"kind": "text", "text": text}]}
    payload.update(extra)
    return payload




class SpendSkillTests(unittest.TestCase):
    """The premium skill: parsing stays local, the total comes from the gateway."""

    def run_spend(self, gateway, client=None, **params):
        payload = {"registrant": "Lockheed Martin", "filing_year": 2024, **params}
        return LobbyingAgent(client or FakeLda(), gateway=gateway).run(
            {"skill": SKILL_CLIENT_SPEND, "params": payload, "missing": []})


    def test_the_free_skills_keep_their_own_questions(self):
        for text, skill in (("which lobbying filings did Lockheed Martin make in 2024?",
                             "client-filings"),
                            (f"show me filing {LOCKHEED_UUID}", "filing-detail"),
                            ("which filings is the lobbyist Smith on in 2024?", "lobbyist-filings"),
                            ("what issues did Lockheed Martin lobby on in 2024?", "client-issues")):
            self.assertEqual(parse(_message(text))["skill"], skill, text)

    def test_an_explicit_skill_id_is_honoured(self):
        parsed = parse(_message("anything at all", parts=[
            {"kind": "data", "data": {"skill": SKILL_CLIENT_SPEND, "registrant": "boeing",
                                      "filing_year": 2023}}]))
        self.assertEqual(parsed["skill"], SKILL_CLIENT_SPEND)
        self.assertEqual(parsed["params"]["registrant"], "boeing")










if __name__ == "__main__":
    unittest.main()
