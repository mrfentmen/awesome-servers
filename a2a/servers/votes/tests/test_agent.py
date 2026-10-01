"""Tests for the GovTrack votes server.

    python3 servers/votes/tests/test_agent.py
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
    DEFAULT_CONGRESS,
    SKILL_CHAMBER_SCORECARD,
    VotesAgent,
    parse,
    term_from_text,
)
from data import (  # noqa: E402
    BILL_DATASET,
    COMMITTEE_DATASET,
    DATASET,
    ROLE_DATASET,
    GovTrackClient,
)

ROE = {
    "number": 1, "question": "Call by States", "question_details": None,
    "vote_type": "Call by States", "category": "procedural", "result": "Passed",
    "passed": True, "required": "QUORUM", "margin": 0.806452, "total_plus": 0,
    "total_minus": 0, "total_other": 435, "percent_plus": None, "party_uniformity": 1.0,
    "chamber": "house", "congress": 119, "session": "2025",
    "date_created": "2025-01-03T12:33:00", "source_label": "house.gov",
    "link": "https://www.govtrack.us/congress/votes/119-2025/h1",
}
CLOTURE = {
    "number": 2, "question": "Motion to Invoke Cloture: Motion to Proceed to S. 9",
    "question_details": None, "vote_type": "On the Cloture Motion", "category": "cloture",
    "result": "Cloture on the Motion to Proceed Rejected", "passed": False, "required": "1/2",
    "margin": 12.5, "total_plus": 48, "total_minus": 52, "total_other": 0, "percent_plus": 48.0,
    "party_uniformity": 0.98, "chamber": "senate", "congress": 119, "session": "2025",
    "date_created": "2025-01-03T14:33:00", "source_label": "senate.gov",
    "link": "https://www.govtrack.us/congress/votes/119-2025/s1",
}
UNSCORED = {
    "number": 3, "question": "Voice vote", "vote_type": "Voice Vote", "category": "procedural",
    "result": None, "passed": None, "margin": None, "total_plus": None, "total_minus": None,
    "total_other": None, "percent_plus": None, "party_uniformity": None, "chamber": "house",
    "congress": 119, "session": "2025", "date_created": "2025-01-04T00:00:00",
    "source_label": "house.gov", "link": "https://www.govtrack.us/congress/votes/119-2025/h3",
}
BILL = {
    "bill_type": "house_bill", "bill_type_label": "H.R.", "congress": 119,
    "current_chamber": "house", "current_status": "passed_bill",
    "current_status_label": "Passed House & Senate (President next)",
    "current_status_date": "2025-07-14", "display_number": "H.R. 1",
    "introduced_date": "2025-01-03", "is_alive": True, "is_current": True,
    "link": "https://www.govtrack.us/congress/bills/119/hr1",
    "lock_title": False, "major_actions": [], "sponsor": "Rep. J. Smith [D-CA]",
    "sponsor_role": None, "title": "H.R. 1 - A Bill About Something",
    "title_without_number": "A Bill About Something", "titles": [],
}
ROLE = {
    "caucus": None, "congress_numbers": [119], "current": True, "description": None,
    "district": 28, "enddate": None, "leadership_title": None, "party": "Democrat",
    "person": {"bioguideid": "C001084", "firstname": "Judy", "lastname": "Chu",
               "link": "https://www.govtrack.us/congress/members/judy_chu/412545",
               "name": "Rep. Judy Chu [D-CA28]", "sortname": "Chu, Judy (Rep.) [D-CA28]"},
    "role_type": "representative", "startdate": "2025-01-03", "state": "CA",
}
SENATOR = {
    "caucus": None, "congress_numbers": [119], "current": True, "district": None,
    "enddate": None, "leadership_title": None, "party": "Democrat",
    "person": {"bioguideid": "P000197", "firstname": "Alex", "lastname": "Padilla",
               "link": "https://www.govtrack.us/congress/members/alex_padilla/412629",
               "name": "Sen. Alex Padilla [D-CA]", "sortname": "Padilla, Alex (Sen.) [D-CA]"},
    "role_type": "senator", "startdate": "2025-01-03", "state": "CA",
}
COMMITTEE = {
    "abbrev": "H.Approps", "code": "HAAP", "committee_type": "house",
    "jurisdiction": "The House Committee on Appropriations has jurisdiction over all Bills and "
                    "Resolutions on appropriation bills, including the agriculture appropriations bill.",
    "members": [{"person": {"name": "Rep. A [R-TX1]"}}], "name": "House Committee on Appropriations",
    "obsolete": False, "url": "https://appropriations.house.gov/",
}
SUBCOMMITTEE = {
    "abbrev": "", "code": "SSGA13", "committee": {"abbrev": "S.HSGA", "code": "SSGA",
                                                 "name": "Senate Committee on Homeland Security and "
                                                          "Governmental Affairs",
                                                 "committee_type": "senate"},
    "committee_type": None, "jurisdiction": None, "members": None,
    "name": "Ad Hoc Subcommittee on Contracting Oversight", "obsolete": True, "url": None,
}


def _no_network(*args, **kwargs):
    raise AssertionError("FakeGovTrack must not touch the network")


class FakeGovTrack(GovTrackClient):
    """Same interface as GovTrackClient, no network. Derived helpers stay real."""

    def __init__(self, votes=(ROE, CLOTURE, UNSCORED), bills=(BILL,),
                 members=(ROLE, SENATOR), committees=(COMMITTEE, SUBCOMMITTEE)) -> None:
        super().__init__(fetch=_no_network)
        self.vote_rows = list(votes)
        self.bill_rows = list(bills)
        self.member_rows = list(members)
        self.committee_rows = list(committees)
        self.reads = []

    def votes(self, congress=None, chamber=None, session=None, limit=20):
        self.reads.append(("votes", congress, chamber, session, limit))
        return {"filters": {k: v for k, v in (("congress", congress), ("chamber", chamber),
                                              ("session", session)) if v is not None},
                "total": len(self.vote_rows), "page_size": len(self.vote_rows), "offset": 0,
                "votes": [self.pick(dict(row), ("number", "question", "vote_type", "category",
                                                "result", "passed", "required", "margin",
                                                "total_plus", "total_minus", "total_other",
                                                "percent_plus", "party_uniformity", "chamber",
                                                "congress", "session", "date_created",
                                                "source_label", "link"), DATASET)
                          for row in self.vote_rows[:limit]]}

    def bills(self, congress=None, term=None, bill_type=None, status=None, limit=20):
        self.reads.append(("bills", congress, term, bill_type, status, limit))
        return {"filters": {k: v for k, v in (("congress", congress), ("q", term),
                                              ("bill_type", bill_type),
                                              ("current_status", status)) if v is not None},
                "query": term, "total": len(self.bill_rows), "page_size": len(self.bill_rows),
                "bills": [self.pick(self._bill(row), ("display_number", "title_without_number",
                                                      "title", "bill_type_label", "congress",
                                                      "introduced_date", "current_status",
                                                      "current_status_label", "current_status_date",
                                                      "current_chamber", "sponsor", "is_alive",
                                                      "is_current", "link"), BILL_DATASET)
                          for row in self.bill_rows[:limit]]}

    def roles(self, current="true", state=None, party=None, role_type=None, limit=20):
        self.reads.append(("roles", current, state, party, role_type, limit))
        # The real method normalizes and validates every filter before it is sent, so
        # the fake does too: "Democratic" has to become "Democrat" here as well.
        state = self.check_state(state)
        party = self.check_party(party)
        current = self.check_term(current)
        rows = [row for row in self.member_rows
                if (not state or row["state"] == state) and (not party or row["party"] == party)]
        return {"filters": {k: v for k, v in (("current", current), ("state", state),
                                              ("party", party), ("role_type", role_type)) if v},
                "total": len(rows), "page_size": len(rows),
                "members": [self.pick(self._role(row), ("person_name", "party", "role_type",
                                                        "state", "district", "chamber", "place",
                                                        "leadership_title", "startdate", "enddate",
                                                        "current", "link"), ROLE_DATASET)
                            for row in rows[:limit]]}

    def committees(self, limit=100):
        self.reads.append(("committees", limit))
        return {"total": len(self.committee_rows), "page_size": len(self.committee_rows),
                "committees": [self.pick(self._committee(row),
                                         ("name", "abbrev", "code", "committee_type",
                                          "jurisdiction", "obsolete", "member_count", "url"),
                                         COMMITTEE_DATASET)
                               for row in self.committee_rows]}


def fetch_from(votes=None, bills=None, roles=None, committees=None, calls=None):
    """A JsonApiClient `fetch` so data.py runs for real against a GovTrack page."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        if url.endswith("/vote"):
            rows = votes if votes is not None else []
            return {"meta": {"limit": params.get("limit"), "offset": 0, "total_count": len(rows)},
                    "objects": list(rows)}
        if url.endswith("/bill"):
            rows = bills if bills is not None else []
            return {"meta": {"limit": params.get("limit"), "offset": 0, "total_count": len(rows)},
                    "objects": list(rows)}
        if url.endswith("/role"):
            rows = roles if roles is not None else []
            return {"meta": {"limit": params.get("limit"), "offset": 0, "total_count": len(rows)},
                    "objects": list(rows)}
        if url.endswith("/committee"):
            rows = committees if committees is not None else []
            return {"meta": {"limit": params.get("limit"), "offset": 0, "total_count": len(rows)},
                    "objects": list(rows)}
        raise AssertionError(f"unexpected url {url}")

    return fetch


