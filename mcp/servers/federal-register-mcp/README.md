# federal-register-mcp

Search the official Federal Register API for rules, proposed rules, notices, presidential documents, agencies, and document metadata.

## Tools

- `search_documents`: search by term, document type, publication date range, and page.
- `get_document`: retrieve one document by document number.
- `list_agencies`: list agencies represented by the API.

The server is read-only and keyless. Federal Register publication is not the same as legal advice or proof that a rule is currently in force. Check the linked official document and effective dates before acting.

## Run

```bash
npm install
npm run build
node dist/index.js
```
