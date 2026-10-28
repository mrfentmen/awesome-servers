import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { matrixDeterminant, matrixInverse, matrixMultiply, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "matrix-mcp", version: "1.0.0" });
    server.tool("matrix_multiply", "Multiply two matrices and show the result.", {
        a: z.array(z.array(z.number())).min(1).describe("Left matrix as rows"),
        b: z.array(z.array(z.number())).min(1).describe("Right matrix as rows")
    }, async (a) => {
        try {
            return text(await matrixMultiply(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("matrix_determinant", "Compute a square matrix determinant with fraction-free elimination.", {
        matrix: z.array(z.array(z.number())).min(1).describe("Square matrix as rows")
    }, async (a) => {
        try {
            return text(await matrixDeterminant(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("matrix_inverse", "Invert a square matrix using Gauss-Jordan elimination.", {
        matrix: z.array(z.array(z.number())).min(1).describe("Square matrix as rows")
    }, async (a) => {
        try {
            return text(await matrixInverse(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
