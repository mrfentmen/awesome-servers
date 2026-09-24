# Mixpanel MCP

An MCP server for Mixpanel product analytics. Query events, funnels, retention, cohorts, and user profiles through natural language.

## What it does

Connect your Mixpanel analytics to any MCP client. Ask questions like "What are our top events this week?" or "Show me retention for users who signed up last month" and get structured answers.

## Tools

- query_events. Raw event data with time ranges and filters.
- get_top_events. Most frequently tracked events.
- get_funnel. Multi-step funnel conversion rates.
- get_retention. Cohort retention over days, weeks, or months.
- query_profiles. Search and filter user profiles.
- run_jql. Execute raw JavaScript Query Language for custom analysis.
- list_events. All tracked event names in your project.

## Authentication

Set these environment variables:

```bash
export MIXPANEL_SERVICE_ACCOUNT="your-service-account"
export MIXPANEL_SERVICE_SECRET="your-service-secret"
export MIXPANEL_PROJECT_ID="your-project-id"
```

Service accounts are created in Mixpanel under Project Settings > Service Accounts.

## Install

```bash
npx mixpanel-mcp
```

## Claude Desktop setup

```json
{
  "mcpServers": {
    "mixpanel": {
      "command": "npx",
      "args": ["-y", "mixpanel-mcp"],
      "env": {
        "MIXPANEL_SERVICE_ACCOUNT": "your-account",
        "MIXPANEL_SERVICE_SECRET": "your-secret",
        "MIXPANEL_PROJECT_ID": "your-project-id"
      }
    }
  }
}
```

## Example usage

Ask Claude:

"What are our top 10 events this week?"

"Show me the conversion funnel for funnel ID 12345"

"Get retention for users who signed Up in the last 30 days"

"Run a JQL query to find users who purchased more than 3 times"

"List all events we are tracking"

"Search for user profiles with email containing @gmail.com"

## JQL support

JQL (JavaScript Query Language) lets you write custom analysis scripts. Example:

```javascript
function main() {
  return People().filter(function (user) {
    return user.properties.plan === "premium"
  })
}
```

## License

MIT
