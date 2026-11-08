import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sql",
  "displayName": "SQL",
  "version": "1.0.0",
  "extensions": [
    ".sql"
  ],
  "markers": [],
  "comment": "--",
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
      "kind": "table",
      "pattern": "^\\s*CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "view",
      "pattern": "^\\s*CREATE\\s+VIEW\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "index",
      "pattern": "^\\s*CREATE\\s+INDEX\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*CREATE\\s+FUNCTION\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "imports": [
    {
      "kind": "source",
      "pattern": "^\\s*(?:SOURCE|\\\\i)\\s+([^\\s]+)"
    }
  ],
  "runner": [
    {
      "command": "sqlite3",
      "args": [
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "sqlite3",
      "args": [
        "tests/run.sql"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "schema.sql",
      "content": "CREATE TABLE demo (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL\n);\n\nINSERT INTO demo (name) VALUES ('Bond');\n"
    },
    {
      "path": "tests/run.sql",
      "content": "CREATE TABLE t (value INTEGER);\nINSERT INTO t VALUES (4);\nSELECT 2 + 2;\n"
    }
  ],
  "snippets": {
    "table": {
      "description": "table",
      "body": "CREATE TABLE name (\n  id INTEGER PRIMARY KEY,\n  value TEXT\n);"
    },
    "select": {
      "description": "select",
      "body": "SELECT id, value FROM name WHERE id = 1;"
    },
    "index": {
      "description": "index",
      "body": "CREATE INDEX name_idx ON name (value);"
    }
  },
  "reference": "SQL syntax reference\n- Table: CREATE TABLE name (id INTEGER PRIMARY KEY, value TEXT);\n- Select: SELECT id, value FROM name WHERE id = 1;\n- Insert: INSERT INTO name (value) VALUES ('text');\n- Update: UPDATE name SET value = 'x' WHERE id = 1;\n- Join: SELECT * FROM a JOIN b ON a.id = b.a_id;\n- Index: CREATE INDEX name_idx ON name (value);\n- View: CREATE VIEW name AS SELECT ...;\n- Comment: -- line; /* block */\n- Run: sqlite3 file.sql"
}