class ValidationTests(unittest.TestCase):
    def test_check_congress_chamber_session(self):
        self.assertEqual(GovTrackClient.check_congress("119"), 119)
        self.assertIsNone(GovTrackClient.check_congress(None))
        for bad in ("1", "1190", "abc"):
            with self.assertRaises(ValueError):
                GovTrackClient.check_congress(bad)
        with self.assertRaises(ValueError):
            GovTrackClient.check_congress(50)
        with self.assertRaises(ValueError):
            GovTrackClient.check_congress(300)
        self.assertEqual(GovTrackClient.check_chamber("Senate"), "senate")
        with self.assertRaises(ValueError):
            GovTrackClient.check_chamber("commons")
        self.assertEqual(GovTrackClient.check_session("2025"), 2025)
        with self.assertRaises(ValueError):
            GovTrackClient.check_session("25")

    def test_check_bill_type_and_status(self):
        self.assertEqual(GovTrackClient.check_bill_type("house bill"), "house_bill")
        self.assertEqual(GovTrackClient.check_bill_type("HR"), "house_resolution")
        self.assertEqual(GovTrackClient.check_bill_type("s.con.res"), "senate_concurrent_resolution")
        with self.assertRaises(ValueError):
            GovTrackClient.check_bill_type("treaty")
        self.assertEqual(GovTrackClient.check_bill_status("passed"), "passed_bill")
        self.assertEqual(GovTrackClient.check_bill_status("vetoed"), "prov_kill_veto")
        with self.assertRaises(ValueError):
            GovTrackClient.check_bill_status("duly noted")

    def test_check_state_party_role_term(self):
        self.assertEqual(GovTrackClient.check_state("ca"), "CA")
        with self.assertRaises(ValueError):
            GovTrackClient.check_state("California")
        for written in ("democrats", "Democrat", "Democratic", "dem"):
            self.assertEqual(GovTrackClient.check_party(written), "Democrat", written)
        with self.assertRaises(ValueError):
            GovTrackClient.check_party("Whig")
        self.assertEqual(GovTrackClient.check_role_type("Senator"), "senator")
        with self.assertRaises(ValueError):
            GovTrackClient.check_role_type("delegate")
        self.assertEqual(GovTrackClient.check_term("current"), "true")
        self.assertEqual(GovTrackClient.check_term("PAST"), "false")
        with self.assertRaises(ValueError):
            GovTrackClient.check_term("maybe")

    def test_check_limit_and_needle(self):
        self.assertEqual(GovTrackClient.check_limit("5"), 5)
        for bad in ("0", "101", "many"):
            with self.assertRaises(ValueError):
                GovTrackClient.check_limit(bad)
        self.assertEqual(GovTrackClient.check_limit("40", ceiling=50), 40)
        with self.assertRaises(ValueError):
            GovTrackClient.check_limit("60", ceiling=50)
        self.assertEqual(GovTrackClient.check_needle(" Appropriations ", "committee"), "Appropriations")
        with self.assertRaises(ValueError):
            GovTrackClient.check_needle("x" * 90, "committee")

    def test_vote_result_never_invents_an_outcome(self):
        client = GovTrackClient(fetch=_no_network)
        self.assertEqual(client.vote_result({"result": "Passed"}), "Passed")
        self.assertIn("Passed", client.vote_result({"passed": True}))
        self.assertIn("Failed", client.vote_result({"passed": False}))
        self.assertEqual(client.vote_result({}), "Result not published")


