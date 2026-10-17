"""Tests for the dailymed agent: the index, a label's contents, a section and the turns.

    python3 agents/dailymed/tests/test_agent.py

No network: the JSON and the XML are injected, shaped like the live payloads read on
2026-09-28 (spls.json?drug_name=LIPITOR -> 3 labels, total_elements 3, the newest
VIATRIS one spl_version 8 published Jul 15 2026; the single-label JSON form is retired
with HTTP 415 while <setid>.xml answers HTTP 200 with 68 <section> elements over
125663 characters, 34067-9 INDICATIONS & USAGE SECTION among them).
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

from agent import drug_from_text, labeler_from_text, route  # noqa: E402
from data import (SECTION_CODES, DrugLabelData, DrugLabelError, DrugLabelNotFound,  # noqa: E402
                  clean_text, code_for_section, manufacturer_from_title, section_from_text)

VIATRIS_SETID = "a60cc18b-0631-4cf0-b021-9f52224ece65"

INDEX = {"data": [
    {"spl_version": 8, "published_date": "Jul 15, 2026",
     "title": "LIPITOR (ATORVASTATIN CALCIUM) TABLET, FILM COATED [VIATRIS SPECIALTY LLC]",
     "setid": VIATRIS_SETID},
    {"spl_version": 5, "published_date": "Aug 22, 2011",
     "title": "LIPITOR (ATORVASTATIN CALCIUM) TABLET, FILM COATED "
              "[PHYSICIANS TOTAL CARE, INC]",
     "setid": "10a7ba02-42d6-4cae-8904-b256e2da5496"},
    {"spl_version": 1, "published_date": "Jan 13, 2011",
     "title": "LIPITOR (ATORVASTATIN CALCIUM) TABLET, FILM COATED [REBEL DISTRIBUTORS CORP]",
     "setid": "a3c08a6d-f986-4efc-9f96-3f0e652704dc"},
], "metadata": {"db_published_date": "Sep 28, 2026 08:35:20PM EST",
                "elements_per_page": 100, "total_elements": 3, "total_pages": 1,
                "current_page": 1}}

EMPTY_INDEX = {"data": [], "metadata": {"total_elements": 0, "total_pages": 0}}

#: A real SPL document, cut down to the shape that matters: the document's own metadata
#: on its direct children, a section whose <text> holds <paragraph> and <list>
#: children, and a nested subsection.
LABEL_XML = f"""<?xml version="1.0" encoding="UTF-8"?>
<document xmlns="urn:hl7-org:v3">
  <id root="dd011a82"/>
  <code code="34391-3" codeSystem="2.16.840.1.113883.6.1" displayName="HUMAN PRESCRIPTION DRUG LABEL"/>
  <title>LIPITOR (atorvastatin calcium) tablets, for oral use</title>
  <effectiveTime value="20240415"/>
  <setId root="{VIATRIS_SETID}"/>
  <versionNumber value="8"/>
  <component><structuredBody>
    <component><section>
      <id root="d4e1b1"/>
      <code code="34067-9" codeSystem="2.16.840.1.113883.6.1" displayName="INDICATIONS &amp; USAGE SECTION"/>
      <title>1 INDICATIONS AND USAGE</title>
      <effectiveTime value="20240415"/>
      <text><paragraph>LIPITOR is indicated:</paragraph><list><item>To reduce the risk
        of myocardial infarction, stroke and revascularization procedures.</item>
        <item>To lower LDL cholesterol.</item></list></text>
    </section></component>
    <component><section>
      <id root="a2b3"/>
      <code code="34070-3" codeSystem="2.16.840.1.113883.6.1" displayName="CONTRAINDICATIONS SECTION"/>
      <title>4 CONTRAINDICATIONS</title>
      <effectiveTime value="20230101"/>
      <text><paragraph>LIPITOR is contraindicated in patients with an active liver
        disease, unexplained persistent elevations of transaminases, or hypersensitivity
        to any component of LIPITOR.</paragraph></text>
      <component><section>
        <code code="42229-5" codeSystem="2.16.840.1.113883.6.1" displayName="SPL UNCLASSIFIED SECTION"/>
        <title>4.1 Pregnancy</title>
        <text><paragraph>Pregnancy category X.</paragraph></text>
      </section></component>
    </section></component>
  </structuredBody></component>
