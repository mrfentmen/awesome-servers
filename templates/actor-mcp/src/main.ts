/**
 * Jobicy Jobs MCP Server - Actor entry point.
 *
 * Proxies the `jobicy-mcp` stdio MCP server (public Jobicy API, no API key) over
 * the streamable HTTP MCP transport. In standby mode the proxy serves /mcp.
 * Outside standby the Actor health-checks the proxied server so every run
 * produces a real, verifiable dataset item.
 */
import { Actor, log } from 'apify';

import { getMcpProxyClient } from './mcp.js';
import { startServer } from './server.js';

// The stdio MCP server this Actor proxies. Vendored under vendor/jobicy-mcp (built
// from the premium-mcps repo), so no npm package is needed to start it at runtime.
const MCP_COMMAND = ['node', 'vendor/jobicy-mcp/index.js'];

const STANDBY_MODE = process.env.APIFY_META_ORIGIN === 'STANDBY';
const SERVER_PORT = parseInt(process.env.ACTOR_WEB_SERVER_PORT || '3001', 10);

await Actor.init();

if (STANDBY_MODE) {
    await startServer({
        serverPort: SERVER_PORT,
        command: MCP_COMMAND,
    });
} else {
    // Normal run: start the proxied MCP server, list its tools, report, and exit.
    const client = await getMcpProxyClient(MCP_COMMAND);
    try {
        const { tools } = await client.listTools();
        const toolNames = tools.map((tool) => tool.name);
        await Actor.pushData({
            status: 'ok',
            mcpServer: 'jobicy-mcp',
            toolCount: toolNames.length,
            tools: toolNames,
            endpoint: 'https://mrfentmen--jobicy-jobs-mcp.apify.actor/mcp',
        });
        log.info(`MCP server is healthy. Tools: ${toolNames.join(', ')}`);
        await client.close();
        await Actor.exit({
            statusMessage: `MCP server healthy with ${toolNames.length} tool(s): ${toolNames.join(', ')}`,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log.error(`MCP health check failed: ${message}`);
        await client.close();
        await Actor.exit({
            statusMessage: `MCP health check failed: ${message}`,
            exitCode: 1,
        });
    }
}