class ReaderTests(unittest.TestCase):
    def test_only_the_filters_govtrack_honours_are_sent(self):
        calls = []
        client = GovTrackClient(fetch=fetch_from([ROE, CLOTURE], calls=calls))
        result = client.votes(congress=119, chamber="senate", session=2025, limit=2)
        url, params = calls[0]
        self.assertTrue(url.endswith("/vote"))
        self.assertEqual(params["congress"], 119)
        self.assertEqual(params["session"], 2025)
        self.assertEqual(params["limit"], 2)
        # GovTrack answers "Cannot filter on field" for these, so they are never sent.
        for refused in ("category", "number", "order_by"):
            self.assertNotIn(refused, params, refused)
        self.assertEqual(result["total"], 2)
        self.assertEqual(result["votes"][0]["number"], 1)

    def test_an_unscored_vote_keeps_its_nulls(self):
        client = GovTrackClient(fetch=fetch_from([ROE, CLOTURE, UNSCORED]))
        result = client.votes(congress=119, limit=10)
        unscored = [vote for vote in result["votes"] if vote["number"] == 3][0]
        self.assertIsNone(unscored["passed"], "a vote GovTrack has not scored is not a failure")
        self.assertIsNone(unscored["margin"])
        self.assertIsNone(unscored["party_uniformity"])

    def test_a_subcommittee_is_flattened_from_its_parent(self):
        client = GovTrackClient(fetch=fetch_from(committees=[COMMITTEE, SUBCOMMITTEE]))
        found = client.find_committees("appropriations", limit=5)
        self.assertEqual([row["name"] for row in found], ["House Committee on Appropriations"])
        self.assertEqual(found[0]["member_count"], 1)
        committee = [row for row in client.committees()["committees"] if row["code"] == "SSGA13"][0]
        self.assertEqual(committee["abbrev"], "S.HSGA", "a subcommittee inherits its parent's code")
        self.assertTrue(committee["obsolete"])
        self.assertIsNone(committee["member_count"])

    def test_the_committee_list_asks_for_every_row(self):
        calls = []
        client = GovTrackClient(fetch=fetch_from(committees=[COMMITTEE], calls=calls))
        client.find_committees("appropriations")
        self.assertEqual(calls[0][1]["limit"], 500,
                         "a page of committees would make a local name search miss most of them")

    def test_a_malformed_payload_is_an_upstream_error(self):
        from a2a_kit import UpstreamError

        client = GovTrackClient(fetch=lambda url, params, headers: {"meta": {}})
        with self.assertRaises(UpstreamError):
            client.votes(congress=119)


