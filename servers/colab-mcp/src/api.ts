export class ColabError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ColabError";
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const MCP_URL = "https://colaboratory.googleapis.com/mcp";

function token(): string {
  const t =
    process.env.COLAB_TOKEN ?? process.env.GOOGLE_OAUTH_TOKEN ?? process.env.GOOGLE_ACCESS_TOKEN;
  if (!t)
    throw new ColabError(
      "Set COLAB_TOKEN (Google OAuth access token with colaboratory scope). Get one via `gcloud auth print-access-token` after `gcloud auth login`."
    );
  return t;
}

// Calls Google's Colab MCP endpoint (tools/call) with the user's OAuth token.
async function mcpCall(tool: string, args: Record<string, unknown>): Promise<string> {
  let res: Response;
  try {
    res = await fetch(MCP_URL, {
      method: "POST",
      signal: AbortSignal.timeout(600000),
      headers: {
        ...UA,
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: tool, arguments: args } }),
    });
  } catch (e) {
    throw new ColabError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const b = (await res.text()).slice(0, 500);
    throw new ColabError(`Colab HTTP ${res.status}: ${b}`);
  }
  return (await res.text()).slice(0, 60000);
}

export function listRuntimes(): Promise<string> {
  return mcpCall("list_runtimes", {});
}

export function listRuntimeSpecs(): Promise<string> {
  return mcpCall("list_runtime_specs", {});
}

export function createRuntime(spec = ""): Promise<string> {
  const args: Record<string, unknown> = { requestId: `r-${Date.now()}` };
  if (spec) args["spec"] = spec;
  return mcpCall("create_runtime", args);
}

export function executeCode(code: string, session = "", runtime = "", executionId = ""): Promise<string> {
  const args: Record<string, unknown> = { code };
  if (session) args["session"] = session;
  else if (runtime) args["runtime"] = runtime;
  else throw new ColabError("Pass session or runtime.");
  args["executionId"] = executionId || `e-${Date.now()}`;
  return mcpCall("execute_code", args);
}

export function createSession(runtime: string, session = ""): Promise<string> {
  const args: Record<string, unknown> = { runtime };
  if (session) args["session"] = session;
  return mcpCall("create_session", args);
}

export function getSubscription(): Promise<string> {
  return mcpCall("get_subscription", {});
}
