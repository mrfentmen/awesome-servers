import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "graphql",
  "displayName": "GraphQL",
  "version": "1.0.0",
  "extensions": [
    ".graphql",
    ".gql"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "input",
      "pattern": "^\\s*input\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "union",
      "pattern": "^\\s*union\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "query",
      "pattern": "^\\s*query\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*#import\\s+\"([^\"]+)\""
    }
  ],
  "scaffold": [
    {
      "path": "schema.graphql",
      "content": "type Person {\n  id: ID!\n  name: String!\n}\n\ntype Query {\n  person(id: ID!): Person\n}\n"
    },
    {
      "path": "tests/query.graphql",
      "content": "query GetPerson {\n  person(id: 1) {\n    id\n    name\n  }\n}\n"
    }
  ],
  "snippets": {
    "type": {
      "description": "type",
      "body": "type Name {\n  id: ID!\n  value: String!\n}"
    },
    "query": {
      "description": "query",
      "body": "query GetName {\n  name {\n    id\n    value\n  }\n}"
    },
    "input": {
      "description": "input",
      "body": "input NameInput {\n  value: String!\n}"
    }
  },
  "reference": "GraphQL syntax reference\n- Type: type Name { id: ID! value: String! }\n- Input: input NameInput { value: String! }\n- Enum: enum Name { ONE TWO }\n- Interface: interface Name { id: ID! }\n- Union: union Name = A | B\n- Query: query GetName { name { id } }\n- Mutation: mutation CreateName($input: NameInput!) { ... }\n- Comment: # line"
}