class ParseTests(unittest.TestCase):
    def test_a_vote_question_routes_to_roll_call_votes(self):
        request = parse({"parts": [{"kind": "text", "text":
                                    "what roll-call votes did the Senate hold in the 119th Congress?"}]})
        self.assertEqual(request["skill"], "roll-call-votes")
        self.assertEqual(request["params"]["congress"], "119")
        self.assertEqual(request["params"]["chamber"], "senate")
        self.assertNotIn("term", request["params"])

    def test_a_bill_question_routes_to_bill_lookup(self):
        request = parse({"parts": [{"kind": "text", "text":
                                    "bills about infrastructure in the 119th Congress"}]})
        self.assertEqual(request["skill"], "bill-lookup")
        self.assertEqual(request["params"]["term"], "infrastructure",
                         "the congress is a filter, not a search term")
        self.assertEqual(request["params"]["congress"], "119")

    def test_a_status_and_type_become_filters_not_terms(self):
        request = parse({"parts": [{"kind": "text", "text":
                                    "house bills that passed in congress 119"}]})
        self.assertEqual(request["skill"], "bill-lookup")
        self.assertEqual(request["params"]["status"], "passed")
        self.assertEqual(request["params"]["bill_type"], "house bill")
        self.assertNotIn("term", request["params"])

    def test_a_member_question_routes_to_member_lookup(self):
        for text, state, party in (("who are the current Democratic senators from California?",
                                    "CA", "Democratic"),
                                   ("current representatives from Texas", "TX", None)):
            request = parse({"parts": [{"kind": "text", "text": text}]})
            self.assertEqual(request["skill"], "member-lookup", text)
            self.assertEqual(request["params"]["state"], state, text)
            self.assertEqual(request["params"].get("party"), party, text)

    def test_a_committee_question_routes_to_committee_lookup(self):
        for text, name in (("which committee handles appropriations?", "appropriations"),
                           ("look up the committee with code SSGA", "SSGA")):
            request = parse({"parts": [{"kind": "text", "text": text}]})
            self.assertEqual(request["skill"], "committee-lookup", text)
            self.assertEqual(request["params"]["name"], name, text)

    def test_a_scorecard_question_routes_to_the_premium_skill(self):
        for text, chamber in (("score the Senate votes in the 119th Congress", "senate"),
                              ("how often did the House vote as one party last congress?", "house")):
            request = parse({"parts": [{"kind": "text", "text": text}]})
            self.assertEqual(request["skill"], SKILL_CHAMBER_SCORECARD, text)
            self.assertEqual(request["params"]["chamber"], chamber, text)
            self.assertEqual(request["params"]["limit"], 200, text)
        # With no congress named, the current one is used rather than asking again.
        self.assertEqual(parse({"parts": [{"kind": "text", "text": "score the House votes"}]})
                         ["params"]["congress"], DEFAULT_CONGRESS)

    def test_term_extraction_drops_the_question_words(self):
        # On its own it drops the question words; parse() also masks the congress,
        # the status and the type out before calling it, which is what the tests above
        # and in SkillTests check end to end.
        self.assertEqual(term_from_text("bills about infrastructure in the 119th Congress"),
                         "infrastructure 119th")
        self.assertIsNone(term_from_text("what about the votes"),
                          "every word was a question word, so there is no term")
        self.assertIsNone(term_from_text("the votes"))

    def test_help_and_empty(self):
        self.assertEqual(parse({"parts": [{"kind": "text", "text": ""}]})["skill"], "help")
        self.assertEqual(parse({"parts": [{"kind": "text", "text": "what can you do?"}]})["skill"], "help")

    def test_an_explicit_skill_id_is_honoured(self):
        request = parse({"parts": [{"kind": "data", "data": {
            "skill": "bill-lookup", "congress": 118, "term": "water", "limit": 5}}]})
        self.assertEqual(request["skill"], "bill-lookup")
        self.assertEqual(request["params"]["limit"], 5)
        self.assertTrue(request["explicit"])


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, client=None, **params):
        agent = VotesAgent(client=client or FakeGovTrack())
        request = {"skill": skill, "params": params, "missing": agent.missing(skill, params)}
        return agent.run(request)

    def test_roll_call_votes_lists_votes(self):
        result = self.run_skill("roll-call-votes", congress=119, chamber="senate", limit=20)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("119th Congress", result["message"])
        self.assertIn("#1 Passed", result["message"])
        self.assertIn("cloture", result["message"])
        self.assertIn("48 yea / 52 nay", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertIn("GovTrack's own", result["message"])
        self.assertEqual(result["artifact"]["votes"][0]["number"], 1)

    def test_roll_call_votes_says_so_when_there_are_none(self):
        result = self.run_skill("roll-call-votes", client=FakeGovTrack(votes=()), congress=93,
                                chamber="house", limit=20)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("holds no roll-call vote", result["message"])
        self.assertIn("93", result["message"])

    def test_bill_lookup_returns_bills(self):
        result = self.run_skill("bill-lookup", congress=119, term="infrastructure", limit=20)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("H.R. 1", result["message"])
        self.assertIn("A Bill About Something", result["message"])
        self.assertIn("Passed House & Senate", result["message"])
        self.assertIn("Rep. J. Smith [D-CA]", result["message"])
        self.assertIn(BILL_DATASET, result["message"])

    def test_bill_lookup_says_so_when_there_are_none(self):
        result = self.run_skill("bill-lookup", client=FakeGovTrack(bills=()), term="nothing here")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("GovTrack holds no bill", result["message"])
        self.assertIn("vocabularies", result["message"])

    def test_member_lookup_resolves_state_and_party(self):
        result = self.run_skill("member-lookup", term_type="true", state="CA", party="Democratic",
                                limit=20)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Rep. Judy Chu [D-CA28]", result["message"])
        self.assertIn("Sen. Alex Padilla [D-CA]", result["message"])
        self.assertIn("currently serving", result["message"])
        self.assertIn("from CA", result["message"])
        self.assertIn("no name filter", result["message"])

    def test_member_lookup_with_no_match_explains_the_filters(self):
        result = self.run_skill("member-lookup", client=FakeGovTrack(members=()), state="ZZ")
        self.assertIn("No member in GovTrack matches", result["message"])
        self.assertIn("no name filter", result["message"])

    def test_committee_lookup_returns_the_committee(self):
        result = self.run_skill("committee-lookup", name="appropriations", limit=5)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("House Committee on Appropriations", result["message"])
        self.assertIn("(H.Approps)", result["message"])
        self.assertIn("[house]", result["message"])
        self.assertIn("jurisdiction:", result["message"])
        self.assertIn("refuses to filter this", result["message"])
        self.assertEqual(result["artifact"]["dataset"], COMMITTEE_DATASET)

    def test_committee_lookup_says_so_when_there_is_no_match(self):
        result = self.run_skill("committee-lookup", client=FakeGovTrack(committees=()),
                                name="nonesuch")
        self.assertIn("No committee in GovTrack matches", result["message"])
        self.assertIn("355", result["message"])

    def test_only_committee_lookup_needs_a_parameter(self):
        agent = VotesAgent(client=FakeGovTrack())
        self.assertEqual(agent.missing("committee-lookup", {}), ["name"])
        self.assertEqual(agent.missing("committee-lookup", {"name": "H.Approps"}), [])
        for skill in ("roll-call-votes", "bill-lookup", "member-lookup", "chamber-scorecard"):
            self.assertEqual(agent.missing(skill, {}), [], skill)
        result = agent.run({"skill": "committee-lookup", "params": {}, "missing": ["name"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("H.Approps", result["message"])

    def test_a_bad_argument_is_a_question_not_a_crash(self):
        client = GovTrackClient(fetch=fetch_from([ROE]))
        result = self.run_skill("roll-call-votes", client=client, congress=119, chamber="commons")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("chamber must be one of", result["message"])
        result = self.run_skill("bill-lookup", client=client, bill_type="treaty")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("bill type must be one of", result["message"])
        result = self.run_skill("member-lookup", client=client, state="California")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("two-letter code", result["message"])

    def test_help_does_not_touch_the_feed(self):
        result = self.run_skill("help")
        self.assertIn("GovTrack", result["message"])
        self.assertIn("no\nid for a vote", result["message"],
                        "the help says why a vote cannot be fetched by number")
        self.assertIsNone(result["artifact"])

    def test_card_lists_four_free_skills_and_one_premium(self):
        ids = [skill["id"] for skill in CARD_SKILLS]
        self.assertEqual(ids, ["roll-call-votes", "bill-lookup", "member-lookup",
                               "committee-lookup", "chamber-scorecard"])
        premium = [skill for skill in CARD_SKILLS if "premium" in skill["tags"]]
        self.assertEqual([skill["id"] for skill in premium], ["chamber-scorecard"])
        for skill in CARD_SKILLS[:-1]:
            self.assertNotIn("premium", skill["tags"], skill["id"])

    def test_agent_metadata(self):
        agent = VotesAgent(client=FakeGovTrack())
        self.assertEqual(agent.env_prefix, "VOTES")
        self.assertEqual(agent.datasets, (DATASET, BILL_DATASET, ROLE_DATASET, COMMITTEE_DATASET))
        self.assertEqual(agent.watch_kinds, ())


#: Shape copied from a live gateway `votes_chamber_scorecard` answer for the 119th Senate.
SCORECARD_PAYLOAD = {
    "congress": 119,
    "chamber": "senate",
    "totalVotes": 909,
    "votesRead": 200,
    "passed": 146,
    "failed": 54,
    "noResult": 0,
    "decided": 200,
    "passRate": 73.0,
    "averageMargin": 0.17,
    "withMargin": 200,
    "partyLine": 29,
    "withPartyUniformity": 200,
    "partyLineRate": 14.5,
    "byCategory": [
        {"category": "cloture", "count": 58, "passed": 55, "failed": 3, "averageMargin": 0.4},
        {"category": "amendment", "count": 43, "passed": 5, "failed": 38, "averageMargin": 0.2},
    ],
    "mostContested": {"number": 8, "question": "On the Nomination PN11-13: Marco Rubio",
                      "margin": 42.1},
    "closestVote": {"number": 15, "question": "On the Nomination PN11-7: Peter Hegseth",
                    "margin": 0.01},
    "longestRun": {"count": 39, "outcome": "passed", "endNumber": 61},
    "note": "Only the votes read are scored.",
}

DENIED_TEXT = ("`votes_chamber_scorecard` is a premium tool, but that license key is not valid. "
               "Get a key at https://buy.polar.sh/polar_cl_example")
TOOL_ERROR_TEXT = "`votes_chamber_scorecard` failed: upstream returned HTTP 500"


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


class ScorecardSkillTests(unittest.TestCase):
    """The premium skill: parsing stays local, the roll-up comes from the gateway."""

    def run_scorecard(self, gateway, client=None, **params):
        payload = {"congress": 119, "chamber": "senate", "limit": 200, **params}
        return VotesAgent(client or FakeGovTrack(), gateway=gateway).run(
            {"skill": SKILL_CHAMBER_SCORECARD, "params": payload, "missing": []})

    def test_the_scorecard_question_routes_to_the_premium_skill(self):
        for text in ("score the Senate votes in the 119th Congress",
                     "how often did the House vote as one party last congress?",
                     "what is the House's pass rate in congress 118?"):
            parsed = parse(_message(text))
            self.assertEqual(parsed["skill"], SKILL_CHAMBER_SCORECARD, text)
            self.assertTrue(parsed["explicit"], text)

    def test_the_free_skills_keep_their_own_questions(self):
        for text, skill in (("what roll-call votes did the Senate hold in the 119th Congress?",
                             "roll-call-votes"),
                            ("bills about infrastructure in the 119th Congress", "bill-lookup"),
                            ("who are the current Democratic senators from California?",
                             "member-lookup"),
                            ("which committee handles appropriations?", "committee-lookup")):
            self.assertEqual(parse(_message(text))["skill"], skill, text)

    def test_the_message_reports_the_gateways_scorecard(self):
        gateway, calls = fake_gateway(SCORECARD_PAYLOAD)
        result = self.run_scorecard(gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("senate vote scorecard for the 119th Congress", result["message"])
        self.assertIn("GovTrack holds 909 vote(s), and this run read 200", result["message"])
        self.assertIn("146 passed and 54 failed", result["message"])
        self.assertIn("73.0% passed", result["message"])
        self.assertIn("Average margin 0.17", result["message"])
        self.assertIn("as one block on 29 of 200 vote(s)", result["message"])
        self.assertIn("cloture: 58 vote(s), 55 passed", result["message"])
        self.assertIn("Widest margin", result["message"])
        self.assertIn("Longest run of one-way outcomes: 39 passed", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertTrue(result["artifact"]["premium"])
        self.assertEqual(result["artifact"]["pass_rate"], 73.0)
        self.assertEqual(result["artifact"]["votes_read"], 200)

        # GovTrack was read behind the gate, not here.
        self.assertEqual(len(calls), 1)
        sent = calls[0]["payload"]["params"]
        self.assertEqual(sent["name"], "votes_chamber_scorecard")
        self.assertEqual(sent["arguments"]["congress"], 119)
        self.assertEqual(sent["arguments"]["chamber"], "senate")
        self.assertEqual(sent["arguments"]["limit"], 200)

    def test_without_a_licence_the_caller_is_told_how_to_get_one(self):
        gateway, calls = fake_gateway(key="")
        result = self.run_scorecard(gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("MCP_LICENSE_KEY", result["message"])
        self.assertEqual(result["artifact"]["reason"], "missing_key")
        self.assertNotIn("pass_rate", result["artifact"])
        self.assertEqual(calls, [], "a keyless caller must not reach the gateway")

    def test_a_licence_refusal_keeps_the_gateways_wording(self):
        gateway, _ = fake_gateway()  # nothing but a refusal
        result = self.run_scorecard(gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["message"], DENIED_TEXT)
        self.assertEqual(result["artifact"]["reason"], "denied")

    def test_a_dead_gateway_fails_instead_of_inventing_a_scorecard(self):
        gateway, _ = fake_gateway(error=OSError("connection refused"))
        result = self.run_scorecard(gateway)
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("could not be reached", result["message"])
        self.assertIsNone(result["artifact"].get("pass_rate"))

    def test_a_tool_error_is_not_sold_as_a_licence_problem(self):
        gateway, _ = fake_gateway(tool_error=TOOL_ERROR_TEXT)
        result = self.run_scorecard(gateway)
        self.assertEqual(result["final_state"], "failed")
        self.assertNotIn("MCP_LICENSE_KEY", result["message"])
        self.assertIn("HTTP 500", result["message"])

    def test_a_bad_argument_never_reaches_the_gateway(self):
        gateway, calls = fake_gateway(SCORECARD_PAYLOAD)
        result = self.run_scorecard(gateway, chamber="commons")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("chamber must be one of", result["message"])
        result = self.run_scorecard(gateway, congress=50)
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("93rd Congress", result["message"])
        result = self.run_scorecard(gateway, limit=900)
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("limit must be between 1 and 300", result["message"])
        self.assertEqual(calls, [])

    def test_a_congress_with_no_votes_reports_cleanly(self):
        payload = {**SCORECARD_PAYLOAD, "totalVotes": 0, "votesRead": 0, "passed": 0, "failed": 0,
                   "noResult": 0, "decided": 0, "passRate": None, "averageMargin": None,
                   "withMargin": 0, "partyLine": 0, "withPartyUniformity": 0,
                   "partyLineRate": None, "byCategory": [], "mostContested": None,
                   "closestVote": None, "longestRun": None}
        gateway, _ = fake_gateway(payload)
        result = self.run_scorecard(gateway, congress=93, chamber="house")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("No vote to score", result["message"])

    def test_an_undecided_vote_is_not_counted_as_a_failure(self):
        payload = {**SCORECARD_PAYLOAD, "passed": 146, "failed": 53, "noResult": 1,
                   "decided": 199, "passRate": 73.4, "longestRun": None}
        gateway, _ = fake_gateway(payload)
        result = self.run_scorecard(gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("1 published no result", result["message"])
        self.assertIn("counted as undecided", result["message"])


if __name__ == "__main__":
    unittest.main()
