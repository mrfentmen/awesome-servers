"""Tests for the CourtListener case-law server.

    python3 servers/courts/tests/test_agent.py
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
    SKILL_CITATION_CENSUS,
    CourtListenerAgent,
    court_from_text,
    parse,
    query_from_text,
)
from data import (  # noqa: E402
    COURTS_DATASET,
    DATASET,
    CourtListenerClient,
)

EPIC = {
    "cluster_id": 5301494,
    "caseName": "Electronic Privacy Information Center v. DOJ",
    "dateFiled": "2021-11-30",
    "court_id": "cadc",
    "court": "Court of Appeals for the D.C. Circuit",
    "court_citation_string": "D.C. Cir.",
    "docketNumber": "20-5364",
    "citation": ["18 F.4th 712"],
    "neutralCite": "",
    "citeCount": 19,
    "status": "Published",
    "absolute_url": "/opinion/5301494/electronic-privacy-information-center-v-doj/",
}
SCOTUS = {
    "cluster_id": 111,
    "caseName": "Roe v. Wade",
    "dateFiled": "1973-01-22",
    "court_id": "scotus",
    "court": "Supreme Court",
    "court_citation_string": "SCOTUS",
    "docketNumber": "No. 70-18",
    "citation": ["410 U.S. 113"],
    "neutralCite": "123 U.S. 1",
    "citeCount": 4211,
    "status": "Published",
    "absolute_url": "/opinion/111/roe-v-wade/",
}
DOCKET = {
    "docket_id": 4493161,
    "caseName": "In re: Electronic Privacy Information",
    "docketNumber": "12-1307",
    "court_id": "cadc",
    "court": "Court of Appeals for the D.C. Circuit",
    "court_citation_string": "D.C. Cir.",
    "dateFiled": "2012-07-17",
    "dateArgued": "2012-09-14",
    "dateTerminated": "2012-09-25",
    "docket_absolute_url": "/docket/4493161/in-re-electronic-privacy-information/",
}
JUDGE = {
    "id": 4719,
    "name": "Ruth Bader Ginsburg",
    "gender": "Female",
    "dob": "1930-12-26",
    "positions": [{"court": "Supreme Court of the United States"}],
    "school": ["Harvard University", "Columbia Law School"],
    "aba_rating": ["Well Recommended"],
    "political_affiliation": ["Democratic Party"],
    "absolute_url": "/person/4719/ruth-abrams/",
}
CADC = {
    "id": "cadc",
    "short_name": "D.C. Circuit",
    "full_name": "Court of Appeals for the D.C. Circuit",
    "citation_string": "D.C. Cir.",
    "jurisdiction": "F",
    "position": 30.0,
    "start_date": "1893-03-03",
    "end_date": None,
    "parent_court": "scotus",
    "url": "https://www.cadc.uscourts.gov/",
    "in_use": True,
}
SCOTUS_COURT = {
    "id": "scotus",
    "short_name": "Supreme Court",
    "full_name": "Supreme Court of the United States",
    "citation_string": "SCOTUS",
    "jurisdiction": "F",
    "position": 1.0,
    "start_date": "1789-09-24",
    "end_date": None,
    "parent_court": None,
    "url": "http://supremecourt.gov/",
    "in_use": True,
}


def _no_network(*args, **kwargs):
    raise AssertionError("FakeCourts must not touch the network")


class FakeCourts(CourtListenerClient):
    """Same interface as CourtListenerClient, no network. Derived helpers stay real."""

    def __init__(self, opinions=(EPIC,), dockets=(DOCKET,), people=(JUDGE,),
                 courts=(SCOTUS_COURT, CADC)) -> None:
        super().__init__(fetch=_no_network)
        self.opinion_rows = list(opinions)
        self.docket_rows = list(dockets)
        self.person_rows = list(people)
        self.court_rows = list(courts)
        self.reads = []

    def opinions(self, query, court=None, filed_after=None, filed_before=None, limit=10):
        self.reads.append(("opinions", query, court, filed_after, limit))
        return {"query": query, "kind": "opinion", "court": court, "order_by": "score desc",
                "total_hits": len(self.opinion_rows), "page_size": len(self.opinion_rows),
                "opinions": [dict(row) for row in self.opinion_rows[:limit]]}

    def dockets(self, query, court=None, filed_after=None, filed_before=None, limit=10):
        self.reads.append(("dockets", query, court, filed_after, limit))
        return {"query": query, "kind": "docket", "court": court,
                "total_hits": len(self.docket_rows), "page_size": len(self.docket_rows),
                "dockets": [dict(row) for row in self.docket_rows[:limit]]}

    def people(self, query, limit=10):
        self.reads.append(("people", query, limit))
        return {"query": query, "kind": "person", "total_hits": len(self.person_rows),
                "page_size": len(self.person_rows),
                "people": [dict(row) for row in self.person_rows[:limit]]}

    def court_list(self):
        self.reads.append(("court_list",))
        return [dict(row) for row in self.court_rows]


def search_from(payloads, calls=None):
    """A JsonApiClient `fetch` that answers on the search path, so data.py runs for real."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        if url.endswith("/courts/"):
            return {"count": len(payloads["courts"]), "results": payloads["courts"]}
        if url.endswith("/search/"):
            key = payloads["kind"]
            return {"count": payloads["count"], "results": payloads[key]}
        raise AssertionError(f"unexpected url {url}")

    return fetch


