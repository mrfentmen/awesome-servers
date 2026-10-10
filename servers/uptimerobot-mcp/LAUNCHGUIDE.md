# Uptime Monitor MCP

## Tagline
Uptime, port, TLS and DNS checks for any site - no API key.

## Description
Monitor from your AI assistant: check one URL or sweep ten at once, probe TCP ports to see which services answer, watch TLS certificate expiry and read a domain's DNS records. Every check runs live from the server itself, with no account and no key. An independent MCP server. Not affiliated with or endorsed by UptimeRobot.

## Setup Requirements
No setup. Every check runs live from the server itself, so there is no key or account.

## Category
Developer Tools

## Features

- Check URL: Is a page up right now: HTTP status, response time, server, redirect chain and the first text on the page.
- Check many endpoints: Up/down sweep of up to 10 URLs in one call, with status code and response time for each.
- Port monitor: Check whether TCP ports on a host accept connections, with the service usually found on each port.
- TLS expiry: Days left on a site's TLS certificate, who issued it and whether the chain is trusted.
- DNS health: A, AAAA, NS, MX, TXT and CAA records for a domain, plus whether SPF is published.
- Monitor report: One call that runs the whole monitor sweep on a URL: reachability, TLS certificate and DNS, with a verdict.

## Getting Started

- Ask your assistant about uptimerobot using this server once installed
- Tool: check_url — Is a page up right now: HTTP status, response time, server, redirect chain and the first text on the page.
- Tool: check_endpoints — Up/down sweep of up to 10 URLs in one call, with status code and response time for each.
- Tool: port_monitor — Check whether TCP ports on a host accept connections, with the service usually found on each port.
- Tool: ssl_expiry — Days left on a site's TLS certificate, who issued it and whether the chain is trusted.
- Tool: dns_health — A, AAAA, NS, MX, TXT and CAA records for a domain, plus whether SPF is published.
- Tool: monitor_report — One call that runs the whole monitor sweep on a URL: reachability, TLS certificate and DNS, with a verdict.

## Tags
uptime, monitoring, ports, ssl, dns, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/uptimerobot-mcp
