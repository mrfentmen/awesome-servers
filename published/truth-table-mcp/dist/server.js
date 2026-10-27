import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checkTautology, evaluateExpression, truthTable, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "truth-table-mcp", version: "1.0.0" });
    server.tool("evaluate_expression", "Evaluate a boolean expression with named variables.", {
        expression: z.string().min(1).describe('Expression using ! & | -> <-> xor, e.g. "a & (b | !c)"'),
        variables: z.record(z.boolean()).describe('Variable values, e.g. {"a": true, "b": false}')
    }, async (a) => {
        try {
            return text(await evaluateExpression(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("truth_table", "Build the complete truth table for an expression and list its variables.", {
        expression: z.string().min(1).describe("Boolean expression with up to 8 variables")
    }, async (a) => {
        try {
            return text(await truthTable(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("check_tautology", "Test whether an expression is a tautology, contradiction or contingent.", {
        expression: z.string().min(1).describe("Boolean expression")
    }, async (a) => {
        try {
            return text(await checkTautology(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
