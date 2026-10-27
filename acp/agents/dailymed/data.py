"""The official FDA drug labels on DailyMed, keyless.

Verified live on 2026-09-28:

  .../services/v2/spls.json?drug_name=LIPITOR
      -> HTTP 200, 3 labels; data[0] = {spl_version 8, published_date 'Jul 15, 2026',
         title 'LIPITOR (ATORVASTATIN CALCIUM) TABLET, FILM COATED [VIATRIS SPECIALTY LLC]',
         setid 'a60cc18b-0631-4cf0-b021-9f52224ece65'}
      -> metadata: db_published_date 'Sep 28, 2026 08:35:20PM EST', total_elements 3,
         total_pages 1
  .../services/v2/spls.json?labeler=pfizer&pagesize=3
      -> HTTP 200, 3 of total_elements 109
  .../services/v2/spls.json?drug_name=zzzznotadrug
      -> HTTP 200, data [] and total_elements 0. A drug nobody makes is an empty list,
         not an error status, so it is reported as 'no label', not as a failure.
  .../services/v2/spls/a60cc18b-0631-4cf0-b021-9f52224ece65.json
      -> HTTP 415 Unsupported Media Type. The v2 JSON form of a single label is retired.
  .../services/v2/spls/a60cc18b-0631-4cf0-b021-9f52224ece65.xml
      -> HTTP 200, 362871 bytes of HL7 v3 XML, namespace urn:hl7-org:v3, 68 <section>
         elements, each with a LOINC <code code= displayName=> and a <title>:
         34067-9 INDICATIONS & USAGE SECTION, 43678-2 DOSAGE FORMS & STRENGTHS
         SECTION, 34070-3 CONTRAINDICATIONS SECTION, 43685-7 WARNINGS AND PRECAUTIONS
         SECTION, plus 42229-5 SPL UNCLASSIFIED SECTION subsections like '2.1 Important
         Dosage Information'

Two things the payloads make plain and this reader keeps. **A drug name can have many
labels**: LIPITOR alone has three here, one per manufacturer, and they are not
interchangeable, so an answer says which manufacturer's label it is reading rather than
picking one silently. And **the label itself is XML, not JSON**, so the section list and
the section text come out of the same parsed document rather than from a second
convenient endpoint that might not agree with it.
"""

from __future__ import annotations

import datetime
import json
import os
import re
import time
import xml.etree.ElementTree as ElementTree
from urllib import parse, request
from urllib.error import HTTPError

SPLS_URL = "https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json"

#: One label is XML, not JSON: the v2 JSON form of a single label is retired with
#: HTTP 415, while `<SPL_URL>/<setid>.xml` answers HTTP 200 with the whole label.
SPL_URL = "https://dailymed.nlm.nih.gov/dailymed/services/v2/spls"

DATASET = "DailyMed drug labels (dailymed.nlm.nih.gov)"

DEFAULT_USER_AGENT = "awesome-acps-dailymed/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: The HL7 v3 namespace every SPL document declares.
SPL_NS = {"v3": "urn:hl7-org:v3"}

#: The label sections an editor asks for by name, mapped onto the LOINC codes DailyMed
#: really publishes. Every code here was read out of the live LIPITOR label on
#: 2026-09-28, which carried 68 <section> elements over 31 distinct codes - nothing here
#: is guessed. A code DailyMed does not use is answered by searching the label's own
#: section list instead, so an unusual label still works.
SECTION_CODES = {
    "indications and usage": "34067-9",
    "dosage and administration": "34068-7",
    "how supplied": "34069-5",
    "contraindications": "34070-3",
    "drug interactions": "34073-7",
    "information for patients": "34076-0",
    "adverse reactions": "34084-4",
    "overdosage": "34088-5",
    "description": "34089-3",
    "clinical pharmacology": "34090-1",
    "clinical studies": "34092-7",
    "pregnancy": "42228-7",
    "patient package insert": "42230-3",
    "dosage forms and strengths": "43678-2",
    "mechanism of action": "43679-0",
    "nonclinical toxicology": "43680-8",
    "use in specific populations": "43684-0",
    "warnings and precautions": "43685-7",
    "lactation": "77290-5",
    "pediatric use": "34081-0",
    "geriatric use": "34082-8",
    "carcinogenesis mutagenesis and impairment of fertility": "34083-6",
    "pharmacodynamics": "43681-6",
    "pharmacokinetics": "43682-4",
}

