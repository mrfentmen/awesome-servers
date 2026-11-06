#!/usr/bin/env python3
"""
analysis-mcp — offline artifact analysis for security assessment.

Pure text transformation. NO network access, no scope surface, no third-party
dependencies. Everything here runs on bytes the operator already has.

  extract_endpoints  JS bundle -> endpoints, auth headers, object IDs, secrets
  diff_responses     two HTTP responses -> exactly what differs
  jwt_decode         JWT -> header/payload, algorithm and expiry triage
  parse_burp         Burp project XML -> hosts, requests, findings surface

Zero dependencies.
"""

import base64
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from difflib import unified_diff

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# resolved from this file's location, so the whole stack can live
# anywhere and still find its data
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

from mcp_lib import Server  # noqa: E402


# ------------------------------------------------------- extract_endpoints

FETCH = re.compile(
    r"""(?:fetch|axios\.(?:get|post|put|patch|delete|request)|\$\.(?:get|post|ajax))"""
    r"""\s*\(\s*[`'"]([^`'"]{3,200})[`'"]""", re.I)
XHR = re.compile(r"""\.open\(\s*["'](GET|POST|PUT|DELETE|PATCH)["']\s*,\s*["']([^"']+)""", re.I)
ABS_URL = re.compile(r"""["'`](https?://[a-zA-Z0-9._-]+\.[a-z]{2,}[^"'`\s]{0,150})["'`]""")
GRAPHQL = re.compile(r"""(?:query|mutation)\s+([A-Za-z_]\w*)\s*(?:\([^)]*\))?\s*\{""")
UUID_LITERAL = re.compile(r"""\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b""", re.I)
ROUTE_PARAM = re.compile(r"""/([a-zA-Z][\w-]*)/([:{}][\w{}$.-]{1,24})""")

