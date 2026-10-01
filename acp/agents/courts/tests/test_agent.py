"""Tests for the courts agent: opinion search, case lookup, counts, the court directory,
routing, and the one premium skill.

    python3 agents/courts/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(`q=privacy&type=o` -> count 117150, first hit Electronic Privacy Information Center v.
DOJ, 18 F.4th 712, D.C. Cir., filed 2021-11-30, docket 20-5364; `caseName:"Brown v. Board
of Education"` -> 347 U.S. 483, SCOTUS, 1954-05-17, cited 3825 times; the directory has
3359 courts and the Ninth Circuit is `ca9`).
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
from data import (CourtsData, CourtsError, CourtsNotFound,  # noqa: E402
                  case_name_from_text, court_name_from_text, topic_from_text,
                  years_from_text)

SEARCH = {"count": 117150, "next": "https://www.courtlistener.com/api/rest/v4/search/?page=2",
          "previous": None, "results": [
    {"absolute_url": "/opinion/5301494/electronic-privacy-information-center-v-doj/",
     "caseName": "Electronic Privacy Information Center v. DOJ",
     "citation": ["18 F.4th 712"], "citeCount": 41, "court": "Court of Appeals for the D.C. Circuit",
     "court_citation_string": "D.C. Cir.", "court_id": "cadc", "court_jurisdiction": "D.C.",
     "dateFiled": "2021-11-30", "docketNumber": "20-5364", "judge": "Henderson",
     "status": "Published", "opinions": [{"id": 1}]},
    {"absolute_url": "/opinion/2/parents-for-privacy-v-barr/",
     "caseName": "Parents for Privacy v. William Barr", "citation": [], "citeCount": 90,
     "court": "Court of Appeals for the Ninth Circuit", "court_citation_string": "9th Cir.",
     "court_id": "ca9", "court_jurisdiction": "9th Cir.", "dateFiled": "2020-02-12",
     "docketNumber": "19-7422", "judge": "", "status": "Published", "opinions": [{"id": 2}]},
]}

CASE = {"count": 62, "next": None, "previous": None, "results": [
    {"absolute_url": "/opinion/1/brown-v-board-of-education/",
     "caseName": "Brown v. Board of Education",
     "citation": ["347 U.S. 483", "74 S. Ct. 686"], "citeCount": 3825,
     "court": "Supreme Court of the United States", "court_citation_string": "SCOTUS",
     "court_id": "scotus", "court_jurisdiction": "Federal", "dateFiled": "1954-05-17",
     "docketNumber": None, "judge": "Warren", "status": "Published", "opinions": [{"id": 3}]},
]}

COURTS = {"count": 3359, "next": None, "previous": None, "results": [
    {"id": "ca9", "short_name": "Ninth Circuit", "full_name": "United States Court of Appeals "
     "for the Ninth Circuit", "citation_string": "9th Cir.", "jurisdiction": "9th Cir.",
     "in_use": True, "url": "https://www.courtlistener.com/api/rest/v4/courts/ca9/"},
    {"id": "scotus", "short_name": "Supreme Court", "full_name": "Supreme Court of the "
     "United States", "citation_string": "SCOTUS", "jurisdiction": "Federal", "in_use": True,
     "url": "https://www.courtlistener.com/api/rest/v4/courts/scotus/"},
]}


class FakeFeeds:
    def __init__(self, search=None, case=None, courts=None, empty=False, fail=False):
        self.calls: list[str] = []
        self.params: list[dict] = []
        self.search = SEARCH if search is None else search
        self.case = CASE if case is None else case
        self.courts = COURTS if courts is None else courts
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str, params: dict):
        self.calls.append(url)
        self.params.append(dict(params or {}))
        if self.fail:
            raise CourtsError("CourtListener is unreachable")
        if self.empty:
            return json.dumps({"count": 0, "results": []})
        if "courts/" in url:
            return json.dumps(self.courts)
        if "caseName:" in str(params.get("q")):
            return json.dumps(self.case)
        return json.dumps(self.search)


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return CourtsData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_topic_is_not_the_whole_question(self):
        self.assertEqual(topic_from_text("find court opinions about privacy"), "privacy")
        self.assertEqual(topic_from_text("how many opinions mention fourth amendment?"),
                         "fourth amendment")
        self.assertEqual(topic_from_text('opinions on "privacy" in 2020'), "privacy")
        self.assertIsNone(topic_from_text("what can you do?"))

    def test_a_court_name_out_of_a_question(self):
        self.assertEqual(court_name_from_text("opinions on privacy in the Ninth Circuit"),
                         "the Ninth Circuit")
        #: `in` is lowercase, so it cannot start the court name: the name is not "in the ...".
        self.assertNotIn("in the", court_name_from_text("opinions in the Ninth Circuit"))
        self.assertEqual(court_name_from_text("what is the citation string for the D.C. Circuit?"),
                         "the D.C. Circuit")
        self.assertIsNone(court_name_from_text("find opinions about privacy"))

    def test_a_case_name(self):
        self.assertEqual(case_name_from_text("which court decided Brown v. Board of Education?"),
                         "Brown v. Board of Education")
        self.assertEqual(case_name_from_text("how many times has Brown v. Board been cited?"),
                         "Brown v. Board")
        self.assertIsNone(case_name_from_text("find opinions about privacy"))

    def test_a_year_window(self):
        self.assertEqual(years_from_text("court opinions on employment law in 2020"),
                         ("2020-01-01", "2020-12-31"))
        self.assertEqual(years_from_text("privacy opinions 2019-2021"),
                         ("2019-01-01", "2021-12-31"))
        self.assertEqual(years_from_text("privacy opinions"), (None, None))


class ReadTests(unittest.TestCase):
    def test_a_search_returns_the_count_and_the_rows(self):
        data, feed = make_data()
        found = data.search("privacy")
        self.assertEqual(found["count"], 117150)
        self.assertEqual(len(found["rows"]), 2)
        self.assertEqual(found["truncated"], True)
        self.assertEqual(feed.params[-1]["q"], "privacy")
        #: Everything is filtered to opinions, or the count would include dockets.
        self.assertEqual(feed.params[-1]["type"], "o")

    def test_a_court_filter_and_a_date_window_go_to_the_api(self):
        data, feed = make_data()
        found = data.search("privacy", court="ca9", after="2020-01-01", before="2020-12-31")
        self.assertEqual(feed.params[-1]["court"], "ca9")
        self.assertEqual(feed.params[-1]["filed_after"], "2020-01-01")
        self.assertEqual(feed.params[-1]["filed_before"], "2020-12-31")
        self.assertEqual(found["window"], "filed in 2020")

    def test_a_case_is_the_most_cited_one_with_that_name(self):
        data, feed = make_data()
        row = data.case("Brown v. Board of Education")
        self.assertEqual(row["case_name"], "Brown v. Board of Education")
        self.assertEqual(row["court_citation"], "SCOTUS")
        self.assertEqual(row["date_filed"], "1954-05-17")
        self.assertEqual(row["cite_count"], 3825)
        self.assertEqual(row["citation"], "347 U.S. 483; 74 S. Ct. 686")
        #: The caseName filter is what makes this a lookup and not a keyword search.
        self.assertIn('caseName:"Brown v. Board of Education"', feed.params[-1]["q"])

    def test_a_case_with_no_opinion_is_not_a_keyword_search(self):
        data, feed = make_data(case={"count": 0, "results": []})
        with self.assertRaises(CourtsNotFound):
            data.case("Nonexistent v. Nothing")
        #: One call, and it was the caseName one. Falling back to a keyword search would
        #: hand back a different case with a confident face.
        self.assertEqual(len(feed.calls), 1)
        self.assertIn("caseName:", str(feed.params[-1]["q"]))

    def test_a_court_lookup(self):
        data, feed = make_data()
        found = data.courts("the Ninth Circuit")
        self.assertEqual(found["court"]["id"], "ca9")
        self.assertEqual(found["court"]["citation"], "9th Cir.")
        self.assertEqual(found["total"], 3359)
        self.assertIn("courts/", feed.calls[-1])

    def test_a_court_that_is_not_in_the_directory(self):
        data, _feed = make_data()
        with self.assertRaises(CourtsNotFound):
            data.courts("the Moon Circuit")

    def test_the_directory_listing_reads_two_pages(self):
        data, feed = make_data()
        found = data.courts()
        #: Two pages, not all 3359: the listing is a sample of the directory, capped so a
        #: question cannot turn into 34 requests.
        self.assertEqual(len(found["courts"]), 4)
        self.assertEqual(found["total"], 3359)
        self.assertEqual(len(feed.calls), 2)

    def test_a_dead_api_and_a_bad_argument(self):
        data, _feed = make_data(fail=True)
        with self.assertRaises(CourtsError):
            data.search("privacy")
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.search("  ")
        with self.assertRaises(ValueError):
            data.case("")


class RouteTests(unittest.TestCase):
    def test_a_topic_question(self):
        self.assertEqual(route("find court opinions about privacy"),
                         ("courts-opinions", {"query": "privacy"}))
        self.assertEqual(route("court opinions on employment law in 2020"),
                         ("courts-opinions", {"query": "employment law", "court": None,
                                              "court_name": None, "after": "2020-01-01",
                                              "before": "2020-12-31"}))

    def test_a_case_question(self):
        self.assertEqual(route("which court decided Brown v. Board of Education?"),
                         ("courts-case", {"case": "Brown v. Board of Education"}))

    def test_a_count_question(self):
        self.assertEqual(route("how many opinions mention fourth amendment?"),
                         ("courts-count", {"query": "fourth amendment"}))

    def test_a_court_filter_is_not_a_directory_question(self):
        skill, params = route("opinions on privacy in the Ninth Circuit")
        self.assertEqual(skill, "courts-opinions")
        self.assertEqual(params["query"], "privacy")
        self.assertEqual(params["court_name"], "the Ninth Circuit")
        self.assertEqual(route("privacy opinions in ca9")[1]["court"], "ca9")

    def test_the_directory(self):
        self.assertEqual(route("which courts does CourtListener index?"),
                         ("courts-courts", {"court": None}))
        self.assertEqual(route("what is ca9?"), ("courts-courts", {"court": "ca9"}))
        self.assertEqual(route("what is the citation string for the D.C. Circuit?"),
                         ("courts-courts", {"court": "the D.C. Circuit"}))

    def test_a_question_that_is_not_about_the_law(self):
        for text in ("tell me a joke", "how deep is the water table in Kansas?",
                     "what is the weather?", ""):
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
        from agent import CourtsAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = CourtsAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_free_answer_reports_the_cases(self):
        result, client, _ = self.turn("find court opinions about privacy")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("8 best match(es) of 117150 opinion(s) for 'privacy'", result["text"])
        self.assertIn("Electronic Privacy Information Center v. DOJ (D.C. Cir.)", result["text"])
        self.assertIn("18 F.4th 712, filed 2021-11-30, docket 20-5364", result["text"])
        self.assertIn("cited by 41 opinion(s)", result["text"])
        self.assertIn("https://www.courtlistener.com/opinion/5301494/", result["text"])
        self.assertIn("coverage is uneven", result["text"])

    def test_a_case_answer_says_which_court_decided_it(self):
        result, _, _ = self.turn("which court decided Brown v. Board of Education?")
        self.assertIn("Brown v. Board of Education", result["text"])
        self.assertIn("decided by: Supreme Court of the United States (SCOTUS)", result["text"])
        self.assertIn("filed: 1954-05-17", result["text"])
        self.assertIn("citation: 347 U.S. 483; 74 S. Ct. 686", result["text"])
        self.assertIn("cited by: 3825 opinion(s)", result["text"])

    def test_a_count_answer(self):
        result, _, _ = self.turn("how many opinions mention fourth amendment?")
        self.assertIn("117150 opinion(s) in CourtListener mention 'fourth amendment'",
                      result["text"])
        self.assertIn("showing the 20 best matches", result["text"])

    def test_a_long_list_is_capped(self):
        #: Twenty citations in a terminal answer is noise, so only the first eight print.
        from agent import SHOWN, render_opinions

        data, _feed = make_data(search={"count": 117150, "next": "page2", "results": [
            {"caseName": f"Case {n}", "citation": [], "court": "Ninth Circuit",
             "court_citation_string": "9th Cir.", "absolute_url": f"/opinion/{n}/"}
            for n in range(20)]})
        found = data.search("privacy")
        body = render_opinions(found)
        self.assertEqual(SHOWN, 8)
        self.assertIn("8 best match(es) of 117150 opinion(s)", body)
        self.assertIn("Case 7", body)
        self.assertNotIn("Case 8", body)
        self.assertIn("20 came back on the first page; 117150 match", body)

    def test_a_court_filter_that_is_not_in_the_directory_says_so(self):
        result, _, _ = self.turn("opinions on privacy in the Moon Circuit")
        self.assertIn("'the Moon Circuit' is not in CourtListener's court directory",
                      result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("CourtListener", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("find court opinions about privacy", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_api(self):
        result, _, _ = self.turn("find court opinions about privacy", fail=True)
        self.assertIn("I could not read CourtListener", result["text"])


# ---------------------------------------------------------------------------
# The premium skill: courts-topic-courts
#
# No network: the licence check and the work both happen on the gateway, and the
# gateway's own JSON-RPC answers are injected into the real GatewayClient.
# ---------------------------------------------------------------------------

#: What `courts_topic_courts` answers for a privacy search sampled at 400 opinions.
TOPIC_DATA = {
    "query": "privacy",
    "opinions_sampled": 400,
    "corpus_count": 117150,
    "sampled_note": "CourtListener returns best matches first, so this is a sample of the "
                    "400 highest-ranked opinions, not a census of all 117150",
    "courts": [
        {"court": "Court of Appeals for the Ninth Circuit", "court_citation": "9th Cir.",
         "court_id": "ca9", "count": 148, "share": 37.0},
        {"court": "Court of Appeals for the D.C. Circuit", "court_citation": "D.C. Cir.",
         "court_id": "cadc", "count": 96, "share": 24.0},
        {"court": "Supreme Court of the United States", "court_citation": "SCOTUS",
         "court_id": "scotus", "count": 40, "share": 10.0},
    ],
    "source": "CourtListener opinion search (courtlistener.com)",
}

#: The exact refusal the gateway sends for a key it will not accept.
GATEWAY_DENIAL = ("`courts_topic_courts` is a premium tool, but that licence key was rejected. "
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
        from agent import CourtsAgent

        agent_conn, client_conn = connected_pair()
        data, _feed = make_data()
        gateway = GatewayClient(fetch=fetch, key=key, url="https://gateway.test/mcp")
        agent = CourtsAgent(agent_conn, data, gateway=gateway)
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
        result, client = self.turn("which courts rule most on privacy?", fetch, "")
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
        result, _ = self.turn("which courts rule most on privacy?", fetch, "not-a-real-key")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn(GATEWAY_DENIAL, result["text"])
        self.assertIn("premium", result["text"])
        self.assertEqual(len(fetch.calls), 1)
        self.assertEqual(fetch.calls[0]["payload"]["params"]["name"], "courts_topic_courts")

    def test_a_good_key_returns_the_court_breakdown(self):
        fetch = gateway_answer(json.dumps(TOPIC_DATA))
        result, _ = self.turn("which courts rule most on privacy?", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("Court of Appeals for the Ninth Circuit (9th Cir.): 148 opinion(s), 37%",
                      result["text"])
        self.assertIn("Supreme Court of the United States (SCOTUS): 40 opinion(s), 10%",
                      result["text"])
        self.assertIn("from 400 opinion(s) CourtListener returned", result["text"])
        self.assertIn("not a census of all 117150", result["text"])
        self.assertIn("corpus count for this query: 117150", result["text"])
        #: The licence key travels in a header and is never echoed back.
        self.assertEqual(fetch.calls[0]["headers"]["Authorization"], "Bearer k_paid")
        self.assertNotIn("k_paid", result["text"])

    def test_a_good_key_sends_the_topic_it_was_asked_for(self):
        fetch = gateway_answer(json.dumps(TOPIC_DATA))
        self.turn("which courts decide most about employment law?", fetch, "k_paid")
        self.assertEqual(fetch.calls[0]["payload"]["params"]["arguments"], {"query": "employment law"})

    def test_an_empty_gateway_answer_is_not_a_crash(self):
        fetch = gateway_answer(json.dumps({"query": "privacy", "courts": [],
                                           "opinions_sampled": 0}))
        result, _ = self.turn("which courts rule most on privacy?", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("did not send back a court breakdown", result["text"])

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def fetch(url, payload, headers):
            raise OSError("connection refused")

        result, _ = self.turn("which courts rule most on privacy?", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read CourtListener", result["text"])

    def test_the_routing_is_narrow(self):
        for text in ("which courts rule most on privacy?",
                     "which courts decide most about employment law?",
                     "what is the most common court for privacy cases?",
                     "rank the courts that rule on data privacy"):
            self.assertEqual(route(text)[0], "courts-topic-courts", text)

        free = [
            ("find court opinions about privacy", "courts-opinions"),
            ("how many opinions mention privacy?", "courts-count"),
            ("which court decided Brown v. Board of Education?", "courts-case"),
            ("opinions on privacy in the Ninth Circuit", "courts-opinions"),
            ("what is the citation string for the D.C. Circuit?", "courts-courts"),
            ("what can you do?", "help"),
        ]
        for text, expected in free:
            self.assertEqual(route(text)[0], expected, text)

    def test_the_premium_skill_id_is_published(self):
        from agent import SKILLS

        self.assertIn("courts-topic-courts", SKILLS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
