import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sparql",
  "displayName": "SPARQL",
  "version": "1.0.0",
  "extensions": [
    ".rq",
    ".sparql"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "'",
    "\""
  ],
  "symbols": [
    {
      "kind": "prefix",
      "pattern": "^\\s*PREFIX\\s+([A-Za-z_][A-Za-z0-9_-]*):"
    },
    {
      "kind": "variable",
      "pattern": "\\?([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "select",
      "pattern": "^\\s*SELECT\\s+([^\\{]+)"
    }
  ],
  "imports": [
    {
      "kind": "prefix",
      "pattern": "^\\s*PREFIX\\s+([A-Za-z_][A-Za-z0-9_-]*):"
    }
  ],
  "scaffold": [
    {
      "path": "query.rq",
      "content": "PREFIX ex: <https://example.org/>\nSELECT ?person WHERE { ?person ex:name \"Bond\" }\n"
    },
    {
      "path": "tests/run.rq",
      "content": "SELECT (2 + 2 AS ?value) WHERE {}\n"
    }
  ],
  "snippets": {
    "select": {
      "description": "select",
      "body": "SELECT ?subject WHERE {\n  ?subject ?predicate ?object .\n}"
    },
    "prefix": {
      "description": "prefix",
      "body": "PREFIX ex: <https://example.org/>"
    },
    "filter": {
      "description": "filter",
      "body": "FILTER(?value > 0)"
    }
  },
  "reference": "SPARQL syntax reference\n- Prefix: PREFIX ex: <https://example.org/>\n- Select: SELECT ?subject WHERE { ?subject ?predicate ?object . }\n- Ask: ASK { ?subject ?predicate ?object . }\n- Construct: CONSTRUCT { ?s ?p ?o } WHERE { ... }\n- Filter: FILTER(?value > 0)\n- Optional: OPTIONAL { ... }\n- Limit: LIMIT 10\n- Comment: # line"
}