class ValidationTests(unittest.TestCase):
    def test_check_query(self):
        self.assertEqual(CourtListenerClient.check_query("  fourth   amendment "), "fourth amendment")
        for bad in ("", "   ", None, "x" * 201):
            with self.assertRaises(ValueError):
                CourtListenerClient.check_query(bad)

    def test_check_court(self):
        self.assertEqual(CourtListenerClient.check_court("SCOTUS"), "scotus")
        self.assertIsNone(CourtListenerClient.check_court(None))
        self.assertIsNone(CourtListenerClient.check_court(""))
        with self.assertRaises(ValueError):
            CourtListenerClient.check_court("dccircuit")

    def test_check_date_and_limit(self):
        self.assertEqual(CourtListenerClient.check_date("2020-01-01", "filed_after"), "2020-01-01")
        self.assertIsNone(CourtListenerClient.check_date(None, "filed_after"))
        with self.assertRaises(ValueError):
            CourtListenerClient.check_date("01/01/2020", "filed_after")
        self.assertEqual(CourtListenerClient.check_limit("5"), 5)
        for bad in ("0", "21", "many"):
            with self.assertRaises(ValueError):
                CourtListenerClient.check_limit(bad)


class ReaderTests(unittest.TestCase):
    def test_opinions_send_the_expected_query(self):
        calls = []
        client = CourtListenerClient(fetch=search_from(
            {"opinions": [EPIC], "count": 117150, "kind": "opinions"}, calls))
        result = client.opinions("fourth amendment", court="cadc", filed_after="2020-01-01", limit=5)
        url, params = calls[0]
        self.assertTrue(url.endswith("/search/"))
        self.assertEqual(params["q"], "fourth amendment")
        self.assertEqual(params["type"], "o")
        self.assertEqual(params["court"], "cadc")
        self.assertEqual(params["filed_after"], "2020-01-01")
        self.assertNotIn("filed_before", params)
        self.assertEqual(result["total_hits"], 117150)
        self.assertEqual(result["opinions"][0]["caseName"], EPIC["caseName"])
        self.assertEqual(result["opinions"][0]["dataset"], DATASET)

    def test_dockets_and_people_pick_their_type(self):
        client = CourtListenerClient(fetch=search_from(
            {"dockets": [DOCKET], "count": 1, "kind": "dockets"}))
        self.assertEqual(client.dockets("20-5364")["dockets"][0]["docketNumber"], "12-1307")
        calls = []
        client = CourtListenerClient(fetch=search_from(
            {"people": [JUDGE], "count": 1, "kind": "people"}, calls))
        self.assertEqual(client.people("ginsburg")["people"][0]["name"], "Ruth Bader Ginsburg")
        self.assertEqual(calls[0][1]["type"], "p")

    def test_a_malformed_search_payload_is_an_upstream_error(self):
        from a2a_kit import UpstreamError

        client = CourtListenerClient(fetch=lambda url, params, headers: {"count": 1})
        with self.assertRaises(UpstreamError):
            client.opinions("privacy")

    def test_court_search_filters_locally_and_sorts(self):
        client = CourtListenerClient(fetch=search_from(
            {"courts": [SCOTUS_COURT, CADC], "count": 2, "kind": "opinions"}))
        # Both rows match "court", and the sort puts the court CourtListener lists first.
        self.assertEqual([court["id"] for court in client.find_courts(needle="court")],
                         ["scotus", "cadc"])
        self.assertEqual([court["id"] for court in client.find_courts(needle="circuit")], ["cadc"])
        self.assertEqual(client.find_courts(needle="d.c.")[0]["id"], "cadc")
        self.assertEqual(client.court_label(CADC), CADC["full_name"])
        self.assertEqual(client.court_label(None), "not reported")


