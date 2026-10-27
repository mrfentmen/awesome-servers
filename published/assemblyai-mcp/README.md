# assemblyai-mcp

Query the AssemblyAI API (free tier key; set ASSEMBLYAI_API_KEY, sent raw as Authorization): transcript list, details, and paragraphs.

## Setup

Get a free-tier API key from AssemblyAI, then:

```bash
export ASSEMBLYAI_API_KEY=your_key
npm install
npm run build
node dist/index.js
```

The key is sent to AssemblyAI as the Authorization header and nowhere else.

## Tools

- `list_transcripts` — Recent transcripts with id, status and duration.
- `get_transcript` — Transcript details and status.
- `get_paragraphs` — Paragraph-grouped transcript text.

## Source

[assemblyai-mcp](https://github.com/mrfentmen/awesome-servers)

## Licence

Every tool in this package is free: no licence key, no paid tier, no hosted gateway. Everything runs locally.
