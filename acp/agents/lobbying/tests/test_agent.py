"""Tests for the lobbying agent: a firm's filings, its issues, one kind of filing, the
Senate's count, routing, and the one premium skill.

    python3 agents/lobbying/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(lda.senate.gov 301-redirects to lda.gov; `filing_year=2024` alone counts 96945 filings;
`filing_year=2024&q=trade`, `&q=zzzznotathing` and `&issue=TRA` all count 96945 too, which is
why no topic filter is ever sent; `filing_year=2024&filing_type=Q1` counts 18898;
`registrant_name=Microsoft&filing_year=2023` counts 5, with expenses 222000.00 on the Q1
and 2220000.00 on the 1A).
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
from data import (LobbyingData, LobbyingError, LobbyingNotFound, money,  # noqa: E402
                  span_from_text, sum_money, years_from_text)

COUNTS = {("2024", None, None): 96945, ("2024", "Q1", None): 18898,
          ("2023", None, "Microsoft"): 5, ("2022", None, "Microsoft"): 4,
          ("2021", None, "Microsoft"): 4, ("2022", "RR", None): 12000}


def filing(uuid, registrant, filing_type, filing_type_name, period, expenses=None,
           income=None, issues=(("TRA", "Trade (domestic/foreign)"),),
           lobbyists=("JANE DOE",), client=None,
           posted="2023-04-20T10:13:41-05:00"):
    activities = [{"general_issue_code": code, "general_issue_code_display": name,
                   "lobbyists": [{"lobbyist": {"first_name": who.split()[0],
                                               "last_name": " ".join(who.split()[1:])}}
                                 for who in lobbyists]}
                  for code, name in issues]
    return {
        "url": f"https://lda.gov/api/v1/filings/{uuid}/",
        "filing_uuid": uuid,
        "filing_type": filing_type,
        "filing_type_display": filing_type_name,
        "filing_year": int(posted[:4]),
        "filing_period": "first_quarter",
        "filing_period_display": period,
        "filing_document_url": f"https://lda.gov/filings/public/filing/{uuid}/print/",
        "filing_document_content_type": "application/pdf",
        "income": income,
        "expenses": expenses,
        "posted_by_name": None,
        "dt_posted": posted,
        "registrant": {"id": 1, "name": registrant, "city": "WASHINGTON", "state": "DC"},
        "client": {"id": 2, "name": client or registrant, "client_government_entity": False},
        "lobbying_activities": activities,
    }


MSFT_Q1 = filing("uuid-q1-2023", "MICROSOFT CORPORATION", "Q1", "Quarterly Report",
                 "1st Quarter (Jan 1 - Mar 31)", expenses="222000.00")
MSFT_1A = filing("uuid-1a-2023", "MICROSOFT CORPORATION", "1A", "Termination Report",
                 "1st Quarter (Jan 1 - Mar 31)", expenses="2220000.00")
MSFT_Q2 = filing("uuid-q2-2023", "MICROSOFT CORPORATION", "Q2", "Quarterly Report",
                 "2nd Quarter (Apr 1 - Jun 30)", expenses="2300000.00")
MSFT_Q3 = filing("uuid-q3-2023", "MICROSOFT CORPORATION", "Q3", "Quarterly Report",
                 "3rd Quarter (Jul 1 - Sep 30)")
MSFT_RR = filing("uuid-rr-2023", "MICROSOFT CORPORATION", "RR", "Registration Report",
                 "Annual", posted="2023-01-05T09:00:00-05:00")
OTHER_Q1 = filing("uuid-q1-2024", "EAST CAPITOL ADVISORS LLC", "Q1", "Quarterly Report",
                  "1st Quarter (Jan 1 - Mar 31)", income="30000.00",
                  issues=(("INT", "Intelligence"),), lobbyists=("BRETT GARSON",),
                  client="E-COM 9-1-1 DISPATCH CENTER", posted="2024-01-02T10:13:41-05:00")

PAGES = {
    ("2023", "Microsoft", None): [MSFT_Q1, MSFT_1A, MSFT_Q2, MSFT_Q3, MSFT_RR],
    ("2022", "Microsoft", None): [MSFT_Q1, MSFT_1A, MSFT_Q2, MSFT_Q3],
    ("2021", "Microsoft", None): [MSFT_Q1, MSFT_1A, MSFT_Q2, MSFT_Q3],
    ("2024", None, "Q1"): [OTHER_Q1],
    ("2022", None, "RR"): [MSFT_RR],
}


class FakeFeeds:
    def __init__(self, pages=None, counts=None, empty=False, fail=False):
        self.calls: list[dict] = []
        self.pages = PAGES if pages is None else pages
        self.counts = COUNTS if counts is None else counts
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str, params: dict):
        self.calls.append(dict(params or {}))
        if self.fail:
            raise LobbyingError("the LDA API is unreachable")
        year = str((params or {}).get("filing_year") or "")
        registrant = (params or {}).get("registrant_name")
        filing_type = (params or {}).get("filing_type")
        count = self.counts.get((year, filing_type, registrant), 0)
        if self.empty:
            return json.dumps({"count": 0, "next": None, "previous": None, "results": []})
        page = int((params or {}).get("page") or 1)
        rows = self.pages.get((year, registrant, filing_type), [])
        start = (page - 1) * 25
        window = rows[start:start + 25]
        return json.dumps({"count": count, "next": None, "previous": None, "results": window})


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return LobbyingData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_an_amount_the_filing_did_not_report_is_not_zero(self):
        self.assertEqual(money("222000.00"), 222000.0)
        self.assertEqual(money("$1,234.50"), 1234.50)
        self.assertIsNone(money(""))
        self.assertIsNone(money(None))
        self.assertEqual(sum_money([1.0, None, 2.0]), 3.0)
        self.assertEqual(sum_money([None, None]), 0.0)

    def test_the_year_a_question_asks_about(self):
        self.assertEqual(years_from_text("in 2023"), [2023])
        self.assertEqual(span_from_text("from 2021 to 2023"), (2021, 2023))
        self.assertEqual(span_from_text("in 2022"), (2022, 2022))
        #: No year asked for: the last year whose filings are all in.
        self.assertEqual(span_from_text("in total")[0], span_from_text("in total")[1])


class ReadTests(unittest.TestCase):
    def test_a_registrants_filings(self):
        data, feed = make_data()
        found = data.registrant("Microsoft", 2023, limit=3)
        self.assertEqual(found["count"], 5)
        self.assertEqual(len(found["rows"]), 3)
        self.assertEqual(found["rows"][0]["filing_type"], "Q1")
        self.assertEqual(found["rows"][0]["expenses"], 222000.0)
        self.assertEqual(found["rows"][0]["posted"], "2023-04-20")
        self.assertEqual(found["issues"][0]["code"], "TRA")
        self.assertEqual(found["issues"][0]["issue"], "Trade (domestic/foreign)")
        self.assertIn("JANE DOE", [row["name"] for row in found["lobbyists"]])
        #: Five filings and a page holds 25, so there is no second page.
        self.assertFalse(found["more_pages"])
        #: The only filters the API honours.
        self.assertEqual(feed.calls[-1]["registrant_name"], "Microsoft")
        self.assertEqual(int(feed.calls[-1]["filing_year"]), 2023)

    def test_a_topic_filter_is_never_sent(self):
        data, feed = make_data()
        data.registrant("Microsoft", 2023, limit=1)
        data.by_type("Q1", 2024, limit=1)
        data.count(2024)
        for call in feed.calls:
            #: `q` and `issue` are accepted by the Senate's API and ignored by it, so
            #: sending either would make the count and the list claim a filter that never
            #: happened.
            self.assertNotIn("q", call)
            self.assertNotIn("issue", call)

    def test_one_kind_of_filing(self):
        data, feed = make_data()
        found = data.by_type("Q1", 2024, limit=5)
        self.assertEqual(found["count"], 18898)
        #: 18898 filings and a page holds 25, so this is the first slice of a long list.
        self.assertTrue(found["more_pages"])
        self.assertEqual(found["rows"][0]["registrant"], "EAST CAPITOL ADVISORS LLC")
        self.assertEqual(found["rows"][0]["income"], 30000.0)
        self.assertEqual(found["rows"][0]["issues"], {"INT": 1})
        self.assertEqual(feed.calls[-1]["filing_type"], "Q1")
        with self.assertRaises(ValueError):
            data.by_type("Q9", 2024)

    def test_the_senates_own_count(self):
        data, _feed = make_data()
        self.assertEqual(data.count(2024)["count"], 96945)
        self.assertEqual(data.count(2023, registrant="Microsoft")["count"], 5)
        self.assertEqual(data.count(2024, filing_type="Q1")["count"], 18898)

    def test_a_filing_with_no_money_says_so(self):
        data, _feed = make_data()
        found = data.registrant("Microsoft", 2023, limit=10)
        rr = [row for row in found["rows"] if row["filing_type"] == "RR"][0]
        self.assertIsNone(rr["income"])
        self.assertIsNone(rr["expenses"])

    def test_totals_read_every_page_of_every_year(self):
        data, feed = make_data()
        found = data.totals("Microsoft", 2021, 2023)
        self.assertEqual(found["filings_read"], 13)
        self.assertEqual(found["filings_available"], 13)
        self.assertFalse(found["truncated"])
        #: 4742000 in each of 2021, 2022 and 2023: Q1 222000 + 1A 2220000 + Q2 2300000.
        self.assertEqual(found["total_expenses"], 14226000.0)
        self.assertEqual(found["filings_reporting_expenses"], 9)
        #: No filing in the window reported income, so the total is 0.00 rather than None:
        #: the number was looked for and every filing left it blank.
        self.assertEqual(found["total_income"], 0.0)
        self.assertEqual(found["by_type"][0]["filing_type"], "Q1")
        self.assertEqual(found["by_type"][0]["filings"], 3)
        self.assertEqual(found["issues"][0]["code"], "TRA")
        self.assertEqual(sorted(found["years_read"]), [2021, 2022, 2023])
        self.assertEqual(len(feed.calls), 3)

    def test_a_registrant_with_no_filing(self):
        data, _feed = make_data()
        with self.assertRaises(LobbyingNotFound):
            data.registrant("Nobody Here", 2023)
        with self.assertRaises(LobbyingNotFound):
            data.totals("Nobody Here", 2020, 2023)
        with self.assertRaises(ValueError):
            data.registrant("", 2023)
        with self.assertRaises(LobbyingNotFound):
            data.by_type("Q1", 2019)

    def test_a_dead_api(self):
        data, _feed = make_data(fail=True)
        with self.assertRaises(LobbyingError):
            data.registrant("Microsoft", 2023)
        with self.assertRaises(LobbyingError):
            data.count(2024)


class RouteTests(unittest.TestCase):
    def test_a_firms_filings(self):
        self.assertEqual(route("what did Microsoft file with the Senate in 2023?"),
                         ("lobbying-registrant", {"registrant": "Microsoft", "year": 2023}))
        self.assertEqual(route("who are the lobbyists at Amazon?")[0], "lobbying-registrant")

    def test_the_issues_a_firm_names(self):
        self.assertEqual(route("what issues does Boeing lobby on?"),
                         ("lobbying-issues", {"registrant": "Boeing", "year": 2025}))

    def test_one_kind_of_filing(self):
        self.assertEqual(route("show me the Q1 filings from 2024"),
                         ("lobbying-by-type", {"filing_type": "Q1", "year": 2024}))
        self.assertEqual(route("how many first quarter filings were there in 2024?"),
                         ("lobbying-by-type", {"filing_type": "Q1", "year": 2024}))
        self.assertEqual(route("registration reports in 2022"),
                         ("lobbying-by-type", {"filing_type": "RR", "year": 2022}))

    def test_the_count(self):
        self.assertEqual(route("how many lobbying filings were there in 2024?"),
                         ("lobbying-count", {"year": 2024}))

    def test_the_total_is_the_premium_question(self):
        self.assertEqual(route("how much did Microsoft spend on lobbying in total from 2021 to 2023?"),
                         ("lobbying-totals", {"registrant": "Microsoft", "from_year": 2021,
                                              "to_year": 2023}))

    def test_a_question_that_is_not_about_lobbying(self):
        for text in ("tell me a joke", "what is the weather?", ""):
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
        from agent import LobbyingAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = LobbyingAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_free_answer_reports_real_filings(self):
        result, client, _ = self.turn("what did Microsoft file with the Senate in 2023?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("5 filing(s) by 'Microsoft' in 2023", result["text"])
        self.assertIn("Q1 - Quarterly Report (1st Quarter (Jan 1 - Mar 31))", result["text"])
        self.assertIn("expenses $222,000.00", result["text"])
        self.assertIn("TRA (Trade (domestic/foreign))", result["text"])
        self.assertIn("lobbyists: JANE DOE", result["text"])
        self.assertIn("no amount on this filing", result["text"])
        self.assertIn("ignores a text search and an issue filter", result["text"])

    def test_an_issues_answer_says_where_the_codes_came_from(self):
        #: A year with filings: the default year would be the last complete one, which
        #: the fixture deliberately does not have.
        result, _, _ = self.turn("what issues does Microsoft lobby on in 2023?")
        self.assertIn("TRA - Trade (domestic/foreign)", result["text"])
        self.assertIn("cannot filter filings by issue", result["text"])

    def test_a_filing_type_answer(self):
        result, _, _ = self.turn("show me the Q1 filings from 2024")
        self.assertIn("18898 Q1 filing(s) in 2024", result["text"])
        self.assertIn("EAST CAPITOL ADVISORS LLC for E-COM 9-1-1 DISPATCH CENTER", result["text"])
        self.assertIn("income $30,000.00", result["text"])

    def test_a_count_answer(self):
        result, _, _ = self.turn("how many lobbying filings were there in 2024?")
        self.assertIn("96945 lobbying filing(s) in 2024", result["text"])
        self.assertIn("the Senate's own count", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("Senate", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("what did Microsoft file with the Senate in 2023?",
                                 permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_api(self):
        result, _, _ = self.turn("what did Microsoft file with the Senate in 2023?", fail=True)
        self.assertIn("I could not read the Senate's filings", result["text"])


# ---------------------------------------------------------------------------
# The premium skill: lobbying-totals
#
# No network: the licence check and the work both happen on the gateway, and the
# gateway's own JSON-RPC answers are injected into the real GatewayClient.
# ---------------------------------------------------------------------------

#: What `lobbying_registrant_totals` answers for Microsoft across 2021-2023.
TOTALS_DATA = {
    "registrant": "Microsoft",
    "from_year": 2021,
    "to_year": 2023,
    "filings_read": 13,
    "filings_available": 13,
    "truncated": False,
    "total_income": 0,
    "total_expenses": 14226000,
    "net": -14226000,
    "filings_reporting_income": 0,
    "filings_reporting_expenses": 9,
    "by_type": [
        {"filing_type": "Q1", "filings": 3, "income": 0, "expenses": 666000,
         "income_reported": 0, "expenses_reported": 3},
        {"filing_type": "RR", "filings": 1, "income": 0, "expenses": 0,
         "income_reported": 0, "expenses_reported": 0},
    ],
    "issues": [{"code": "TRA", "issue": "Trade (domestic/foreign)", "count": 13}],
    "lobbyists": [{"name": "JANE DOE", "count": 13}],
    "source": "Senate Lobbying Disclosure Act filings (lda.gov)",
}

#: The exact refusal the gateway sends for a key it will not accept.
GATEWAY_DENIAL = ("`lobbying_registrant_totals` is a premium tool, but that licence key was "
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
        from agent import LobbyingAgent

        agent_conn, client_conn = connected_pair()
        data, _feed = make_data()
        gateway = GatewayClient(fetch=fetch, key=key, url="https://gateway.test/mcp")
        agent = LobbyingAgent(agent_conn, data, gateway=gateway)
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
        text = "how much did Microsoft spend on lobbying in total from 2021 to 2023?"
        result, client = self.turn(text, fetch, "")
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
        text = "how much did Microsoft spend on lobbying in total from 2021 to 2023?"
        result, _ = self.turn(text, fetch, "bad-key")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn(GATEWAY_DENIAL, result["text"])
        self.assertIn("premium", result["text"])
        self.assertEqual(len(fetch.calls), 1)
        self.assertEqual(fetch.calls[0]["payload"]["params"]["name"],
                         "lobbying_registrant_totals")

    def test_a_good_key_returns_the_total(self):
        fetch = gateway_answer(json.dumps(TOTALS_DATA))
        result, _ = self.turn("how much did Microsoft spend on lobbying in total from 2021 to 2023?",
                              fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("Microsoft: Senate lobbying filings 2021 to 2023", result["text"])
        self.assertIn("filings read: 13 of 13", result["text"])
        self.assertIn("that is all of them", result["text"])
        self.assertIn("total expenses reported: $14,226,000.00 (on 9 filing(s))", result["text"])
        self.assertIn("expenses less income: $-14,226,000.00", result["text"])
        self.assertIn("Q1: 3 filing(s), expenses $666.00K", result["text"])
        self.assertIn("RR: 1 filing(s)", result["text"])
        self.assertIn("TRA - Trade (domestic/foreign): 13 activity report(s)", result["text"])
        self.assertIn("JANE DOE (13)", result["text"])
        #: The licence key travels in a header and is never echoed back.
        self.assertEqual(fetch.calls[0]["headers"]["Authorization"], "Bearer k_paid")
        self.assertNotIn("k_paid", result["text"])

    def test_a_good_key_sends_the_registrant_and_years_it_was_asked_for(self):
        fetch = gateway_answer(json.dumps(TOTALS_DATA))
        self.turn("how much did Microsoft spend on lobbying in total from 2021 to 2023?",
                  fetch, "k_paid")
        self.assertEqual(fetch.calls[0]["payload"]["params"]["arguments"],
                         {"registrant": "Microsoft", "from_year": 2021, "to_year": 2023})

    def test_an_empty_gateway_answer_is_not_a_crash(self):
        fetch = gateway_answer(json.dumps({"registrant": "Microsoft", "filings_read": 0}))
        result, _ = self.turn("how much did Microsoft spend on lobbying in total from 2021 to 2023?",
                              fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("did not send back a total", result["text"])

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def fetch(url, payload, headers):
            raise OSError("connection refused")

        result, _ = self.turn("how much did Microsoft spend on lobbying in total from 2021 to 2023?",
                              fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read the Senate's filings", result["text"])

    def test_the_routing_is_narrow(self):
        for text in ("how much did Microsoft spend on lobbying in total from 2021 to 2023?",
                     "what did Boeing spend on lobbying in total?",
                     "Microsoft's lobbying filings added up over the years",
                     "what is the total spending on lobbying for Amazon across the years?"):
            self.assertEqual(route(text)[0], "lobbying-totals", text)

        free = [
            ("what did Microsoft file with the Senate in 2023?", "lobbying-registrant"),
            ("what issues does Microsoft lobby on?", "lobbying-issues"),
            ("show me the Q1 filings from 2024", "lobbying-by-type"),
            ("how many lobbying filings were there in 2024?", "lobbying-count"),
            ("what can you do?", "help"),
        ]
        for text, expected in free:
            self.assertEqual(route(text)[0], expected, text)

    def test_the_premium_skill_id_is_published(self):
        from agent import SKILLS

        self.assertIn("lobbying-totals", SKILLS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
