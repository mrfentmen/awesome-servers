# Mixpanel MCP

## Tagline
MCP server for Mixpanel product analytics. Query events, funnels, retention, cohorts, and user profi

## Description
MCP server for Mixpanel product analytics. Query events, funnels, retention, cohorts, and user profiles. Published from a private commercial monorepo. Not affiliated with or endorsed by Mixpanel.

## Setup Requirements
- `MIXPANEL_API_SECRET` (required): set in your MCP client config before use.
- `MIXPANEL_PROJECT_ID` (required): set in your MCP client config before use.
- `MIXPANEL_SERVICE_ACCOUNT` (required): set in your MCP client config before use.
- `MIXPANEL_SERVICE_SECRET` (required): set in your MCP client config before use.

## Category
Data & Analytics

## Features
- Query events: Query raw event data from Mixpanel. Segment events by time range and properties.
- Get top events: Get the most frequently tracked events in a time window.
- Get funnel: Get funnel conversion data. Requires a funnel ID from your Mixpanel project.
- Get retention: Get cohort retention data. See how many users come back over time.
- Query profiles: Search and query user profiles in Mixpanel.
- Run jql: Execute a raw JavaScript Query Language (JQL) script against Mixpanel. For advanced custom queries.
- List events: List all tracked event names in your Mixpanel project.

## Getting Started
- "Ask your assistant about mixpanel using this server once installed"
- Tool: query_events — Query raw event data from Mixpanel. Segment events by time range and properties.
- Tool: get_top_events — Get the most frequently tracked events in a time window.
- Tool: get_funnel — Get funnel conversion data. Requires a funnel ID from your Mixpanel project.
- Tool: get_retention — Get cohort retention data. See how many users come back over time.
- Tool: query_profiles — Search and query user profiles in Mixpanel.
- Tool: run_jql — Execute a raw JavaScript Query Language (JQL) script against Mixpanel. For advanced custom queries.
- Tool: list_events — List all tracked event names in your Mixpanel project.

## Tags
mixpanel, mcp, data, api

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/mixpanel-mcp