#: The section that carries the label's own front matter, used when a question names
#: no section at all.
PRODUCT_DATA_CODE = "48780-1"

#: What a section answer will print at most, so a 200-page label cannot flood a turn.
MAX_TEXT_CHARS = 6000

#: DailyMed's own page for a label, built from its setid.
DRUGLAB_URL = "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid="


class DrugLabelError(RuntimeError):
    """DailyMed could not be read."""


class DrugLabelNotFound(DrugLabelError):
    """DailyMed answered, and holds no such label - a real 'nothing here'."""


def clean_text(raw: str) -> str:
    """An SPL section's text with the embedded XHTML flattened to plain prose.

    The label is XHTML inside XML and DailyMed pretty-prints it, so a line break can
    land in the middle of a sentence. Block tags therefore become a space rather than
    a newline, and every run of whitespace collapses to one space - which is what keeps
    'To reduce the risk\\n of myocardial infarction' from reading as two lines.
    """
    if not raw:
        return ""
    text = re.sub(r"<(br|BR)\s*/?>", " ", raw)
    text = re.sub(r"</(p|div|li|tr|td|th|h\d|caption|item)>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = (text.replace("&nbsp;", " ").replace("&amp;", "&")
                .replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"'))
    return re.sub(r"\s+", " ", text).strip()


def phrase_pattern(words) -> str:
    """Several phrases as one regex, with a plural `s` added where one is missing.

    Longest first, so a phrase that starts with a shorter one - 'drug
    interactions' against 'drug' - cannot be pre-empted by it.
    """
    return r"\b(?:" + "|".join(_wordy(word) for word in
                            sorted(words, key=len, reverse=True)) + r")\b"


def _wordy(phrase: str) -> str:
    """One phrase as a regex that accepts either number for each word.

    A word that already ends in `s` is matched with *or without* it, and a word that
    does not is matched with an `s?`, so 'indications and usage', 'indication and
    usage' and 'indications and usages' all reach the same section. Appending `s?`
    blindly would give 'indicationss?', which matches neither.
    """
    parts = []
    for piece in phrase.split():
        if piece.endswith("s"):
            parts.append(f"(?:{re.escape(piece)}|{re.escape(piece[:-1])})")
        else:
            parts.append(f"{re.escape(piece)}s?")
    return r"\s+".join(parts)


#: The section names as one pattern, longest first so 'drug interactions' wins over a
#: shorter entry that is a prefix of it.
SECTION_PATTERN = re.compile(phrase_pattern(SECTION_CODES), re.IGNORECASE)


def _stem(phrase: str) -> str:
    """A phrase with each trailing plural `s` removed, for a forgiving lookup."""
    return " ".join(re.sub(r"s$", "", word) for word in str(phrase or "").lower().split())


#: Stemmed phrase -> the canonical key, so a match maps back to one exact name.
SECTION_BY_STEM = {_stem(name): name for name in SECTION_CODES}


def section_from_text(text: str) -> str | None:
    """The canonical section name a question asks for, or None.

    'indication and usage' comes back as 'indications and usage' - the key DailyMed
    actually uses - because the mapping is on stems.
    """
    found = SECTION_PATTERN.search(str(text or ""))
    if not found:
        return None
    return SECTION_BY_STEM.get(_stem(found.group(0)))


def code_for_section(name: str) -> str | None:
    """The LOINC code for a section, accepting a singular or plural spelling."""
    if not name:
        return None
    return SECTION_CODES.get(str(name).strip().lower()) or SECTION_CODES.get(
        _stem(name))


class DrugLabelData:
    """DailyMed's label index and the labels themselves."""

    def __init__(self, fetch=None, fetch_xml=None, cache_ttl: float = 3600.0,
                 timeout: float = 60.0, user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("DAILYMED_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("DAILYMED_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("DAILYMED_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http_text
        #: A label is 300 KB+ of XML, so it gets its own transport hook and a longer
        #: cache than the index.
        self._fetch_xml = fetch_xml or self._http_text
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_text(self, url: str, params: dict | None = None) -> str:
        query = f"{url}?{parse.urlencode(params, doseq=True)}" if params else url
        req = request.Request(query, headers={"User-Agent": self.user_agent, "Accept": "*/*"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except HTTPError as exc:
            raise DrugLabelNotFound(f"request failed: HTTP {exc.code}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise DrugLabelError(f"request failed: {exc}") from exc

    def _load_json(self, params: dict) -> dict:
        key = f"{SPLS_URL}?{parse.urlencode(params, doseq=True)}"
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(SPLS_URL, params)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise DrugLabelError(
                    f"DailyMed returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, dict):
            raise DrugLabelError("DailyMed returned an unexpected payload")
        self._cache[key] = (now + self.cache_ttl, payload)
        return payload

    # -- index -------------------------------------------------------------

    def search(self, drug_name: str, labeler: str | None = None, page: int = 1,
               pagesize: int = 100) -> dict:
        """Every label DailyMed holds for a drug name, newest first."""
        name = str(drug_name or "").strip()
        if not name:
            raise ValueError("tell me which drug, for example LIPITOR")
        wanted_labeler = str(labeler).strip() if labeler else None
        if wanted_labeler and len(wanted_labeler) > 80:
            raise ValueError("a manufacturer name is at most 80 characters")
        number = max(1, min(int(page), 50))
        limit = max(1, min(int(pagesize), 100))
        params: dict = {"pagesize": str(limit)}
        if wanted_labeler:
            params["labeler"] = wanted_labeler
        else:
            params["drug_name"] = name
        if number > 1:
            params["page"] = str(number)

        payload = self._load_json(params)
        metadata = payload.get("metadata") or {}
        rows = []
        for entry in payload.get("data") or []:
            if not isinstance(entry, dict):
                continue
            setid = str(entry.get("setid") or "").strip()
            if not setid:
                continue
            rows.append({"setid": setid,
                         "title": entry.get("title"),
                         "spl_version": entry.get("spl_version"),
                         "published_date": entry.get("published_date"),
                         "manufacturer": manufacturer_from_title(entry.get("title")),
                         "url": f"{DRUGLAB_URL}{parse.quote(setid)}"})
        try:
            total = int(metadata.get("total_elements"))
        except (TypeError, ValueError):
            total = None
        if not rows:
            what = f"held by {wanted_labeler!r}" if wanted_labeler else f"named {name!r}"
            raise DrugLabelNotFound(
                f"DailyMed has no drug label {what}"
                + (f" (it holds {total} label(s) in all)" if total else ""))
        #: Newest first, by the real date. DailyMed writes 'Jul 15, 2026', so sorting
        #: these as strings puts 'Aug 22, 2011' after 'Jan 13, 2011' for the same
        #: year - the month name is not in date order.
        rows.sort(key=lambda row: (published_on(row.get("published_date")) or datetime.date.min,
                                   str(row.get("published_date") or "")), reverse=True)
        return {"query": name, "labeler": wanted_labeler, "labels": rows,
                "returned": len(rows), "total_elements": total,
                "page": number, "pagesize": limit,
                "db_published": metadata.get("db_published_date"),
                "source": DATASET}

    def label_index(self, setid: str) -> dict:
        """A label's own table of contents, from the label document itself."""
        ident = str(setid or "").strip()
        if not ident:
            raise ValueError("tell me which label's setid, for example "
                             "a60cc18b-0631-4cf0-b021-9f52224ece65")
        document = self._load_xml(ident)
        sections = []
        for element in document.iter():
            if not element.tag.endswith("}section") and element.tag != "section":
                continue
            code_element = element.find("v3:code", SPL_NS)
            title_element = element.find("v3:title", SPL_NS)
            section_time = element.find("v3:effectiveTime", SPL_NS)
            #: A section's <text> holds <paragraph>, <list> and <item> children, so
            #: reading node.text alone returns only the whitespace before the first
            #: child. itertext() is what actually holds the label's wording.
            texts = [clean_text("".join(node.itertext()))
                     for node in element.findall(".//v3:text", SPL_NS)]
            body = "\n".join(part for part in texts if part)
            display = (code_element.get("displayName") if code_element is not None else None)
            heading = clean_text(title_element.text) if title_element is not None else ""
            if not (display or heading or body):
                continue
            sections.append({
                "code": code_element.get("code") if code_element is not None else None,
                "display_name": (display or "").strip() or None,
                "title": heading.strip() or None,
                "effective_time": (section_time.get("value")
                                   if section_time is not None else None),
                "chars": len(body),
                "text": body,
            })
        if not sections:
            raise DrugLabelNotFound(
                f"DailyMed's label {ident} has no readable sections")
        #: The label's own metadata is on the document's *direct* children. Reading
        #: `.//v3:effectiveTime` would return a section's date instead, and on a partly
        #: revised label the two are not the same number.
        title_element = document.find("v3:title", SPL_NS)
        effective = document.find("v3:effectiveTime", SPL_NS)
        version = document.find("v3:versionNumber", SPL_NS)
        return {"setid": ident, "title": clean_text(title_element.text)
                if title_element is not None else None,
                "effective_time": effective.get("value") if effective is not None else None,
                "version": version.get("value") if version is not None else None,
                "sections": sections,
                "section_count": len(sections),
                "total_chars": sum(row["chars"] for row in sections),
                "url": f"{DRUGLAB_URL}{parse.quote(ident)}",
                "source": DATASET}

    def section(self, setid: str, name: str | None = None) -> dict:
        """One section of a label, chosen by its LOINC code or by the section list."""
        index = self.label_index(setid)
        wanted_code = code_for_section(name) if name else None
        chosen = None
        for row in index["sections"]:
            if wanted_code and row["code"] == wanted_code:
                chosen = row
                break
        if chosen is None and name:
            needle = re.sub(r"[^a-z0-9 ]+", " ", str(name).lower()).strip()
            for row in index["sections"]:
                for field in (row["display_name"], row["title"]):
                    if field and needle in re.sub(r"[^a-z0-9 ]+", " ", field.lower()):
                        chosen = row
                        break
                if chosen:
                    break
        if chosen is None and wanted_code is None:
            #: No section named: the label's own front matter is the useful default.
            for row in index["sections"]:
                if row["code"] == PRODUCT_DATA_CODE or (row["title"] or "").strip():
                    chosen = row
                    break
        if chosen is None:
            names = sorted({row["display_name"] or row["title"] or "untitled"
                            for row in index["sections"]})
            raise DrugLabelNotFound(
                f"that label has no section matching {name!r}. Its sections are: "
                + "; ".join(names[:20]))
        text = chosen.get("text") or ""
        return {"setid": index["setid"], "label_title": index["title"],
                "effective_time": index["effective_time"],
                "label_version": index.get("version"),
                "code": chosen["code"], "display_name": chosen["display_name"],
                "section_title": chosen["title"],
                #: A section revised on its own carries its own date, which is the one
                #: that matters for this text.
                "section_effective_time": chosen.get("effective_time"),
                "chars": len(text),
                "truncated": len(text) > MAX_TEXT_CHARS,
                "text": text[:MAX_TEXT_CHARS],
                "section_count": index["section_count"],
                "sections": [{"code": row["code"], "display_name": row["display_name"],
                              "title": row["title"], "chars": row["chars"]}
                             for row in index["sections"]],
                "url": index["url"], "source": DATASET}

    # -- shaping -----------------------------------------------------------

    def _load_xml(self, setid: str) -> ElementTree.Element:
        key = f"xml:{setid}"
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        raw = self._fetch_xml(f"{SPL_URL}/{parse.quote(setid)}.xml", {})
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8", "replace")
        try:
            document = ElementTree.fromstring(str(raw or ""))
        except ElementTree.ParseError as exc:
            raise DrugLabelError(
                f"DailyMed's label {setid} is not readable XML: {exc}") from exc
        self._cache[key] = (now + 86400.0, document)
        return document


def manufacturer_from_title(title) -> str | None:
    """The manufacturer from a label title, which ends in a bracketed name."""
    if not title:
        return None
    match = re.search(r"\[([^\[\]]+)\]\s*$", str(title))
    return match.group(1).strip() if match else None


def published_on(value) -> datetime.date | None:
    """DailyMed's 'Jul 15, 2026' date, as a real date."""
    try:
        return datetime.datetime.strptime(str(value or "").strip(), "%b %d, %Y").date()
    except (TypeError, ValueError):
        return None
