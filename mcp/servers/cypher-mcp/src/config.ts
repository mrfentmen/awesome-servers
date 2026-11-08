import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cypher",
  "displayName": "Cypher",
  "version": "1.0.0",
  "extensions": [
    ".cyp",
    ".cypher"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "'",
    "\""
  ],
  "symbols": [
    {
      "kind": "node",
      "pattern": "^\\s*CREATE\\s*\\(\\s*([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "match",
      "pattern": "^\\s*MATCH\\s*\\(\\s*([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "constraint",
      "pattern": "^\\s*CREATE\\s+CONSTRAINT\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "index",
      "pattern": "^\\s*CREATE\\s+INDEX\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "csv",
      "pattern": "^\\s*LOAD\\s+CSV\\s+FROM\\s+['\"]([^'\"]+)"
    }
  ],
  "runner": [
    {
      "command": "cypher-shell",
      "args": [
        "-f",
        "{file}"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "queries/create.cypher",
      "content": "CREATE (demo:Person {name: 'Bond'});\nMATCH (demo:Person) RETURN demo.name;\n"
    },
    {
      "path": "tests/run.cypher",
      "content": "RETURN 2 + 2 AS value;\n"
    }
  ],
  "snippets": {
    "node": {
      "description": "create node",
      "body": "CREATE (name:Label {key: 'value'});"
    },
    "match": {
      "description": "match",
      "body": "MATCH (name:Label) WHERE name.key = 'value' RETURN name;"
    },
    "relationship": {
      "description": "relationship",
      "body": "MATCH (a), (b) WHERE a.id = 1 AND b.id = 2 CREATE (a)-[:RELATES_TO]->(b);"
    }
  },
  "reference": "Cypher syntax reference\n- Node: CREATE (name:Label {key: 'value'});\n- Match: MATCH (name:Label) WHERE name.key = 'value' RETURN name;\n- Relationship: CREATE (a)-[:RELATES_TO]->(b);\n- Merge: MERGE (name:Label {id: 1});\n- Constraint: CREATE CONSTRAINT name FOR (n:Label) REQUIRE n.id IS UNIQUE;\n- Index: CREATE INDEX name FOR (n:Label) ON (n.value);\n- Load CSV: LOAD CSV FROM 'file.csv' AS row;\n- Comment: // line; /* block */"
}