</document>
"""


class FakeDailyMed:
    def __init__(self, index=None, xml=None, empty=False, fail=None):
        self.calls: list[dict] = []
        self.index = INDEX if index is None else index
        self.xml = LABEL_XML if xml is None else xml
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str, params: dict):
        self.calls.append({"url": url, "params": dict(params or {})})
        if self.fail == "dead":
            raise DrugLabelError("request failed: connection refused")
        if self.fail == "not_xml":
            return "<html>404 not found</html>"
        if url.endswith(".xml"):
            return self.xml
        if self.empty:
            return json.dumps(EMPTY_INDEX)
        return json.dumps(self.index)


def make_data(**kw):
    feed = FakeDailyMed(**kw)
    return DrugLabelData(fetch=feed, fetch_xml=feed), feed


class HelperTests(unittest.TestCase):
    def test_every_section_code_is_one_dailymed_really_publishes(self):
        #: 34067-9 INDICATIONS & USAGE and 34070-3 CONTRAINDICATIONS were both read out
        #: of the live LIPITOR label, and neither is a guess.
        self.assertEqual(SECTION_CODES["indications and usage"], "34067-9")
        self.assertEqual(SECTION_CODES["contraindications"], "34070-3")
        self.assertEqual(SECTION_CODES["warnings and precautions"], "43685-7")
        self.assertEqual(code_for_section("adverse reactions"), "34084-4")
        self.assertIsNone(code_for_section("a section that does not exist"))

    def test_a_section_is_found_however_it_is_spelled(self):
        self.assertEqual(section_from_text("adverse reactions"), "adverse reactions")
        self.assertEqual(section_from_text("adverse reaction"), "adverse reactions")
        self.assertEqual(section_from_text("what about drug interaction?"), "drug interactions")
        #: A word already ending in s must also match without it, or 'indicationss?'
        #: is what the pattern would be and 'indication' would never be found.
        self.assertEqual(section_from_text("indication and usage"), "indications and usage")
        self.assertIsNone(section_from_text("the weather in Kansas"))

    def test_the_label_wording_is_flattened_not_stripped_to_nothing(self):
        raw = ("<paragraph>Take one tablet.</paragraph><list><item>With or without food."
               "</item></list>")
        text = clean_text(raw)
        self.assertIn("Take one tablet.", text)
        self.assertIn("With or without food.", text)
        self.assertNotIn("<", text)
        #: DailyMed pretty-prints the label, so a line break can land mid-sentence and
        #: must not survive into the answer.
        self.assertEqual(clean_text("To reduce the risk\n of an event"), 
                         "To reduce the risk of an event")
        self.assertEqual(clean_text(""), "")

    def test_a_manufacturer_comes_out_of_the_bracket(self):
        self.assertEqual(manufacturer_from_title(
            "LIPITOR (ATORVASTATIN CALCIUM) TABLET [VIATRIS SPECIALTY LLC]"),
            "VIATRIS SPECIALTY LLC")
        self.assertIsNone(manufacturer_from_title("A LABEL WITH NO BRACKET"))
        self.assertIsNone(manufacturer_from_title(None))

    def test_the_drug_name_is_read_out_of_the_question(self):
        self.assertEqual(drug_from_text("show me the official label for LIPITOR"), "LIPITOR")
        self.assertEqual(
            drug_from_text("what does the LIPITOR label say about drug interactions?"),
            "LIPITOR")
        self.assertEqual(drug_from_text("LIPITOR adverse reactions"), "LIPITOR")
        self.assertEqual(drug_from_text("what is the LIPITOR indication and usage?"), "LIPITOR")
        self.assertEqual(labeler_from_text("labels from Pfizer"), "Pfizer")
        self.assertIsNone(labeler_from_text("labels from what"))


class ReadTests(unittest.TestCase):
    def test_the_index_says_who_filed_each_label(self):
        data, feed = make_data()
        found = data.search("LIPITOR")
        self.assertEqual(feed.calls[-1]["params"]["drug_name"], "LIPITOR")
        self.assertEqual(found["total_elements"], 3)
        self.assertEqual(found["returned"], 3)
        #: Newest first by the real date. A string sort would put 'Aug 22, 2011' after
        #: 'Jan 13, 2011', because the month name is not in date order.
        self.assertEqual([label["manufacturer"] for label in found["labels"]],
                         ["VIATRIS SPECIALTY LLC", "PHYSICIANS TOTAL CARE, INC",
                          "REBEL DISTRIBUTORS CORP"])
        self.assertEqual([label["published_date"] for label in found["labels"]],
                         ["Jul 15, 2026", "Aug 22, 2011", "Jan 13, 2011"])
        self.assertEqual(found["db_published"], "Sep 28, 2026 08:35:20PM EST")

    def test_a_manufacturer_search_sends_labeler_not_drug_name(self):
        data, feed = make_data()
        data.search("LIPITOR", labeler="Pfizer")
        self.assertEqual(feed.calls[-1]["params"]["labeler"], "Pfizer")
        self.assertNotIn("drug_name", feed.calls[-1]["params"])
        with self.assertRaises(ValueError):
            data.search("LIPITOR", labeler="x" * 200)

    def test_the_label_document_is_read_for_its_own_sections(self):
        data, feed = make_data()
        index = data.label_index(VIATRIS_SETID)
        self.assertTrue(feed.calls[-1]["url"].endswith(f"/spls/{VIATRIS_SETID}.xml"))
        self.assertEqual(index["effective_time"], "20240415")
        self.assertEqual(index["version"], "8")
        codes = [row["code"] for row in index["sections"]]
        self.assertIn("34067-9", codes)
        self.assertIn("34070-3", codes)

    def test_section_text_comes_out_of_the_nested_paragraphs(self):
        data, _feed = make_data()
        section = data.section(VIATRIS_SETID, "indications and usage")
        self.assertEqual(section["code"], "34067-9")
        self.assertEqual(section["display_name"], "INDICATIONS & USAGE SECTION")
        #: The words live in <paragraph> and <list> children, not in <text>.text.
        self.assertIn("LIPITOR is indicated", section["text"])
        self.assertIn("To reduce the risk of myocardial infarction", section["text"])
        self.assertIn("To lower LDL cholesterol", section["text"])
        self.assertNotIn("<", section["text"])

    def test_a_section_this_label_lacks_is_refused_with_what_it_has(self):
        data, _feed = make_data()
        with self.assertRaises(DrugLabelNotFound) as caught:
            data.section(VIATRIS_SETID, "drug interactions")
        self.assertIn("has no section matching 'drug interactions'", str(caught.exception))

    def test_a_section_carries_its_own_effective_date(self):
        data, _feed = make_data()
        #: This section was revised in 2023 while the label as a whole is 2024, and
        #: reporting the label's date for this text would be wrong.
        section = data.section(VIATRIS_SETID, "contraindications")
        self.assertEqual(section["section_effective_time"], "20230101")
        self.assertEqual(section["effective_time"], "20240415")

    def test_no_section_named_falls_back_to_the_front_matter(self):
        data, _feed = make_data()
        section = data.section(VIATRIS_SETID, None)
        self.assertIn(section["code"], {"34067-9", "34070-3"})

    def test_a_section_this_label_does_not_have_lists_what_it_does(self):
        data, _feed = make_data()
        with self.assertRaises(DrugLabelNotFound) as caught:
            data.section(VIATRIS_SETID, "mechanism of action")
        self.assertIn("has no section matching", str(caught.exception))
        self.assertIn("CONTRAINDICATIONS SECTION", str(caught.exception))

    def test_a_drug_nobody_makes_is_an_empty_list_not_an_error_page(self):
        data, _feed = make_data(empty=True)
        #: DailyMed answers HTTP 200 with data [] and total_elements 0.
        with self.assertRaises(DrugLabelNotFound) as caught:
            data.search("zzzznotadrug")
        self.assertIn("no drug label named", str(caught.exception))

    def test_a_label_that_is_not_readable_xml(self):
        data, _feed = make_data(fail="not_xml")
        with self.assertRaises(DrugLabelError):
            data.label_index(VIATRIS_SETID)

    def test_a_dead_dailymed(self):
        data, _feed = make_data(fail="dead")
        with self.assertRaises(DrugLabelError):
            data.search("LIPITOR")

    def test_a_search_needs_a_drug_or_a_maker(self):
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.search("   ")
        with self.assertRaises(ValueError):
            data.label_index("   ")


class RouteTests(unittest.TestCase):
    def test_the_plain_label_question(self):
        self.assertEqual(route("show me the official label for LIPITOR"),
                         ("dailymed-search", {"drug": "LIPITOR"}))

    def test_a_section_question(self):
        skill, params = route("what does the LIPITOR label say about drug interactions?")
        self.assertEqual(skill, "dailymed-section")
        self.assertEqual(params["drug"], "LIPITOR")
        self.assertEqual(params["section"], "drug interactions")
        self.assertEqual(route("LIPITOR adverse reactions")[0], "dailymed-section")
        self.assertEqual(route("what is the LIPITOR indication and usage?")[0], "dailymed-section")

    def test_a_contents_question(self):
        self.assertEqual(route("what sections are in the label for ELIQUIS?"),
                         ("dailymed-sections", {"drug": "ELIQUIS"}))

    def test_a_manufacturer_search(self):
        self.assertEqual(route("labels from Pfizer"),
                         ("dailymed-search", {"labeler": "Pfizer"}))

    def test_a_comparison_question(self):
        skill, params = route("compare the LIPITOR labels across manufacturers")
        self.assertEqual(skill, "dailymed-compare")
        self.assertEqual(params["drug"], "LIPITOR")
        self.assertEqual(route("how do the LIPITOR labels differ from each other?")[0],
                         "dailymed-compare")

    def test_help_and_nonsense(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("what is the weather in Kansas?")[0], "help")


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
        from agent import DailymedAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = DailymedAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_free_answer_names_every_manufacturer(self):
        result, client, _ = self.turn("show me the official label for LIPITOR")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("DailyMed drug labels named 'LIPITOR': 3 of 3", result["text"])
        self.assertIn("VIATRIS SPECIALTY LLC, published Jul 15, 2026, version 8", result["text"])
        self.assertIn("3 manufacturer(s) file this drug", result["text"])
        self.assertIn("not medical advice", result["text"])

    def test_a_section_answer_prints_the_labels_own_wording(self):
        #: This fixture label carries INDICATIONS and CONTRAINDICATIONS, so the
        #: section asked for has to be one it really has.
        result, _, _ = self.turn("LIPITOR contraindications")
        self.assertIn("CONTRAINDICATIONS SECTION  (34070-3)", result["text"])
        self.assertIn("this section is effective 20230101, the label as a whole 20240415",
                      result["text"])
        self.assertIn("LIPITOR is contraindicated in patients with an active liver",
                      result["text"])
        self.assertNotIn("<paragraph>", result["text"])
        self.assertIn("not medical advice", result["text"])

    def test_a_contents_answer(self):
        result, _, _ = self.turn("what sections are in the label for LIPITOR?")
        self.assertIn("section(s) in the label", result["text"])
        self.assertIn("INDICATIONS & USAGE SECTION", result["text"])
        self.assertIn("CONTRAINDICATIONS SECTION", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("official FDA drug labels", result["text"])
        self.assertIn("not a summary", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("show me the official label for LIPITOR", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_dailymed(self):
        result, _, _ = self.turn("show me the official label for LIPITOR", fail="dead")
        self.assertIn("I could not read DailyMed's labels", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `dailymed_label_comparison_board` answers for LIPITOR.
COMPARE_DATA = {
    "drug": "LIPITOR",
    "labels_compared": 3,
    "sections_compared": 41,
    "labels": [
        {"manufacturer": "VIATRIS SPECIALTY LLC", "setid": VIATRIS_SETID,
         "published_date": "Jul 15, 2026", "version": "8", "section_count": 68,
         "total_chars": 125663},
        {"manufacturer": "PHYSICIANS TOTAL CARE, INC",
         "setid": "10a7ba02-42d6-4cae-8904-b256e2da5496",
         "published_date": "Aug 22, 2011", "version": "5", "section_count": 62,
         "total_chars": 98311},
    ],
    "differing_sections": [
        {"name": "WARNINGS AND PRECAUTIONS SECTION", "code": "43685-7", "labels_with_it": 3,
         "chars_by_label": [21000, 17000, 17000]},
        {"name": "CLINICAL STUDIES SECTION", "code": "43692-7", "labels_with_it": 2,
         "chars_by_label": [30000, 0]},
    ],
    "sections_in_one_label_only": ["RISKS", "PACKAGE LABEL.PRINCIPAL DISPLAY PANEL"],
    "approvals_read": 3,
    "source": "DailyMed drug labels (dailymed.nlm.nih.gov)",
}

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