SECRET_PATTERNS = [
    (r"\bAKIA[0-9A-Z]{16}\b", "AWS access key id", "critical"),
    (r"\bgh[pousr]_[A-Za-z0-9]{30,}\b", "GitHub token", "critical"),
    (r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b", "Slack token", "critical"),
    (r"\bsk-[A-Za-z0-9]{20,}\b", "OpenAI-style API key", "critical"),
    (r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b", "hardcoded JWT", "high"),
    (r"-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----", "private key", "critical"),
    (r"""(?i)\b(?:api[_-]?key|apikey|secret|passwd|password|token|auth)\b\s*[:=]\s*"""
     r"""["']([^"']{12,120})["']""", "hardcoded credential assignment", "high"),
    (r"""(?i)\bAuthorization\b\s*:\s*["'](?:Bearer|Basic)\s+([A-Za-z0-9._~+/=-]{16,})["']""",
     "hardcoded Authorization header", "high"),
]

ID_PARAM_NAMES = {"id", "uid", "user_id", "userId", "account_id", "order_id",
                  "orderId", "uuid", "ref", "token", "invoice", "invoice_id",
                  "project_id", "org_id", "tenant", "member_id", "record_id"}


def extract_endpoints(source, min_length=200, redact_secrets=True):
    """Mine a JS/TS bundle for API surface and hardcoded secrets."""
    if len(source) > 4_000_000:
        source = source[:4_000_000] + "\n...[truncated at 4MB]"
    lines = source.splitlines()

    hits = []          # (line_no, kind, value)
    for i, line in enumerate(lines, 1):
        for m in FETCH.finditer(line):
            hits.append((i, "fetch", m.group(1)))
        for m in XHR.finditer(line):
            hits.append((i, "xhr:" + m.group(1).upper(), m.group(2)))
        for m in GRAPHQL.finditer(line):
            hits.append((i, "graphql", m.group(1)))

    paths = {}
    for ln, kind, val in hits:
        v = val.split("?")[0].rstrip("/")
        if v.startswith("/") and len(v) > 2:
            paths.setdefault((v, kind), ln)

    abs_hosts = sorted({m.group(1) for m in ABS_URL.finditer(source)})

    secrets = []
    for pat, label, sev in SECRET_PATTERNS:
        for m in re.finditer(pat, source):
            ln = source[:m.start()].count("\n") + 1
            val = m.group(1) if m.groups() else m.group(0)
            shown = val
            if redact_secrets:
                shown = (val[:4] + "…" + val[-4:]) if len(val) > 10 else "…"
            secrets.append((sev, label, ln, shown))

    ids = []
    for m in UUID_LITERAL.finditer(source):
        ids.append(("uuid", m.group(0), source[:m.start()].count("\n") + 1))
    for ln, line in enumerate(lines, 1):
        for m in re.finditer(
                r"""(?i)["'`](/?[^"'`\s]{0,60}?\b(%s)\b[^"'`\s]{0,40})["'`]"""
                % "|".join(sorted(ID_PARAM_NAMES)), line):
            ids.append(("param", m.group(2).lower(), ln))
    for ln, line in enumerate(lines, 1):
        for m in ROUTE_PARAM.finditer(line):
            if m.group(2).lower().strip("{}:$") in ID_PARAM_NAMES:
                ids.append(("route", "%s/%s" % (m.group(1), m.group(2)), ln))

    out = ["EXTRACT — %d endpoint patterns, %d absolute URLs, %d ids, %d secrets"
           % (len(paths), len(abs_hosts), len(ids), len(secrets)), ""]

    out.append("== API PATHS ==")
    for (p, kind), ln in sorted(paths.items())[:60]:
        out.append("  L%-6d %-8s %s" % (ln, kind, p))
    if not paths:
        out.append("  (none)")

    out.append("\n== ABSOLUTE URLS (external services) ==")
    for u in abs_hosts[:25]:
        host = re.sub(r"^https?://", "", u).split("/")[0]
        out.append("  %s" % host)
        if not host.endswith((".localhost", "127.0.0.1")):
            out.append("      ^ likely THIRD PARTY - record as oob lead, do not test")

    out.append("\n== OBJECT IDENTIFIERS (authz test candidates) ==")
    seen = set()
    for kind, val, ln in ids[:40]:
        k = (kind, val)
        if k in seen:
            continue
        seen.add(k)
        out.append("  L%-6d %-6s %s" % (ln, kind, val))
    if not ids:
        out.append("  (none)")

    out.append("\n== HARDCODED SECRETS ==")
    if not secrets:
        out.append("  (none found)")
    for sev, label, ln, shown in sorted(secrets, key=lambda s: s[0])[:20]:
        out.append("  [%s] %-32s L%-6d %s" % (sev, label, ln, shown))
    if secrets:
        out.append("\n  Verify each is LIVE and in scope before reporting. A dead key")
        out.append("  in a public repo is still a real finding, but say which.")
    return "\n".join(out)


# ----------------------------------------------------------- diff_responses

HEADER_RE = re.compile(r"^([A-Za-z0-9-]+)\s*:\s*(.*)$")


def _split(resp):
    parts = resp.replace("\r\n", "\n").split("\n\n", 1)
    head = parts[0]
    body = parts[1] if len(parts) > 1 else ""
    headers, status = {}, head.split("\n")[0].strip() if head else ""
    for line in head.split("\n")[1:]:
        m = HEADER_RE.match(line.strip())
        if m:
            headers[m.group(1).lower()] = m.group(2).strip()
    return status, headers, body


def diff_responses(response_a, response_b, label_a="A", label_b="B",
                   redact_patterns="", ignore_headers="date,server,set-cookie,content-length,connection,keep-alive,x-powered-by",
                   comparison="cross-identity"):
    """Diff two HTTP responses. This is how an IDOR gets proven: the ONLY thing
    that should differ is the object you were not authorised to read."""
    sa, ha, ba = _split(response_a)
    sb, hb, bb = _split(response_b)

    ignore = {h.strip().lower() for h in ignore_headers.split(",") if h.strip()}
    redactions = [p for p in redact_patterns.split(",") if p.strip()]

    def red(s):
        for p in redactions:
            s = re.sub(p, "[REDACTED]", s)
        return s

    out = ["RESPONSE DIFF  %s vs %s" % (label_a, label_b), "=" * 46, ""]
    out.append("status:   %s   vs   %s" % (sa or "-", sb or "-"))
    same_status = (sa == sb)
    out.append("          %s" % ("IDENTICAL" if same_status else "*** DIFFERS ***"))

    ka = {k: v for k, v in ha.items() if k not in ignore}
    kb = {k: v for k, v in hb.items() if k not in ignore}
    only_a = sorted(set(ka) - set(kb))
    only_b = sorted(set(kb) - set(ka))
    changed = sorted(k for k in set(ka) & set(kb) if ka[k] != kb[k])

    out.append("\n-- headers only in %s: %s" % (label_a, ", ".join(only_a) or "none"))
    out.append("-- headers only in %s: %s" % (label_b, ", ".join(only_b) or "none"))
    out.append("-- headers changed:         %s" % (", ".join(changed) or "none"))
    for k in changed:
        out.append("     %-22s %s" % (k, red("%s -> %s" % (ka[k][:60], kb[k][:60]))))

    out.append("\n-- body --")
    if ba == bb:
        out.append("bodies IDENTICAL (%d bytes). If you expected different data, this" % len(ba))
        out.append("is NOT an authorization break - check for caching before concluding.")
    else:
        da = [red(x) for x in ba.splitlines()]
        db = [red(x) for x in bb.splitlines()]
        d = list(unified_diff(da, db, label_a, label_b, lineterm="", n=1))
        out.extend(d[:80] if d else ["(diff produced no lines despite differing bytes)"])

    out.append("\n-- interpretation --")
    cross = comparison == "cross-identity"

    if not cross:
        # Same identity, two requests. Identical is expected.
        if same_status and ba != bb:
            out.append("SAME identity, different content. Expected if different objects")
            out.append("were requested. Not an authz signal on its own.")
        elif not same_status:
            out.append("SAME identity, status differs. Establish WHY - a 403 here may mean")
            out.append("the control is WORKING.")
        else:
            out.append("SAME identity, identical responses. Consistent with caching or a")
            out.append("deterministic response. NOT evidence either way.")

    else:
        # Two DIFFERENT identities, same request. This is the IDOR shape.
        if same_status and ba == bb:
            out.append("*** CROSS-IDENTITY: IDENTICAL RESPONSES ***")
            out.append("Two different accounts received byte-identical data for the same")
            out.append("request. A correctly scoped endpoint would return DIFFERENT data")
            out.append("per account - each user their own objects.")
            out.append("")
            out.append("Identical-across-identities is the IDOR shape, NOT the absence of")
            out.append("one. Before calling it, rule out only these:")
            out.append("  - caching (repeat the request; vary a cache-buster param)")
            out.append("  - the data genuinely being public / not user-owned")
            out.append("  - both accounts resolving to the same underlying principal")
            out.append("If none apply: BROKEN OBJECT LEVEL AUTHORIZATION. Verify the")
            out.append("response does NOT contain the requesting account's OWN objects -")
            out.append("that absence is what proves it is other people's data.")
        elif not same_status:
            out.append("CROSS-IDENTITY: status differs. A 403 for the other account means")
            out.append("the control is WORKING. Establish the direction before concluding.")
        else:
            out.append("CROSS-IDENTITY: different content per account. Consistent with")
            out.append("correct per-user scoping. Check the objects belong to each requester")
            out.append("before calling it a finding either way.")

    out.append("Reminder: run the fp-check gate before this becomes a report.")
    return "\n".join(out)


# --------------------------------------------------------------- jwt_decode

def _b64d(seg):
    seg = seg + "=" * (-len(seg) % 4)
    return base64.urlsafe_b64decode(seg.encode())


def jwt_decode(token):
    """Decode a JWT and triage the algorithm, expiry and claim contents."""
    parts = token.strip().split(".")
    if len(parts) != 3:
        return ("not a JWT: expected 3 dot-separated segments, got %d\n%s"
                % (len(parts),
                   "If this is opaque, look for 'Bearer ' prefix or check if it is a session ID."))

    out = []
    try:
        hdr = json.loads(_b64d(parts[0]))
        out.append("HEADER:\n" + json.dumps(hdr, indent=2))
    except Exception as e:
        return "header is not valid base64url JSON: %s" % e

    try:
        pay = json.loads(_b64d(parts[1]))
        out.append("\nPAYLOAD:\n" + json.dumps(pay, indent=2))
    except Exception as e:
        return "\n".join(out) + "\n\npayload is not valid base64url JSON: %s" % e

    sig_present = bool(parts[2].strip())
    out.append("\nSIGNATURE: %s" % ("present (%d chars, NOT verified - "
                                     "decoding does not prove validity)" % len(parts[2])
                                     if sig_present else "*** EMPTY ***"))

    findings = []
    alg = str(hdr.get("alg", "")).lower()
    if alg == "none":
        findings.append(("CRITICAL", "alg=none - signature is not even checked. "
                                     "Test: strip the third segment, re-request."))
    elif alg.startswith("hs"):
        findings.append(("MEDIUM", "HMAC (%s) - check the server verifies against the "
                                   "PUBLIC key, or alg confusion is possible." % alg))
    elif alg.startswith("rs"):
        findings.append(("INFO", "RSA (%s) - confirm the server pins the algorithm "
                                 "rather than trusting the header." % alg))

    import time
    now = int(time.time())
    if "exp" in pay:
        delta = int(pay["exp"]) - now
        if delta < 0:
            findings.append(("INFO", "EXPIRED %d days ago." % (-delta // 86400)))
        elif delta < 3600:
            findings.append(("INFO", "expires in %d minutes" % (delta // 60)))
        else:
            findings.append(("INFO", "valid for %d hours" % (delta // 3600)))
    else:
        findings.append(("HIGH", "NO exp claim - token never expires"))

    for k in ("sub", "role", "roles", "admin", "is_admin", "scope", "aud", "iss"):
        if k in pay:
            v = pay[k]
            findings.append(("INFO", "claim '%s' = %s%s" % (
                k, v, "  <-- client-controlled field, test tampering" if k in
                ("role", "roles", "admin", "is_admin", "scope") else "")))

    out.append("\nTRIAGE:")
    for sev, msg in findings:
        out.append("  [%s] %s" % (sev, msg))
    out.append("\nNote: decoding proves nothing about validity. You need a live")
    out.append("request to test whether the server enforces the signature.")
    return "\n".join(out)


# ------------------------------------------------------------- parse_burp

def parse_burp(path, max_items=80):
    """Extract hosts, methods and notable requests from a Burp XML export."""
    if not os.path.exists(path):
        return "no such file: %s" % path
    if os.path.getsize(path) > 60_000_000:
        return "file too large (>60MB). Re-export with a request filter."
    try:
        root = ET.parse(path).getroot()
    except ET.ParseError as e:
        return ("not parseable as Burp XML: %s\nIf you exported JSON instead, "
                "convert it first." % e)
    except Exception as e:
        return "error: %s" % e

    items = root.findall(".//item")
    hosts, methods, interesting = {}, {}, []

    for it in items:
        for ep in it.findall("endpoint"):
            hosts[ep.text] = hosts.get(ep.text, 0) + 1
        m = it.findtext("method")
        u = it.findtext("url") or ""
        resp = it.findtext("response") or ""
        status = it.findtext("status") or "?"
        if m:
            methods[m] = methods.get(m, 0) + 1
        low = u.lower()
        if any(s in low for s in ("/admin", "/api/", "/graphql", "/login", "/auth",
                                  "/token", "/.env", "/.git", "/swagger", "/internal")):
            interesting.append((m or "?", status, u, len(resp)))

    out = ["BURP EXPORT — %d items" % len(items), ""]
    out.append("== HOSTS (%d) ==" % len(hosts))
    for h, n in sorted(hosts.items(), key=lambda x: -x[1])[:30]:
        out.append("  %-45s %d" % (h, n))
    out.append("\n== METHODS ==")
    out.append("  " + ", ".join("%s:%d" % (k, v) for k, v in sorted(methods.items())))
    out.append("\n== INTERESTING REQUESTS (%d) ==" % len(interesting))
    for m, st, u, rl in interesting[:max_items]:
        out.append("  %-6s %-4s %-8d %s" % (m, st, rl, u))
    out.append("\nUse these as the starting surface map. Feed the bundle URLs to")
    out.append("extract_endpoints, and the auth'd vs unauth'd pairs to diff_responses.")
    return "\n".join(out)



# ------------------------------------------------------------ corpus_search

REFS = os.environ.get("CORPUS_DIR") or os.path.join(_ROOT, "engagement", "references")
_INDEX = None
MAX_FILE_BYTES = 2_000_000


def _index():
    """Walk the references tree once. Cache: (path, relpath, lowercase text)."""
    global _INDEX
    if _INDEX is not None:
        return _INDEX
    idx = []
    if os.path.isdir(REFS):
        for root, dirs, files in os.walk(REFS):
            dirs[:] = [d for d in dirs if not d.startswith(".")
                       and d not in (".git", "node_modules", "_images", "images",
                                     "Archive", "Phase_Archive", "assets", "img")]
            for fn in files:
                if not fn.lower().endswith((".md", ".txt", ".json", ".yaml", ".yml")):
                    continue
                full = os.path.join(root, fn)
                try:
                    if os.path.getsize(full) > MAX_FILE_BYTES:
                        continue
                    with open(full, errors="ignore") as f:
                        idx.append((full, os.path.relpath(full, REFS), f.read()))
                except Exception:
                    continue
    _INDEX = idx
    return idx


TOPIC_HINTS = {
    "idor": "insecure direct object reference", "bola": "broken object level authorization",
    "access control": "access control", "authz": "authorization",
    "authn": "authentication", "jwt": "json web token",
    "csrf": "cross-site request forgery", "xss": "cross site scripting",
    "sqli": "sql injection", "ssrf": "server side request forgery",
    "xxe": "xml external entity", "lfi": "local file inclusion",
    "rce": "remote code execution", "oauth": "oauth",
    "graphql": "graphql", "mass assignment": "mass assignment",
    "cache": "web cache deception", "race": "race condition",
    "smuggling": "request smuggling", "csrf": "cross site request forgery",
    "prototype": "prototype pollution", "deserial": "deserialization",
    "business logic": "business logic", "webhook": "webhook",
    "recon": "reconnaissance", "enumeration": "enumeration",
}


def corpus_search(query, max_results=6, context=3, prefer=None):
    """Search local reference docs (OWASP cheatsheets, testing guide, payload
    library). Returns narrow passages with file:line — never whole documents."""
    terms = [t for t in (query or "").lower().split() if len(t) > 2]
    if not terms:
        terms = [TOPIC_HINTS.get((query or "").lower(), (query or "").lower())]
    if not terms:
        return "empty query"

    idx = _index()
    if not idx:
        return ("no references at %s. Clone OWASP/CheatSheetSeries, OWASP/wstg "
                "and swisskyrepo/PayloadsAllTheThings into it." % REFS)

    scored = []
    for full, rel, text in idx:
        low = text.lower()
        name = os.path.basename(rel).lower().replace("_", " ").replace(".md", "")
        ext = os.path.splitext(rel)[1].lower()

        # Prose only. Index files, HTML and link lists drown real documentation.
        if ext not in (".md", ".txt"):
            continue
        lines = text.splitlines()
        if not lines:
            continue
        linkish = sum(1 for l in lines
                      if l.strip().startswith(("<", "|", "*", "-[")) or "](" in l)
        if linkish / len(lines) > 0.45:
            continue

        total = 0
        positions = []
        for t in terms:
            c = low.count(t)
            total += c
            if c:
                positions.append((c, t))
            if t in name:                      # filename match is a strong signal
                total += 8
        if prefer and prefer.lower() in name:
            total += 5
        if "/cheatsheets/" in rel.lower():
            total += 4                      # curated, dense, directly actionable
        if total:
            scored.append((total, rel, text, sorted(positions, reverse=True)))

    if not scored:
        return ("no match for %r across %d documents. Try corpus_topics to see "
                "what is available." % (query, len(idx)))

    scored.sort(key=lambda x: -x[0])
    out = ["CORPUS SEARCH %r  (%d docs indexed, %d matched)"
           % (query, len(idx), len(scored)), ""]

    for total, rel, text, _ in scored[:max_results]:
        lines = text.splitlines()
        low = text.lower()
        best_line, best_hits = 0, -1
        for i in range(len(lines)):
            window = "\n".join(lines[i:i + 8]).lower()
            h = sum(window.count(t) for t in terms)
            if h > best_hits:
                best_hits, best_line = h, i
        start = max(0, best_line - context)
        end = min(len(lines), best_line + context * 3)
        heading = next((l.strip() for l in lines[:best_line + 1]
                        if l.strip().startswith("#")), "")
        out.append("--- %s  [score %d]  %s" % (rel, total, heading[:70]))
        for i in range(start, end):
            mark = ">" if i == best_line else " "
            out.append("  %s%4d| %s" % (mark, i + 1, lines[i][:190]))
        out.append("")

    out.append("Passages only — never load whole documents into context.")
    return "\n".join(out)


def corpus_topics():
    """List what is actually in the local corpus, grouped by source."""
    idx = _index()
    if not idx:
        return "corpus empty at %s" % REFS
    groups = {}
    for _, rel, _t in idx:
        top = rel.split(os.sep)[0]
        groups.setdefault(top, 0)
        groups[top] += 1
    total = sum(len(t) for _, _, t in idx) / 1_000_000
    out = ["CORPUS — %d documents, %.1f MB text" % (len(idx), total), ""]
    for g, n in sorted(groups.items(), key=lambda x: -x[1]):
        out.append("  %-24s %d docs" % (g, n))
    out.append("")
    out.append("Query with a concept, not a document name:")
    out.append("  corpus_search('IDOR vs broken object level authorization')")
    out.append("  corpus_search('how to prove an IDOR with two accounts')")
    out.append("  corpus_search('business logic abuse', prefer='business logic')")
    return "\n".join(out)


# ------------------------------------------------------------------ server

srv = Server("analysis", "1.0.0")

srv.tool("extract_endpoints", "Mine a JS/TS bundle for API paths, external "
        "services, object identifiers and hardcoded secrets.",
        {"type": "object", "required": ["source"], "properties": {
            "source": {"type": "string", "description": "file contents"},
            "redact_secrets": {"type": "boolean", "description": "default true"}}},
        extract_endpoints)

srv.tool("diff_responses", "Diff two HTTP responses. The core IDOR evidence "
        "artifact - the only difference should be the object you had no right to read.",
        {"type": "object", "required": ["response_a", "response_b"], "properties": {
            "response_a": {"type": "string"}, "response_b": {"type": "string"},
            "label_a": {"type": "string"}, "label_b": {"type": "string"},
            "redact_patterns": {"type": "string", "description": "regex, comma separated"},
            "ignore_headers": {"type": "string"},
        "comparison": {"type": "string", "description":
            "cross-identity (default, two different users - the IDOR test) or "
            "same-identity (one user, two requests). Changes the interpretation."}}},
        diff_responses)

srv.tool("jwt_decode", "Decode a JWT and triage algorithm, expiry and "
        "claim contents. Decoding does NOT prove validity.",
        {"type": "object", "required": ["token"], "properties": {
            "token": {"type": "string"}}},
        jwt_decode)

srv.tool("corpus_search", "Search local OWASP cheat sheets, the Web Security "
        "Testing Guide and the payload library. Returns narrow passages with "
        "file:line. Use this instead of loading whole documents.",
        {"type": "object", "required": ["query"], "properties": {
            "query": {"type": "string", "description": "a concept, not a filename"},
            "max_results": {"type": "integer", "description": "default 6"},
            "context": {"type": "integer", "description": "context lines, default 3"},
            "prefer": {"type": "string", "description": "boost a topic substring"}}},
        corpus_search)

srv.tool("corpus_topics", "List what is in the local reference corpus.",
        {"type": "object", "properties": {}}, corpus_topics)

srv.tool("parse_burp", "Extract hosts, methods and notable requests from a "
        "Burp XML project export.",
        {"type": "object", "required": ["path"], "properties": {
            "path": {"type": "string"}, "max_items": {"type": "integer"}}},
        parse_burp)

if __name__ == "__main__":
    srv.run()