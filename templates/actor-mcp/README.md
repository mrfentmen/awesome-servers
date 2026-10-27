# Jobicy Jobs MCP Server

Remote job listings from the public [Jobicy](https://jobicy.com) API, served over the [Model Context Protocol](https://modelcontextprotocol.io) so any MCP client (Claude, Cursor, ChatGPT connectors, custom agents) can search live remote jobs.

No API key, no signup with Jobicy, no scraping. This Actor wraps the keyless `jobicy-mcp` stdio server and exposes it over streamable HTTP.

> Unofficial. This Actor is not affiliated with or endorsed by Jobicy.

## Connect

Standby MCP endpoint (streamable HTTP):

```
https://mrfentmen--jobicy-jobs-mcp.apify.actor/mcp
```

Pass your Apify API token as a bearer token, exactly like the official [Apify MCP server](https://apify.com/mcp):

```
Authorization: Bearer <YOUR_APIFY_API_TOKEN>
```

Example client config:

```json
{
  "mcpServers": {
    "jobicy-jobs": {
      "url": "https://mrfentmen--jobicy-jobs-mcp.apify.actor/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_APIFY_API_TOKEN"
      }
    }
  }
}
```

## Tools

### `jobs`

List remote jobs, filtered by region, industry or skill tag.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `count` | number | no | Max results to return (1-50, default 5). |
| `geo` | string | no | Region filter, for example `usa` or `europe`. |
| `industry` | string | no | Industry filter, for example `marketing`. |
| `tag` | string | no | Skill tag filter, for example `python`. |

Returns title, company, location, level, industry, employment type, published salary and URL per job.

### `job_details`

Get the full description for every job matching a title, company or skill, searched across the 50 most recent postings.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `query` | string | yes | Words to match against title, company, industry or summary. |
| `geo` | string | no | Optional region filter. |

### `industries`

Show which industries are hiring the most remote workers right now, with live job counts.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `geo` | string | no | Optional region filter. |

### `top_salaries`

List the highest-paying remote jobs that publish a salary, annualized so hourly, monthly and yearly ranges can be compared.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `count` | number | no | How many jobs to show (1-50, default 10). |
| `geo` | string | no | Region filter, for example `usa`. |
| `industry` | string | no | Industry filter. |
| `tag` | string | no | Skill tag filter. |

## Pricing

[Pay per event](https://docs.apify.com/platform/actors/publishing/monetize). You are only charged for what you use:

| Event | Price (USD) | When |
| --- | --- | --- |
| Tool call | $0.01 | Each MCP tool call |
| List request | $0.001 | Listing tools/resources/prompts |
| Resource request | $0.001 | Reading an MCP resource |
| Prompt request | $0.001 | Running an MCP prompt |
| Completion request | $0.0001 | MCP completion request |

Example: 100 job searches costs $1.00.

## Data source

Public Jobicy API (`https://jobicy.com/api/v2/remote-jobs`). Read-only: this Actor never writes to your account and never asks for third-party credentials.

## Source

Built from the [ts-mcp-proxy](https://apify.com/templates/ts-mcp-proxy) template. The proxied MCP server is vendored under `vendor/jobicy-mcp`.
