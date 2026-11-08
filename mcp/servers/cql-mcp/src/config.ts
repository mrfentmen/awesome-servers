import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cql",
  "displayName": "CQL",
  "version": "1.0.0",
  "extensions": [
    ".cql"
  ],
  "markers": [],
  "comment": "--",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "'"
  ],
  "symbols": [
    {
      "kind": "keyspace",
      "pattern": "^\\s*CREATE\\s+KEYSPACE\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "table",
      "pattern": "^\\s*CREATE\\s+TABLE\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*CREATE\\s+TYPE\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "index",
      "pattern": "^\\s*CREATE\\s+INDEX\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "imports": [
    {
      "kind": "source",
      "pattern": "^\\s*SOURCE\\s+([^\\s]+)"
    }
  ],
  "runner": [
    {
      "command": "cqlsh",
      "args": [
        "-f",
        "{file}"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "schema.cql",
      "content": "CREATE KEYSPACE IF NOT EXISTS demo WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};\nCREATE TABLE IF NOT EXISTS demo.people (id int PRIMARY KEY, name text);\n"
    },
    {
      "path": "tests/run.cql",
      "content": "SELECT now() FROM system.local;\n"
    }
  ],
  "snippets": {
    "keyspace": {
      "description": "keyspace",
      "body": "CREATE KEYSPACE name WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};"
    },
    "table": {
      "description": "table",
      "body": "CREATE TABLE name (id int PRIMARY KEY, value text);"
    },
    "index": {
      "description": "index",
      "body": "CREATE INDEX name_idx ON name (value);"
    }
  },
  "reference": "CQL syntax reference\n- Keyspace: CREATE KEYSPACE name WITH replication = {...};\n- Table: CREATE TABLE name (id int PRIMARY KEY, value text);\n- Type: CREATE TYPE name (value text);\n- Index: CREATE INDEX name_idx ON name (value);\n- Select: SELECT * FROM name WHERE id = 1;\n- Insert: INSERT INTO name (id, value) VALUES (1, 'text');\n- Comment: -- line; /* block */\n- Run: cqlsh -f file.cql"
}