class ParseTests(unittest.TestCase):
    def test_an_opinion_question_is_the_default(self):
        request = parse({"parts": [{"kind": "text", "text": "what case law is there on the fourth amendment?"}]})
        self.assertEqual(request["skill"], "opinion-search")
        self.assertEqual(request["params"]["query"], "fourth amendment")

    def test_a_docket_number_routes_to_case_lookup(self):
        request = parse({"parts": [{"kind": "text", "text": "look up docket 20-5364 in the D.C. Circuit"}]})
        self.assertEqual(request["skill"], "case-lookup")
        self.assertEqual(request["params"]["query"], "20-5364")
        self.assertEqual(request["params"]["court"], "cadc")
        self.assertTrue(request["explicit"])

    def test_a_judge_question_routes_to_judge_lookup(self):
        request = parse({"parts": [{"kind": "text", "text": "look up the judge Ruth Bader Ginsburg"}]})
        self.assertEqual(request["skill"], "judge-lookup")
        self.assertEqual(request["params"]["query"], "Ruth Bader Ginsburg")

    def test_a_court_question_routes_to_court_info(self):
        for text, code in (("what court is cadc?", "cadc"),
                           ("list the courts in the 9th circuit", "ca9"),
                           ("list the courts in the first circuit of appeals", "cb1")):
            request = parse({"parts": [{"kind": "text", "text": text}]})
            self.assertEqual(request["skill"], "court-info", text)
            self.assertEqual(request["params"]["court"], code, text)
            self.assertNotIn("query", request["params"], "a court question carries no search term")

    def test_a_date_range_does_not_read_as_a_docket_number(self):
        request = parse({"parts": [{"kind": "text", "text":
                                    "privacy opinions in the D.C. Circuit filed after 2020-01-01"}]})
        self.assertEqual(request["skill"], "opinion-search")
        self.assertEqual(request["params"]["filed_after"], "2020-01-01")
        self.assertEqual(request["params"]["query"], "privacy")

    def test_a_quoted_phrase_is_the_query(self):
        request = parse({"parts": [{"kind": "text", "text": 'opinions about "right to privacy" please'}]})
        self.assertEqual(request["params"]["query"], "right to privacy")

    def test_court_names_resolve_from_code_or_name(self):
        self.assertEqual(court_from_text("in the D.C. Circuit"), "cadc")
        self.assertEqual(court_from_text("the 4th circuit"), "ca4")
        self.assertEqual(court_from_text("the Supreme Court"), "scotus")
        self.assertIsNone(court_from_text("privacy opinions"))

    def test_query_extraction_caps_and_drops_scaffolding(self):
        self.assertIsNone(query_from_text("what is the law", "copyright"))
        self.assertEqual(query_from_text("show me antitrust law", None), "antitrust")

    def test_help_and_empty(self):
        self.assertEqual(parse({"parts": [{"kind": "text", "text": ""}]})["skill"], "help")
        self.assertEqual(parse({"parts": [{"kind": "text", "text": "what can you do?"}]})["skill"], "help")

    def test_an_explicit_skill_id_is_honoured(self):
        request = parse({"parts": [{"kind": "data", "data": {
            "skill": "opinion-search", "query": "standing", "court": "scotus", "limit": 3}}]})
        self.assertEqual(request["skill"], "opinion-search")
        self.assertEqual(request["params"]["limit"], 3)
        self.assertTrue(request["explicit"])


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, client=None, **params):
        agent = CourtListenerAgent(client=client or FakeCourts())
        request = {"skill": skill, "params": params, "missing": agent.missing(skill, params)}
        return agent.run(request)

    def test_opinion_search_returns_shaped_rows(self):
        result = self.run_skill("opinion-search", query="fourth amendment", limit=5)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Electronic Privacy Information Center v. DOJ", result["message"])
        self.assertIn("18 F.4th 712", result["message"])
        self.assertIn("cited 19 time(s)", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertIn("Relevance order, not citation count", result["message"])
        artifact = result["artifact"]
        self.assertEqual(artifact["dataset"], DATASET)
        self.assertEqual(artifact["opinions"][0]["court_id"], "cadc")

    def test_opinion_search_with_no_hits_says_so(self):
        result = self.run_skill("opinion-search", client=FakeCourts(opinions=()), query="zzzz")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("No opinion in CourtListener's index matches", result["message"])
        self.assertEqual(result["artifact"]["opinions"], [])

    def test_case_lookup_returns_the_docket(self):
        result = self.run_skill("case-lookup", query="20-5364", court="cadc")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("12-1307", result["message"])
        self.assertIn("terminated 2012-09-25", result["message"])
        self.assertIn("RECAP covers PACER-filed federal cases only", result["message"])
        self.assertEqual(result["artifact"]["dockets"][0]["docket_id"], 4493161)

    def test_case_lookup_with_no_hits_says_so(self):
        result = self.run_skill("case-lookup", client=FakeCourts(dockets=()), query="99-9999")
        self.assertIn("No RECAP docket", result["message"])

    def test_court_info_returns_metadata(self):
        result = self.run_skill("court-info", court="cadc")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Court of Appeals for the D.C. Circuit", result["message"])
        self.assertIn("appeals to scotus", result["message"])
        self.assertEqual(result["artifact"]["dataset"], COURTS_DATASET)

    def test_court_info_with_no_match_says_so(self):
        result = self.run_skill("court-info", client=FakeCourts(courts=()), court="cadc")
        self.assertIn("No CourtListener court matches", result["message"])
        self.assertIn("scotus", result["message"])

    def test_judge_lookup_returns_positions(self):
        result = self.run_skill("judge-lookup", query="Ginsburg")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Ruth Bader Ginsburg", result["message"])
        self.assertIn("sat on Supreme Court of the United States", result["message"])
        self.assertIn("Harvard University", result["message"])

    def test_every_skill_needs_a_query_except_court_info(self):
        agent = CourtListenerAgent(client=FakeCourts())
        self.assertEqual(agent.missing("opinion-search", {}), ["query"])
        self.assertEqual(agent.missing("judge-lookup", {}), ["query"])
        self.assertEqual(agent.missing("citation-census", {}), ["query"])
        self.assertEqual(agent.missing("court-info", {}), ["court"])
        self.assertEqual(agent.missing("court-info", {"court": "cadc"}), [])
        result = agent.run({"skill": "opinion-search", "params": {}, "missing": ["query"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("fourth amendment", result["message"])
        self.assertIn("CourtListener code", agent.input_prompt("court-info", ["court"]))
        self.assertIn("Which judge", agent.input_prompt("judge-lookup", ["query"]))

    def test_a_bad_argument_is_a_question_not_a_crash(self):
        # The real client, so data.py's validation is what refuses.
        client = CourtListenerClient(fetch=search_from({"opinions": [EPIC], "count": 1,
                                                        "kind": "opinions"}))
        result = self.run_skill("opinion-search", client=client, query="privacy", court="not-a-court")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("court must be one of", result["message"])
        result = self.run_skill("opinion-search", client=client, query="privacy", filed_after="01/2020")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("filed_after must look like YYYY-MM-DD", result["message"])

    def test_help_does_not_touch_the_feed(self):
        result = self.run_skill("help")
        self.assertIn("CourtListener", result["message"])
        self.assertIsNone(result["artifact"])

    def test_card_lists_four_free_skills_and_one_premium(self):
        ids = [skill["id"] for skill in CARD_SKILLS]
        self.assertEqual(ids, ["opinion-search", "case-lookup", "court-info", "judge-lookup",
                               "citation-census"])
        premium = [skill for skill in CARD_SKILLS if "premium" in skill["tags"]]
        self.assertEqual([skill["id"] for skill in premium], ["citation-census"])
        for skill in CARD_SKILLS[:-1]:
            self.assertNotIn("premium", skill["tags"], skill["id"])

    def test_agent_metadata(self):
        agent = CourtListenerAgent(client=FakeCourts())
        self.assertEqual(agent.env_prefix, "COURTS")
        self.assertEqual(agent.datasets, (DATASET, COURTS_DATASET))
        self.assertEqual(agent.watch_kinds, ())


#: Shape copied from a live gateway `courts_citation_census` answer for "privacy".
CENSUS_PAYLOAD = {
    "query": "privacy",
    "court": "cadc",
    "filedAfter": "2020-01-01",
    "filedBefore": None,
    "opinionsRead": 3,
    "pageSize": 20,
    "totalHits": 117150,
    "authorities": [
        {"caseName": "Roe v. Wade", "dateFiled": "1973-01-22", "court": "Supreme Court",
         "courtId": "scotus", "docketNumber": "No. 70-18", "citation": ["410 U.S. 113"],
         "neutralCite": "123 U.S. 1", "citeCount": 4211, "status": "Published",
         "absoluteUrl": "/opinion/111/roe-v-wade/"},
        {"caseName": "Electronic Privacy Information Center v. DOJ", "dateFiled": "2021-11-30",
         "court": "Court of Appeals for the D.C. Circuit", "courtId": "cadc",
         "docketNumber": "20-5364", "citation": ["18 F.4th 712"], "neutralCite": None,
         "citeCount": 19, "status": "Published", "absoluteUrl": "/opinion/5301494/"},
    ],
    "reporters": [{"name": "18 F.4th 712", "count": 2}, {"name": "410 U.S. 113", "count": 1}],
    "courts": [{"name": "Court of Appeals for the D.C. Circuit", "count": 2},
               {"name": "Supreme Court", "count": 1}],
    "years": [{"name": "2021", "count": 2}, {"name": "1973", "count": 1}],
    "totalCiteCount": 4230,
    "note": "One page of results, not the whole index.",
}

DENIED_TEXT = ("`courts_citation_census` is a premium tool, but that license key is not valid. "
               "Get a key at https://buy.polar.sh/polar_cl_example")
TOOL_ERROR_TEXT = "`courts_citation_census` failed: upstream returned HTTP 500"


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


class CensusSkillTests(unittest.TestCase):
    """The premium skill: parsing stays local, the tally comes from the gateway."""

    def run_census(self, gateway, client=None, **params):
        payload = {"query": "privacy", "limit": 20, **params}
        return CourtListenerAgent(client or FakeCourts(), gateway=gateway).run(
            {"skill": SKILL_CITATION_CENSUS, "params": payload, "missing": []})

    def test_the_census_question_routes_to_the_premium_skill(self):
        for text in ("which authorities does the privacy case law lean on?",
                     "run a citation census on fourth amendment search results",
                     "the most-cited antitrust decisions",
                     "citation map for standing"):
            parsed = parse(_message(text))
            self.assertEqual(parsed["skill"], SKILL_CITATION_CENSUS, text)
            self.assertTrue(parsed["explicit"], text)

    def test_the_free_skills_keep_their_own_questions(self):
        for text, skill in (("what case law is there on the fourth amendment?", "opinion-search"),
                            ("look up docket 20-5364 in the D.C. Circuit", "case-lookup"),
                            ("what court is cadc?", "court-info"),
                            ("look up the judge Ruth Bader Ginsburg", "judge-lookup")):
            self.assertEqual(parse(_message(text))["skill"], skill, text)

    def test_an_explicit_skill_id_is_honoured(self):
        parsed = parse(_message("anything at all", parts=[
            {"kind": "data", "data": {"skill": SKILL_CITATION_CENSUS, "query": "copyright",
                                      "court": "ca9", "limit": 20}}]))
        self.assertEqual(parsed["skill"], SKILL_CITATION_CENSUS)
        self.assertEqual(parsed["params"]["query"], "copyright")
        self.assertEqual(parsed["params"]["court"], "ca9")

    def test_the_message_reports_the_gateways_census(self):
        gateway, calls = fake_gateway(CENSUS_PAYLOAD)
        result = self.run_census(gateway, query="privacy", court="cadc", filed_after="2020-01-01")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("3 opinion(s)", result["message"])
        self.assertIn("Roe v. Wade", result["message"])
        self.assertIn("cited 4211 time(s)", result["message"])
        self.assertIn("Reporter citations seen: 18 F.4th 712 (2)", result["message"])
        self.assertIn("Inbound citations across the page: 4230", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertTrue(result["artifact"]["premium"])
        self.assertEqual(result["artifact"]["total_cite_count"], 4230)

        # CourtListener was read behind the gate, not here.
        self.assertEqual(len(calls), 1)
        sent = calls[0]["payload"]["params"]
        self.assertEqual(sent["name"], "courts_citation_census")
        self.assertEqual(sent["arguments"]["query"], "privacy")
        self.assertEqual(sent["arguments"]["court"], "cadc")
        self.assertEqual(sent["arguments"]["filed_after"], "2020-01-01")
        self.assertNotIn("filed_before", sent["arguments"], "no bound asked for, so none is sent")

    def test_without_a_licence_the_caller_is_told_how_to_get_one(self):
        gateway, calls = fake_gateway(key="")
        result = self.run_census(gateway, query="privacy")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("MCP_LICENSE_KEY", result["message"])
        self.assertEqual(result["artifact"]["reason"], "missing_key")
        self.assertNotIn("authorities", result["artifact"])
        self.assertEqual(calls, [], "a keyless caller must not reach the gateway")

    def test_a_licence_refusal_keeps_the_gateways_wording(self):
        gateway, _ = fake_gateway()  # nothing but a refusal
        result = self.run_census(gateway, query="privacy")
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["message"], DENIED_TEXT)
        self.assertEqual(result["artifact"]["reason"], "denied")

    def test_a_dead_gateway_fails_instead_of_inventing_a_census(self):
        gateway, _ = fake_gateway(error=OSError("connection refused"))
        result = self.run_census(gateway, query="privacy")
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("could not be reached", result["message"])
        self.assertIsNone(result["artifact"].get("authorities"))

    def test_a_tool_error_is_not_sold_as_a_licence_problem(self):
        gateway, _ = fake_gateway(tool_error=TOOL_ERROR_TEXT)
        result = self.run_census(gateway, query="privacy")
        self.assertEqual(result["final_state"], "failed")
        self.assertNotIn("MCP_LICENSE_KEY", result["message"])
        self.assertIn("HTTP 500", result["message"])

    def test_a_bad_argument_never_reaches_the_gateway(self):
        gateway, calls = fake_gateway(CENSUS_PAYLOAD)
        result = self.run_census(gateway, query="privacy", limit=99)
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("limit must be between", result["message"])
        self.assertEqual(calls, [])

    def test_a_census_over_no_opinions_reports_cleanly(self):
        payload = {**CENSUS_PAYLOAD, "opinionsRead": 0, "authorities": [], "reporters": [],
                   "courts": [], "years": [], "totalCiteCount": 0}
        gateway, _ = fake_gateway(payload)
        result = self.run_census(gateway, query="zzzz")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("CourtListener reports no citations", result["message"])


if __name__ == "__main__":
    unittest.main()
