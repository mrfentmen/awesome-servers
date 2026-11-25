import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, loraTrain, generate, trainLogTail } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

export function createServer(): McpServer {
  const server = new McpServer({ name: "mlx-mcp", version: "1.0.0" })

  server.registerTool(
    "lora_train",
    {
      title: "MLX LoRA train",
      description: "Fine-tune a model locally with mlx_lm.lora. Data dir must hold train.jsonl/valid.jsonl with pre-formatted {text} rows (granite base has no chat template — do NOT feed messages arrays).",
      inputSchema: z.object({
        model: z.string().describe("HF id or local path."),
        data: z.string().describe("Dir with train.jsonl + valid.jsonl."),
        adapter_path: z.string().describe("Output dir for adapter."),
        iters: z.string().optional(),
        batch_size: z.string().optional(),
        num_layers: z.string().optional(),
        learning_rate: z.string().optional(),
      }),
    },
    async (a) => {
      try {
        return text(await loraTrain({
          model: a.model, data: a.data, adapterPath: a.adapter_path,
          iters: a.iters, batchSize: a.batch_size,
          numLayers: a.num_layers, learningRate: a.learning_rate,
        }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "generate",
    {
      title: "MLX generate",
      description: "Run one prompt through a model + optional adapter. Eval probe runner.",
      inputSchema: z.object({
        model: z.string(),
        prompt: z.string(),
        adapter_path: z.string().optional(),
        max_tokens: z.string().optional(),
      }),
    },
    async (a) => {
      try {
        return text(await generate({
          model: a.model, prompt: a.prompt,
          adapterPath: a.adapter_path, maxTokens: a.max_tokens,
        }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "train_log_tail",
    {
      title: "Training log",
      description: "Tail a training log file. Iter climbing = working.",
      inputSchema: z.object({
        log_path: z.string(),
        lines: z.string().optional(),
      }),
    },
    async (a) => {
      try {
        return text(await trainLogTail(a.log_path, a.lines ? Number(a.lines) : 15))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
